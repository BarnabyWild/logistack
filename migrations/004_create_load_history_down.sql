-- Migration Rollback: Drop load_history table
-- Description: Removes the load_history table and related trigger/function created in migration 004
-- Created: 2026-02-15
-- Version: 004_down

-- Drop trigger
DROP TRIGGER IF EXISTS log_load_status_change_trigger ON loads;

-- Drop trigger function
DROP FUNCTION IF EXISTS log_load_status_change();

-- Drop indexes
DROP INDEX IF EXISTS idx_load_history_load_id_changed_at;
DROP INDEX IF EXISTS idx_load_history_changed_by;
DROP INDEX IF EXISTS idx_load_history_changed_at;
DROP INDEX IF EXISTS idx_load_history_load_id;

-- Drop table
DROP TABLE IF EXISTS load_history CASCADE;
