-- Albums Migration
-- This migration creates the albums table for organizing photos into collections

CREATE TABLE IF NOT EXISTS albums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover_photo_id INT NULL,
  photo_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_name (name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores photo album collections';

-- Create a default "General" album
INSERT INTO albums (user_id, name, description) 
SELECT DISTINCT 1, 'General', 'Default album for uncategorized photos'
WHERE NOT EXISTS (SELECT 1 FROM albums WHERE name = 'General');

-- Modify photos table to add album_id foreign key
ALTER TABLE photos 
ADD COLUMN album_id INT NULL AFTER album,
ADD INDEX idx_album_id (album_id);

-- Migrate existing album data: create albums from existing album strings
INSERT INTO albums (user_id, name, description)
SELECT DISTINCT 1, album, CONCAT('Album: ', album)
FROM photos 
WHERE album IS NOT NULL 
  AND album != '' 
  AND album != 'general'
  AND NOT EXISTS (SELECT 1 FROM albums WHERE name = album);

-- Update photos to reference the new albums table
UPDATE photos p
JOIN albums a ON p.album = a.name
SET p.album_id = a.id;

-- Set photos with 'general' or NULL album to the General album
UPDATE photos p
SET p.album_id = (SELECT id FROM albums WHERE name = 'General' LIMIT 1)
WHERE p.album_id IS NULL OR p.album = 'general' OR p.album = '';

-- Add foreign key constraint
ALTER TABLE photos
ADD CONSTRAINT fk_photos_album 
FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL;

-- Update album photo counts
UPDATE albums a
SET photo_count = (
  SELECT COUNT(*) 
  FROM photos p 
  WHERE p.album_id = a.id
);
