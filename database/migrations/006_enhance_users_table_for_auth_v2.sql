-- Migration: Enhance users table for complete authentication system (MySQL 5.7+ compatible)
-- Adds email, email verification, password reset, and account status fields

-- This script manually adds columns one by one with error handling

-- Add email column
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;

-- Add email_verified column
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Add verification_token column
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);

-- Add verification_token_expires column
ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMP NULL;

-- Add reset_token column
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);

-- Add reset_token_expires column
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL;

-- Add account_status column
ALTER TABLE users ADD COLUMN account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active';

-- Add last_login column
ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;

-- Add failed_login_attempts column
ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0;

-- Add locked_until column
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL;

-- Add updated_at column
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add indexes for performance
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_verification_token ON users(verification_token);
CREATE INDEX idx_reset_token ON users(reset_token);
CREATE INDEX idx_account_status ON users(account_status);
