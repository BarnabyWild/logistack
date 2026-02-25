-- Migration: Update users table schema
-- Description: Rename fields and add verification_token for email verification
-- Created: 2026-02-15

-- Add verification_token column for email verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

-- Create index on verification_token for performance
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Rename password_hash to password (if not already renamed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users RENAME COLUMN password_hash TO password;
    END IF;
END $$;

-- Rename reset_token to reset_password_token (if not already renamed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_token'
    ) THEN
        ALTER TABLE users RENAME COLUMN reset_token TO reset_password_token;
    END IF;
END $$;

-- Rename reset_token_expiry to reset_password_expires (if not already renamed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_token_expiry'
    ) THEN
        ALTER TABLE users RENAME COLUMN reset_token_expiry TO reset_password_expires;
    END IF;
END $$;

-- Update index names after column renames
DROP INDEX IF EXISTS idx_users_reset_token;
CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token) WHERE reset_password_token IS NOT NULL;

-- Update column comments
COMMENT ON COLUMN users.password IS 'Hashed password using bcrypt';
COMMENT ON COLUMN users.verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.reset_password_token IS 'Token for password reset';
COMMENT ON COLUMN users.reset_password_expires IS 'Expiration timestamp for password reset token';
