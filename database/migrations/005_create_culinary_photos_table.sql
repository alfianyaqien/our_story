-- Migration: Add culinary photos feature
-- This creates a table to store photos for culinary plans (when status is 'visited')
-- Maximum 3 photos per culinary plan

CREATE TABLE IF NOT EXISTS culinary_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  culinary_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  photo_order TINYINT NOT NULL DEFAULT 1 CHECK (photo_order BETWEEN 1 AND 3),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (culinary_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_culinary_id (culinary_id),
  INDEX idx_photo_order (photo_order),
  INDEX idx_uploaded_at (uploaded_at),
  UNIQUE KEY unique_culinary_photo_order (culinary_id, photo_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores photos for culinary plans when visited (max 3 photos per plan)';
