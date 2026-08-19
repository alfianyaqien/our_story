-- 009_create_stories.sql
--
-- Multi-story support: a user can own several stories and (from PR 2) invite a
-- partner into each. See docs/stories-plan.md.
--
-- DESTRUCTIVE. Per the agreed plan the existing feature rows are discarded
-- rather than migrated into a default story. `users` and `letter_templates`
-- are kept - accounts survive, and templates are reference data shared by every
-- story.
--
-- Wiping first is what makes `story_id NOT NULL` possible without a backfill:
-- the tables are empty when the column is added, so there is no row that could
-- be left unreachable.

-- ---------------------------------------------------------------------------
-- 1. New tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  created_by  INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS story_members (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  story_id   INT NOT NULL,
  user_id    INT NOT NULL,
  role       ENUM('owner','member') NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE,
  UNIQUE KEY uniq_story_user (story_id, user_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Created here rather than in PR 2 so the schema settles in one migration.
-- Nothing writes to it until the invitation work lands.
CREATE TABLE IF NOT EXISTS story_invites (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. Discard existing feature rows (agreed, irreversible)
-- ---------------------------------------------------------------------------
-- DELETE rather than TRUNCATE so the foreign keys between these tables are
-- honoured; child rows go first. culinary_photos cascades from recipes but is
-- cleared explicitly so the intent is readable.

DELETE FROM culinary_photos;
DELETE FROM love_letters;
DELETE FROM photos;
DELETE FROM albums;
DELETE FROM notes;
DELETE FROM recipes;
DELETE FROM travel_plans;
DELETE FROM wishlist;

-- ---------------------------------------------------------------------------
-- 3. Scope every feature table to a story
-- ---------------------------------------------------------------------------
-- NOT NULL is deliberate: a route that forgets to set story_id fails loudly on
-- insert instead of silently writing a row no story can reach.
--
-- culinary_photos gets no column - it already cascades from recipes, so its
-- story is reached through that join.

ALTER TABLE notes
  ADD COLUMN story_id INT NOT NULL,
  ADD INDEX idx_story (story_id),
  ADD CONSTRAINT fk_notes_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

ALTER TABLE photos
  ADD COLUMN story_id INT NOT NULL,
  ADD INDEX idx_story (story_id),
  ADD CONSTRAINT fk_photos_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

ALTER TABLE albums
  ADD COLUMN story_id INT NOT NULL,
  ADD INDEX idx_story (story_id),
  ADD CONSTRAINT fk_albums_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

ALTER TABLE recipes
  ADD COLUMN story_id INT NOT NULL,
  ADD INDEX idx_story (story_id),
  ADD CONSTRAINT fk_recipes_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

ALTER TABLE travel_plans
  ADD COLUMN story_id INT NOT NULL,
  ADD INDEX idx_story (story_id),
  ADD CONSTRAINT fk_travel_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

ALTER TABLE wishlist
  ADD COLUMN story_id INT NOT NULL,
  ADD INDEX idx_story (story_id),
  ADD CONSTRAINT fk_wishlist_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

ALTER TABLE love_letters
  ADD COLUMN story_id INT NOT NULL,
  ADD INDEX idx_story (story_id),
  ADD CONSTRAINT fk_letters_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
