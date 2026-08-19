# Multi-story plan

Turn Our Story from a single shared space into a multi-tenant one: a user can
own several **stories**, invite one partner into each with a shareable code,
and switch between them.

Status: **agreed, not yet implemented.** This document is the reference for the
implementation PRs.

---

## 1. Why this is also a bug fix

Six of the seven feature APIs have **no access scoping at all**. Only
`love-letters` filters by user:

| Route | `WHERE` on ownership in `GET` |
| --- | --- |
| `/api/notes` | none — `SELECT n.*, u.display_name …` |
| `/api/travel` | none — `SELECT * FROM travel_plans` |
| `/api/wishlist` | none |
| `/api/culinary` | none — `SELECT * FROM recipes` |
| `/api/photos` | none |
| `/api/albums` | none |
| `/api/love-letters` | scoped by `session.userId` |

With one account this is invisible. The moment a second person signs up they
see every existing note, photo, album, recipe, travel plan and wishlist item,
and the first user sees theirs. Stories are the correct fix, so scoping is
treated here as part of the feature rather than a separate cleanup.

Two feature tables (`recipes`, `travel_plans`) have **no ownership column at
all** today — `story_id` will be their first.

---

## 2. Decisions taken

| Question | Decision |
| --- | --- |
| Members per story | **2 now, designed to grow.** A `story_members` join table; the cap of 2 is an API constant, not a schema constraint. |
| Invitations | **Shareable code / link.** Email delivery is not configured (`EMAIL_USER` / `EMAIL_PASS` are commented out in `.env`), so an email-only flow could not be delivered or tested. |
| Existing data | **Discarded.** See §4 — destructive, confirmed twice. |
| Story naming | **User supplies the name** when creating a story. No auto-generated default. |
| Sequencing | Plan approved first; implementation split into two PRs (§9). |

---

## 3. Schema

### New tables

```sql
CREATE TABLE stories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  created_by  INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (created_by)
);

CREATE TABLE story_members (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  story_id   INT NOT NULL,
  user_id    INT NOT NULL,
  role       ENUM('owner','member') NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE,
  UNIQUE KEY uniq_story_user (story_id, user_id),
  INDEX idx_user (user_id)
);

CREATE TABLE story_invites (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  story_id     INT NOT NULL,
  code         VARCHAR(64) NOT NULL UNIQUE,
  created_by   INT NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  accepted_by  INT NULL,
  accepted_at  TIMESTAMP NULL,
  revoked_at   TIMESTAMP NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id)    REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by)  REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (accepted_by) REFERENCES users(id)   ON DELETE SET NULL,
  INDEX idx_story (story_id)
);
```

`code` is generated with `crypto.randomBytes` and URL-safe — it is a
capability, so it must be unguessable, not sequential.

### Column added to existing tables

`story_id INT NOT NULL`, FK to `stories(id)` `ON DELETE CASCADE`, indexed, on:

- `notes`
- `photos`
- `albums`
- `recipes`
- `travel_plans`
- `wishlist`
- `love_letters`

`culinary_photos` needs no column: it already cascades from `recipes`
(`culinary_photos.culinary_id → recipes ON DELETE CASCADE`). Queries reach its
story through that join.

`NOT NULL` is deliberate — a route that forgets to set `story_id` fails loudly
on insert rather than silently writing an unreachable row.

### Existing foreign keys worth remembering

```
culinary_photos.culinary_id -> recipes  ON DELETE CASCADE
love_letters.from_user_id   -> users    ON DELETE CASCADE
love_letters.to_user_id     -> users    ON DELETE CASCADE
notes.created_by            -> users    ON DELETE CASCADE
photos.album_id             -> albums   ON DELETE SET NULL
wishlist.user_id            -> users    ON DELETE CASCADE
```

Deleting a story cascades all of its content. Deleting a *user* still cascades
their authored rows, which is existing behaviour and unchanged.

---

## 4. Data migration — destructive

Confirmed twice by the project owner: existing content is **discarded** rather
than migrated into a default story.

Rows deleted at the time of writing:

| Table | Rows |
| --- | --- |
| notes | 2 |
| photos | 2 |
| albums | 2 |
| recipes | 1 |
| travel_plans | 1 |
| wishlist | 2 |
| love_letters | 0 |
| culinary_photos | 0 |

`users` (1 row) and `letter_templates` (4 seeded rows) are **kept** — accounts
survive, and templates are reference data shared across all stories.

The migration therefore:

1. Truncates the seven feature tables (FK-safe order, or with checks disabled).
2. Creates the three new tables.
3. Adds `story_id NOT NULL` to the seven tables — trivial because they are now
   empty, which is the one upside of the wipe.

Uploaded photo files under `public/uploads` become orphaned by the wipe and
should be cleared in the same step, otherwise they accumulate forever with no
DB row pointing at them.

**This step is irreversible.** It runs only after an explicit go-ahead at
implementation time, and only against a database the owner nominates.

---

## 5. Enforcement

The current bug exists because scoping was left to each route's discretion and
six of seven forgot. The fix must not rely on that discipline again.

A single helper, used by every data route:

```ts
// lib/story.ts
requireStoryMember(request) → { userId: number; storyId: number }
// 401 if not signed in, 403 if not a member of the requested story
```

Rules:

- The active story id travels in a cookie, but it is only a **hint**. The
  helper re-checks `story_members` on every request. A tampered cookie gets a
  403, never data.
- Every read filters on the returned `storyId`. Every write sets it.
- `story_id` being `NOT NULL` means a forgotten write fails closed.

### Correction to recent work

`GET /api/users`, added to fix the love-letter recipient dropdown, currently
returns **every active account in the system**. That was acceptable while the
app was one couple. Under multi-tenancy it leaks the user list across stories.

It must become "members of the active story, excluding me" — which is also
exactly the right recipient list for a love letter.

---

## 6. API surface

### New

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/stories` | Stories the user belongs to |
| `POST` | `/api/stories` | Create (name required); creator becomes `owner` |
| `PATCH` | `/api/stories/:id` | Rename (owner only) |
| `DELETE` | `/api/stories/:id` | Delete + cascade (owner only) |
| `POST` | `/api/stories/:id/switch` | Set active story cookie |
| `GET` | `/api/stories/:id/members` | Members list |
| `DELETE` | `/api/stories/:id/members/:userId` | Remove partner (owner only) |
| `POST` | `/api/stories/:id/invites` | Create invite code (owner only) |
| `GET` | `/api/invites/:code` | Preview: story name + inviter, before accepting |
| `POST` | `/api/invites/:code/accept` | Join |
| `DELETE` | `/api/invites/:code` | Revoke |

### Changed

All seven feature routes: add `requireStoryMember`, filter reads on
`story_id`, set it on writes. `/api/users` rescoped as above.

---

## 7. UI

- **First-run** — a signed-in user with no story lands on "create your first
  story" rather than an empty dashboard.
- **Story switcher** — in `AppShell`, inside the existing profile dropdown.
  Shows current story, lists others, plus "New story".
- **Story settings** — rename, members, generate/copy/revoke invite link,
  remove partner, delete story.
- **Join screen** at `/join/[code]` — shows the story name and who invited
  you, then Accept. A signed-out visitor signs up or logs in first and is
  returned to the invite afterwards.

All of it reuses the existing design system — `Card`, `Button`, `Field`,
`Modal`, `ConfirmModal`, `EmptyState`, `Alert`, `PageTitle`. Destructive
actions (delete story, remove partner) go through `ConfirmModal`, consistent
with the rest of the app.

---

## 8. Edge cases

| Case | Handling |
| --- | --- |
| Invite expired | 410, "This invite has expired" |
| Invite already used | 409 — codes are single-use |
| Invite revoked | 410 |
| Story already full | 409, "This story already has a partner" |
| Accepting your own invite | 400 |
| Already a member | Redirect to the story rather than error |
| Owner tries to leave | Blocked — transfer ownership or delete the story |
| Active story deleted | Cookie cleared, user falls back to another story or first-run |
| Cookie names a story you were removed from | 403, then fall back |
| Last story deleted | Back to first-run |

---

## 9. Testing

`scripts/regression-test.js` grows the case that actually matters:

**Two users in two separate stories must not see each other's rows** —
asserted per feature, for all seven. That single test would have caught the
current leak.

Plus: invite lifecycle (create → preview → accept → member count), the
2-member cap, revoke, expiry, non-member gets 403 on every feature route, and
that a tampered story cookie is rejected rather than honoured.

---

## 10. Sequencing

**PR 1 — stories + scoping.** New tables, destructive migration, `story_id`
everywhere, `requireStoryMember`, all seven routes scoped, `/api/users`
rescoped, first-run + create-story UI. Closes the privacy hole.

**PR 2 — invitations + switcher.** Invite lifecycle, join screen, story
settings, switcher, member management.

Splitting this way keeps each diff reviewable and gets the leak closed first.

---

## 11. Risks

- **Every data route changes.** Wide blast radius; the regression suite is the
  safety net and must be extended before, not after.
- **The wipe is irreversible** and clears `public/uploads` too.
- **Session shape changes.** Existing signed-in sessions will not carry a
  story cookie; the helper must treat "no active story" as a normal state and
  route to first-run, not crash.
- **Other environments** need `node run-migrations.js`; the migration is
  destructive, so that must be stated plainly in the PR description.
