-- Migration Rollback: Update users table schema
-- Description: Revert field renames and remove verification_token
-- Created: 2026-02-15

-- Drop verification_token index
DROP INDEX IF EXISTS idx_users_verification_token;

-- Remove verification_token column
ALTER TABLE users DROP COLUMN IF EXISTS verification_token;

-- Rename password back to password_hash (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users RENAME COLUMN password TO password_hash;
    END IF;
END $$;

-- Rename reset_password_token back to reset_token (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_password_token'
    ) THEN
        ALTER TABLE users RENAME COLUMN reset_password_token TO reset_token;
    END IF;
END $$;

-- Rename reset_password_expires back to reset_token_expiry (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'reset_password_expires'
    ) THEN
        ALTER TABLE users RENAME COLUMN reset_password_expires TO reset_token_expiry;
    END IF;
END $$;

-- Restore original index
DROP INDEX IF EXISTS idx_users_reset_password_token;
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Restore original column comments
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt or similar';
COMMENT ON COLUMN users.reset_token IS 'Token for password reset, should be hashed';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiration timestamp for reset token';
