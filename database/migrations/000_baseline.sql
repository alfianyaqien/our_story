-- 000_baseline.sql
--
-- The full schema as one statement set, for a fresh database.
--
-- Migrations 001-009 remain in this directory for provenance but are NOT in the
-- runner's list any more. That is deliberate: 009 contained `DELETE FROM` across
-- every feature table, which was correct once against a development database and
-- must never run against production. Squashing removes it from the path entirely
-- rather than relying on the ledger to skip it.
--
-- A fresh database therefore applies exactly this file, and the runner records
-- 001-009 as already-applied so a later `node run-migrations.js` is a no-op.
--
-- Generated from the development schema with:
--   mysqldump --no-data --skip-comments --skip-add-drop-table
-- then AUTO_INCREMENT counters stripped, IF NOT EXISTS added, and tables
-- reordered so foreign keys resolve.
--
-- Verified against MariaDB by running scripts/regression-test.js.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `verification_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_token_expires` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `account_status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_verification_token` (`verification_token`),
  KEY `idx_reset_token` (`reset_token`),
  KEY `idx_account_status` (`account_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `stories_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `story_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `story_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('owner','member') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_story_user` (`story_id`,`user_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `story_members_ibfk_1` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `story_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `story_invites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `story_id` int NOT NULL,
  `code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `expires_at` timestamp NOT NULL,
  `accepted_by` int DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `created_by` (`created_by`),
  KEY `accepted_by` (`accepted_by`),
  KEY `idx_story` (`story_id`),
  CONSTRAINT `story_invites_ibfk_1` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `story_invites_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `story_invites_ibfk_3` FOREIGN KEY (`accepted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `albums` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `cover_photo_id` int DEFAULT NULL,
  `photo_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `story_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_name` (`name`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_story` (`story_id`),
  CONSTRAINT `fk_albums_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores photo album collections';

CREATE TABLE IF NOT EXISTS `photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `album` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `album_id` int DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `story_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_album` (`album`),
  KEY `idx_uploaded_at` (`uploaded_at`),
  KEY `idx_album_id` (`album_id`),
  KEY `idx_story` (`story_id`),
  CONSTRAINT `fk_photos_album` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_photos_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores photo metadata for the gallery feature. Files stored locally in /public/uploads/photos/';

CREATE TABLE IF NOT EXISTS `notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `story_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_updated` (`updated_at`),
  KEY `idx_story` (`story_id`),
  CONSTRAINT `fk_notes_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recipes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `place_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cuisine_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_range` enum('$','$$','$$$','$$$$') COLLATE utf8mb4_unicode_ci DEFAULT '$$',
  `recommended_menu` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('wishlist','planned','visited') COLLATE utf8mb4_unicode_ci DEFAULT 'wishlist',
  `rating` int DEFAULT NULL,
  `is_favorite` tinyint(1) DEFAULT '0',
  `visit_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `story_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_favorite` (`is_favorite`),
  KEY `idx_price_range` (`price_range`),
  KEY `idx_created` (`created_at`),
  KEY `idx_story` (`story_id`),
  CONSTRAINT `fk_recipes_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recipes_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `culinary_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `culinary_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_order` tinyint NOT NULL DEFAULT '1',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_culinary_photo_order` (`culinary_id`,`photo_order`),
  KEY `idx_culinary_id` (`culinary_id`),
  KEY `idx_photo_order` (`photo_order`),
  KEY `idx_uploaded_at` (`uploaded_at`),
  CONSTRAINT `culinary_photos_ibfk_1` FOREIGN KEY (`culinary_id`) REFERENCES `recipes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `culinary_photos_chk_1` CHECK ((`photo_order` between 1 and 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores photos for culinary plans when visited (max 3 photos per plan)';

CREATE TABLE IF NOT EXISTS `travel_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `destination` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('wishlist','planning','booked','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'wishlist',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `story_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  KEY `idx_story` (`story_id`),
  CONSTRAINT `fk_travel_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('low','medium','high') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `price` decimal(10,2) DEFAULT NULL,
  `link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('wished','planned','purchased') COLLATE utf8mb4_unicode_ci DEFAULT 'wished',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `story_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_priority` (`priority`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  KEY `idx_story` (`story_id`),
  CONSTRAINT `fk_wishlist_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `love_letters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_user_id` int NOT NULL,
  `to_user_id` int NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `encrypted_content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) DEFAULT '0',
  `story_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_from_user` (`from_user_id`),
  KEY `idx_to_user` (`to_user_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_story` (`story_id`),
  CONSTRAINT `fk_letters_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `love_letters_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `love_letters_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `letter_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `placeholders` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Starter letter templates. The letter-maker has nothing to show without rows,
-- and the API JSON.parse()s `placeholders`, so it must be a valid JSON array.
INSERT INTO letter_templates (name, category, content, placeholders)
SELECT * FROM (
  SELECT 'Just Because' AS name, 'Everyday' AS category,
    'Dear [NAME],\n\nI was thinking about [MEMORY] today, and it made me smile all over again.\n\nThank you for [REASON].\n\nAlways yours,\n[SENDER]' AS content,
    '["NAME","MEMORY","REASON","SENDER"]' AS placeholders
) AS t WHERE NOT EXISTS (SELECT 1 FROM letter_templates);

INSERT INTO letter_templates (name, category, content, placeholders)
SELECT * FROM (
  SELECT 'Anniversary' AS name, 'Milestone' AS category,
    'My dearest [NAME],\n\n[YEARS] years ago we [FIRST_MEMORY]. Every day since has been better than the last.\n\nHere is to many more.\n\nWith all my love,\n[SENDER]' AS content,
    '["NAME","YEARS","FIRST_MEMORY","SENDER"]' AS placeholders
) AS t WHERE (SELECT COUNT(*) FROM letter_templates) = 1;

INSERT INTO letter_templates (name, category, content, placeholders)
SELECT * FROM (
  SELECT 'Thinking of You' AS name, 'Everyday' AS category,
    'Hi [NAME],\n\nIt is [TIME_OF_DAY] and you crossed my mind again. I hope [WISH].\n\nSee you soon,\n[SENDER]' AS content,
    '["NAME","TIME_OF_DAY","WISH","SENDER"]' AS placeholders
) AS t WHERE (SELECT COUNT(*) FROM letter_templates) = 2;

INSERT INTO letter_templates (name, category, content, placeholders)
SELECT * FROM (
  SELECT 'Apology' AS name, 'Repair' AS category,
    'Dear [NAME],\n\nI am sorry about [WHAT_HAPPENED]. You deserved better, and I want to make it right by [HOW].\n\nLove,\n[SENDER]' AS content,
    '["NAME","WHAT_HAPPENED","HOW","SENDER"]' AS placeholders
) AS t WHERE (SELECT COUNT(*) FROM letter_templates) = 3;
