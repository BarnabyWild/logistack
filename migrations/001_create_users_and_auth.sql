-- Migration: Create users and authentication schema
-- Description: Sets up users table with support for truckers and businesses
-- Created: 2026-02-15

-- Create enum type for user roles
CREATE TYPE user_type_enum AS ENUM ('trucker', 'business');

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_type user_type_enum NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    -- Business-specific fields
    company_name VARCHAR(255),
    mc_number VARCHAR(50),
    dot_number VARCHAR(50),
    insurance_info JSONB,

    -- Additional profile data stored as JSON for flexibility
    profile_data JSONB DEFAULT '{}'::jsonb,

    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,

    -- Password reset
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT mc_number_format CHECK (mc_number IS NULL OR mc_number ~ '^[A-Z0-9-]+$'),
    CONSTRAINT dot_number_format CHECK (dot_number IS NULL OR dot_number ~ '^[0-9]+$')
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_mc_number ON users(mc_number) WHERE mc_number IS NOT NULL;
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create index on profile_data JSONB field for common queries
CREATE INDEX idx_users_profile_data ON users USING GIN(profile_data);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts for both truckers and businesses';
COMMENT ON COLUMN users.user_type IS 'Type of user account: trucker or business';
COMMENT ON COLUMN users.email IS 'User email address, must be unique';
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt or similar';
COMMENT ON COLUMN users.phone IS 'Contact phone number';
COMMENT ON COLUMN users.company_name IS 'Business name (for business accounts)';
COMMENT ON COLUMN users.mc_number IS 'Motor Carrier number (for trucking businesses)';
COMMENT ON COLUMN users.dot_number IS 'Department of Transportation number (for trucking businesses)';
COMMENT ON COLUMN users.insurance_info IS 'Insurance information stored as JSON';
COMMENT ON COLUMN users.profile_data IS 'Additional flexible profile information stored as JSON';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.reset_token IS 'Token for password reset, should be hashed';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiration timestamp for reset token';
