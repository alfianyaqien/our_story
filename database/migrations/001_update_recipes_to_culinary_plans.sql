-- Migration: Update recipes table to culinary_plans structure
-- Run this with: npm run db:migrate

USE our_story;

-- Drop the old recipes table (WARNING: This will delete existing data)
-- If you want to keep existing data, export it first
DROP TABLE IF EXISTS recipes;

-- Recreate the table with new structure
CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NULL,
  cuisine_type VARCHAR(100) NULL,
  price_range ENUM('$', '$$', '$$$', '$$$$') DEFAULT '$$',
  recommended_menu TEXT NULL,
  notes TEXT NULL,
  status ENUM('wishlist', 'planned', 'visited') DEFAULT 'wishlist',
  rating INT NULL CHECK (rating >= 1 AND rating <= 5),
  is_favorite BOOLEAN DEFAULT FALSE,
  visit_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_favorite (is_favorite),
  INDEX idx_price_range (price_range),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
