#!/usr/bin/env bash
#
# /srv/story/bin/deploy.sh
#
# Runs ON THE SERVER as the `story` user. CI uploads a release tarball to
# /srv/story/incoming/, then invokes this over SSH.
#
#   ./deploy.sh /srv/story/incoming/release-20260819T120000.tar.gz
#
# The shape is deliberately the same as wedding's: unpack a new release
# alongside the old ones, run migrations, swap a symlink, restart. A rollback is
# then repointing the symlink at the previous release and restarting — no
# rebuild, no re-download.
set -euo pipefail

ROOT=/srv/story
TARBALL=${1:?usage: deploy.sh <release tarball>}
KEEP=5   # releases retained, so a rollback target always exists

[[ -f $TARBALL ]] || { echo "no such tarball: $TARBALL" >&2; exit 1; }

STAMP=$(date -u +%Y%m%dT%H%M%S)
RELEASE="$ROOT/releases/$STAMP"

echo "==> unpacking to $RELEASE"
mkdir -p "$RELEASE"
tar -xzf "$TARBALL" -C "$RELEASE"

# The standalone output does not include these; the build copies them into the
# tarball and this asserts they arrived. Without public/ the favicon and manifest
# 404; without .next/static every stylesheet and client chunk 404s and the app
# renders unstyled and inert. Both are quiet failures worth catching here.
for required in server.js .next/static public run-migrations.js .migrate/node_modules/mysql2; do
  [[ -e "$RELEASE/$required" ]] || { echo "release is missing $required" >&2; exit 1; }
done

# Uploads and the environment file live in shared/ so they survive releases.
# Symlinking rather than copying means there is exactly one copy of each.
ln -sfn "$ROOT/shared/uploads" "$RELEASE/storage-uploads"

echo "==> running migrations"
# Idempotent: the ledger means an unchanged schema is a no-op. Run before the
# swap so a failed migration leaves the old release serving.
# NODE_PATH so the CommonJS script finds the bundled mysql2; see the assemble
# step in .github/workflows/deploy.yml for why it is not in node_modules.
(
  cd "$RELEASE"
  set -a; . "$ROOT/shared/env"; set +a
  NODE_PATH="$RELEASE/.migrate/node_modules" node run-migrations.js
)

echo "==> swapping symlink"
# -T so this replaces the symlink itself rather than creating a link inside the
# directory it currently points at. Getting that wrong yields
# /srv/story/current/current, and the service keeps serving the old code while
# every log line says the deploy succeeded.
ln -sfnT "$RELEASE" "$ROOT/current"

echo "==> restarting"
sudo /usr/bin/systemctl restart story

# The unit is Restart=always, so a crash loop would look like a healthy restart
# from systemd's point of view. Poll the app instead.
echo "==> waiting for health"
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:3002/api/auth/session" \
     || [[ $(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3002/api/auth/session") == "401" ]]; then
    echo "    healthy after ${i}s (401 from /api/auth/session is correct when signed out)"
    break
  fi
  if [[ $i == 30 ]]; then
    echo "    NOT healthy after 30s — rolling back" >&2
    PREV=$(ls -1d "$ROOT"/releases/*/ | grep -v "$STAMP" | tail -1 || true)
    if [[ -n ${PREV:-} ]]; then
      ln -sfnT "${PREV%/}" "$ROOT/current"
      sudo /usr/bin/systemctl restart story
      echo "    rolled back to ${PREV%/}" >&2
    fi
    exit 1
  fi
  sleep 1
done

echo "==> pruning old releases (keeping $KEEP)"
ls -1dt "$ROOT"/releases/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
rm -f "$TARBALL"

echo "==> deployed $STAMP"
