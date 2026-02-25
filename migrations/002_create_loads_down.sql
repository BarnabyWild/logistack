-- Rollback migration: Drop loads schema
-- Description: Removes loads table and related objects
-- Created: 2026-02-15

-- Drop the loads table (will cascade to drop triggers)
DROP TABLE IF EXISTS loads CASCADE;

-- Drop the load_status enum type
DROP TYPE IF EXISTS load_status_enum CASCADE;

-- Note: We don't drop the update_updated_at_column() function
-- as it may be used by other tables (like users table)
