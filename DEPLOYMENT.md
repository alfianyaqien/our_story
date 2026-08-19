# Deploying Our Story

Target: `story.alfianyaqien.my.id` on the existing VPS (`103.55.38.224`), alongside
`wedding` (port 3000) and `moment` (port 3001). This app takes **port 3002**.

Conventions follow the two apps already on that box: `/srv/<app>/{current,releases,shared}`,
a dedicated system user, `EnvironmentFile`, a release symlink swapped on deploy, and
a nightly systemd timer for backups.

## Constraints worth knowing before you start

**RAM is the limiting factor.** 1967 MB total, shared with two live client apps.
`next build` peaks around 1–1.5 GB, so **the build never happens on the server** —
CI builds it and ships a ~8 MB tarball. If you ever build there, you risk the
kernel OOM-killing someone's wedding site.

**MariaDB is the first database server on this box.** `wedding` uses SQLite. The
tuning drop-in in `deploy/mariadb/60-story.cnf` pins the buffer pool to 128 MB so
its footprint is predictable rather than "whatever MySQL feels like".

**`ENCRYPTION_KEY` is unrecoverable.** Love letters are AES-256-GCM under a key
derived from it. Lose it and they are gone; change it and existing letters stop
decrypting. It is in the nightly backup for exactly this reason.

---

## One-time server setup

### 1. User and directories

`/bin/bash`, not `/usr/sbin/nologin`. CI connects as `story` over SSH to run
`deploy.sh`, and sshd cannot exec a command for an account whose shell is
`nologin` — it answers `This account is currently not available.` and the deploy
fails at the last step. The key is restricted in `authorized_keys` instead (§6),
which is where that restriction belongs.

```bash
sudo adduser --system --group --home /srv/story --shell /bin/bash story
sudo mkdir -p /srv/story/{releases,shared/uploads,incoming,bin} /var/backups/story
sudo chown -R story:story /srv/story /var/backups/story
sudo chmod 700 /srv/story/shared
```

### 2. MariaDB

```bash
sudo apt update && sudo apt install -y mariadb-server mariadb-client
sudo cp deploy/mariadb/60-story.cnf /etc/mysql/mariadb.conf.d/
sudo systemctl restart mariadb
sudo mariadb-secure-installation      # set a root password, remove anon users
```

Create the database and a least-privilege user. Deliberately **not** `GRANT ALL
ON *.*`: if this app is ever compromised, the credential must not reach anything
else on the host.

```bash
sudo mariadb <<'SQL'
CREATE DATABASE our_story CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'story_app'@'127.0.0.1' IDENTIFIED BY 'PUT_A_STRONG_PASSWORD_HERE';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON our_story.* TO 'story_app'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
```

Confirm it is loopback-only — nothing outside the host should reach it:

```bash
sudo ss -tlnp | grep 3306      # expect 127.0.0.1:3306, never 0.0.0.0
```

### 3. Environment file

```bash
sudo install -m 600 -o story -g story deploy/env.example /srv/story/shared/env
sudo -u story nano /srv/story/shared/env
openssl rand -base64 48        # once for SESSION_SECRET, once for ENCRYPTION_KEY
```

Generate **fresh** secrets; do not copy the development ones. Every value with a
space or a shell metacharacter must stay quoted — this file is both a systemd
`EnvironmentFile` and sourced by `deploy.sh`, and an unquoted
`EMAIL_FROM=Our Story <x@y>` is a shell parse error that breaks deploys while
working fine in development.

### 4. Migration dependency note

Nothing to do: each release carries its own `mysql2` in `.migrate/`. Next's
dependency tracing bundles `mysql2` into the compiled routes but leaves it out of
`node_modules`, so `run-migrations.js` — plain CommonJS — would otherwise die
with `MODULE_NOT_FOUND`.

### 5. Scripts, systemd, sudoers

```bash
sudo install -m 750 -o story -g story deploy/bin/deploy.sh /srv/story/bin/deploy.sh
sudo install -m 750 -o story -g story deploy/bin/backup.sh /srv/story/bin/backup.sh
sudo cp deploy/systemd/story.service deploy/systemd/story-backup.{service,timer} /etc/systemd/system/
sudo install -m 0440 -o root -g root deploy/sudoers/story /etc/sudoers.d/story
sudo visudo -c
sudo systemctl daemon-reload
sudo systemctl enable story story-backup.timer
```

`story` gets exactly three sudo verbs on its own unit and nothing else.

### 6. Deploy key for CI

```bash
sudo -u story mkdir -p /srv/story/.ssh && sudo -u story chmod 700 /srv/story/.ssh
ssh-keygen -t ed25519 -f /tmp/story_deploy -N '' -C 'github-actions-story'
# `restrict` disables port forwarding, agent forwarding, X11 and pty allocation.
# scp and remote command execution still work, which is all CI needs — so this
# key cannot be used to tunnel to MariaDB on 127.0.0.1:3306. (Verified: no bytes
# traverse a `-L 19999:127.0.0.1:3306` forward.)
printf 'restrict %s\n' "$(cat /tmp/story_deploy.pub)" \
  | sudo -u story tee /srv/story/.ssh/authorized_keys
sudo -u story chmod 600 /srv/story/.ssh/authorized_keys
ssh-keyscan -H 103.55.38.224
```

Add to the repo's **production** environment secrets, then delete `/tmp/story_deploy*`:

| Secret | Value |
| --- | --- |
| `DEPLOY_SSH_KEY` | contents of `/tmp/story_deploy` (the private key) |
| `DEPLOY_HOST` | `103.55.38.224` |
| `DEPLOY_KNOWN_HOSTS` | the `ssh-keyscan` output |

The workflow pins the host key rather than using `StrictHostKeyChecking=no`, so a
man-in-the-middle cannot quietly receive a release.

### 7. DNS, then Caddy

Create an `A` record: `story.alfianyaqien.my.id` → `103.55.38.224`. If the domain
sits behind Cloudflare, leave it grey (proxy off) so Caddy can complete the ACME
challenge. Verify with `dig +short story.alfianyaqien.my.id` before continuing —
Caddy will fail issuance and back off if the record is missing.

Generate the soft-launch password hash **yourself** and paste only the hash:

```bash
caddy hash-password
```

Then append the block from `deploy/caddy/story.Caddyfile` to `/etc/caddy/Caddyfile`,
replace `REPLACE_WITH_BCRYPT_HASH`, and:

```bash
caddy validate --config /etc/caddy/Caddyfile   # NOT under sudo — see below
sudo systemctl reload caddy
```

**Do not run `caddy validate` under `sudo`.** Validating loads the config, which
opens the log writer and *creates* `/var/log/caddy/story.log` — owned by `root`
if you ran it as root. Caddy itself runs as `caddy`, so the subsequent reload
fails with `open /var/log/caddy/story.log: permission denied` and keeps serving
the old config. If it already happened:

```bash
sudo chown caddy:caddy /var/log/caddy/story.log
sudo systemctl reload caddy
```

Caddy rejecting a bad config and continuing on the old one is the good failure
mode here — the two client sites never went down while this was sorted out.

Do **not** add a `file_server` alias for the uploads directory. Uploads live
outside the web root on purpose and are streamed by `/api/media` only after a
session and story-membership check; serving them statically would hand every
photo to anyone holding a URL.

---

## Deploying

**Automatic on every push to `main`.** No manual step, and migrations run as part
of it. `paths-ignore` skips documentation-only commits so they do not restart a
box that also serves two client apps; the *Run workflow* button is still there to
force one.

The pipeline is safe to leave unattended because each stage fails closed:

| Stage | Failure behaviour |
| --- | --- |
| `npm run build` in CI | Same command CI runs as its type check. A commit that does not compile never reaches the server. |
| Migrations | Run **before** the symlink swap, so a failed migration leaves the previous release serving. |
| Health poll | 30s. If the app does not answer, `deploy.sh` repoints the symlink at the previous release and restarts. |
| Concurrency | `cancel-in-progress: false`, so two deploys queue rather than swapping the symlink underneath each other. |

The build never happens on the server — that box has 1967 MB shared with two
client apps and `next build` peaks at 1–1.5 GB.

`deploy.sh` unpacks to a timestamped release, asserts `server.js`, `.next/static`,
`public` and the bundled `mysql2` all arrived, runs migrations, swaps the symlink,
restarts, then polls the app. **If it does not come up within 30 s it repoints the
symlink at the previous release and restarts** — so a bad deploy self-heals.

### First deploy

The database is empty, so `run-migrations.js` applies `000_baseline.sql` and records
`001`–`009` as superseded. Those older files remain in the repo for history but are
not in the runner's list: `009` contained `DELETE FROM` across every feature table,
correct once against a development database and never appropriate for production.

### Smoke test

```bash
curl -sI https://story.alfianyaqien.my.id/ | head -1                    # 200 (or 401 while basic auth is on)
curl -s -o /dev/null -w '%{http_code}\n' https://story.alfianyaqien.my.id/api/auth/session   # 401 signed out
sudo journalctl -u story -n 30 --no-pager
```

Then in a browser: sign up, click the verification link from the Resend email, log
in, create a story, upload a photo, confirm it renders. That last step matters —
it is the one path that touches the filesystem, and `ProtectSystem=strict` would
surface as a read-only error in the journal if `UPLOAD_DIR` were wrong.

### Rollback

```bash
ls -1dt /srv/story/releases/*/            # newest first
sudo -u story ln -sfnT /srv/story/releases/<previous> /srv/story/current
sudo systemctl restart story
```

No rebuild, no download. Migrations are **not** reversed — if a deploy changed the
schema, roll that back deliberately.

---

## Backups

`story-backup.timer` runs at 03:30 (the other two apps use 03:00; three concurrent
dumps on 2 vCPUs is needless contention). Each run writes a gzipped `mysqldump`, a
tar of `shared/uploads`, and a copy of the environment file to `/var/backups/story`,
keeping 14 days, all at mode `600`.

The dump deliberately runs **without** `--routines --events`. Both need
privileges `story_app` does not have, and `EVENT` implies `CREATE EVENT` — giving
that to the credential the app process loads would let an app compromise schedule
arbitrary SQL. The schema is plain tables, so nothing is lost.

That assumption is guarded in CI (`schema-guard` in `ci.yml`), not at backup time.
It cannot be checked at backup time: `information_schema` filters rows by
privilege, so `story_app` counts **0** routines and **0** triggers even when they
exist — measured directly, root saw 1 and `story_app` saw 0. A runtime check
there would be blind and would read as reassurance.

The environment copy is what makes the set restorable rather than merely present:
the dump cannot be decrypted without `ENCRYPTION_KEY`.

Offsite is scripted but inert until a remote literally named `story-offsite` exists:

```bash
sudo -u story -H rclone config      # create a remote named exactly: story-offsite
sudo systemctl start story-backup   # verify by hand
```

### Restoring

```bash
sudo systemctl stop story
gunzip -c /var/backups/story/db-<stamp>.sql.gz | sudo mariadb our_story
sudo -u story tar -xzf /var/backups/story/uploads-<stamp>.tar.gz -C /srv/story/shared
# and restore ENCRYPTION_KEY from env-<stamp> if the secret was lost
sudo systemctl start story
```

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| App boots then exits, journal says environment is not configured | `lib/env.ts` refuses to start in production on a missing, short, or placeholder secret. Read the message; it names the variable. |
| Pages load but nothing saves | A `Host` rewrite in Caddy. Next compares `Host` against `X-Forwarded-Host` for Server Actions. Do not set `header_up Host`. |
| Every asset 404s, page renders unstyled | `.next/static` or `public` missing from the release. `deploy.sh` asserts both, so this means the assemble step changed. |
| No verification or reset email | Two candidates: the Resend domain is unverified, or `NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000` is missing from the unit. This host drops the first SYN; Node gives up in ~750 ms and reports a bare timeout while `curl` succeeds. |
| Uploads fail with a read-only error | `UPLOAD_DIR` points outside `ReadWritePaths=/srv/story/shared`. |
| Photos 404 for a partner who should see them | Correct behaviour if they are not a member of that story. `/api/media` answers 404 rather than 403 so it cannot be used to probe other stories. |
| `MODULE_NOT_FOUND: mysql2` during migrations | The release lacks `.migrate/node_modules`. See the assemble step in the deploy workflow. |
