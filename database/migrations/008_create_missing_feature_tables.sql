-- 008_create_missing_feature_tables.sql
--
-- database/schema.sql has always defined letter_templates, travel_plans and
-- wishlist, but no migration ever created them, so a database built by running
-- the numbered migrations (rather than schema.sql wholesale) is missing all
-- three. /api/letter-templates, /api/travel and /api/wishlist therefore
-- returned 500 on every request and three features were dead.
--
-- The definitions below are copied verbatim from schema.sql so both paths
-- converge on the same shape. IF NOT EXISTS keeps this safe to re-run and a
-- no-op on databases that were built from schema.sql directly.

CREATE TABLE IF NOT EXISTS letter_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  placeholders TEXT NOT NULL,
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS travel_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  budget DECIMAL(10, 2) NULL,
  notes TEXT,
  status ENUM('wishlist', 'planning', 'booked', 'completed') DEFAULT 'wishlist',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  price DECIMAL(10, 2) NULL,
  link VARCHAR(500),
  status ENUM('wished', 'planned', 'purchased') DEFAULT 'wished',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_priority (priority),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Starter templates. The letter-maker has nothing to show without rows here,
-- and the API JSON.parse()s `placeholders`, so it must be a valid JSON array.
-- Guarded on an empty table so re-running never duplicates them.
INSERT INTO letter_templates (name, category, content, placeholders)
SELECT * FROM (
  SELECT
    'Just Because' AS name,
    'Everyday' AS category,
    'Dear [NAME],\n\nI was thinking about [MEMORY] today, and it made me smile all over again.\n\nThank you for [REASON].\n\nAlways yours,\n[SENDER]' AS content,
    '["NAME","MEMORY","REASON","SENDER"]' AS placeholders
) AS t
WHERE NOT EXISTS (SELECT 1 FROM letter_templates);

INSERT INTO letter_templates (name, category, content, placeholders)
SELECT * FROM (
  SELECT
    'Anniversary' AS name,
    'Milestone' AS category,
    'My dearest [NAME],\n\n[YEARS] years ago we [FIRST_MEMORY]. Every day since has been better than the last.\n\nHere is to many more.\n\nWith all my love,\n[SENDER]' AS content,
    '["NAME","YEARS","FIRST_MEMORY","SENDER"]' AS placeholders
) AS t
WHERE (SELECT COUNT(*) FROM letter_templates) = 1;

INSERT INTO letter_templates (name, category, content, placeholders)
SELECT * FROM (
  SELECT
    'Thinking of You' AS name,
    'Everyday' AS category,
    'Hi [NAME],\n\nIt is [TIME_OF_DAY] and you crossed my mind again. I hope [WISH].\n\nSee you soon,\n[SENDER]' AS content,
    '["NAME","TIME_OF_DAY","WISH","SENDER"]' AS placeholders
) AS t
WHERE (SELECT COUNT(*) FROM letter_templates) = 2;

INSERT INTO letter_templates (name, category, content, placeholders)
SELECT * FROM (
  SELECT
    'Apology' AS name,
    'Repair' AS category,
    'Dear [NAME],\n\nI am sorry about [WHAT_HAPPENED]. You deserved better, and I want to make it right by [HOW].\n\nLove,\n[SENDER]' AS content,
    '["NAME","WHAT_HAPPENED","HOW","SENDER"]' AS placeholders
) AS t
WHERE (SELECT COUNT(*) FROM letter_templates) = 3;
