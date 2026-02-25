-- Migration: Create load_history table
-- Description: Sets up load_history table for tracking status changes with timestamps
-- Created: 2026-02-15
-- Version: 004

-- Create load_history table
CREATE TABLE load_history (
    id SERIAL PRIMARY KEY,

    -- Foreign key to loads table
    load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,

    -- Status change tracking
    old_status load_status_enum,
    new_status load_status_enum NOT NULL,

    -- User who made the change (optional - could be system-triggered)
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Additional context about the change
    notes TEXT,

    -- Timestamp
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_load_history_load_id ON load_history(load_id);
CREATE INDEX idx_load_history_changed_at ON load_history(changed_at);
CREATE INDEX idx_load_history_changed_by ON load_history(changed_by);

-- Create composite index for common query patterns (viewing history for a specific load)
CREATE INDEX idx_load_history_load_id_changed_at ON load_history(load_id, changed_at DESC);

-- Add comments for documentation
COMMENT ON TABLE load_history IS 'Audit trail for tracking load status changes over time';
COMMENT ON COLUMN load_history.load_id IS 'Reference to the load being tracked';
COMMENT ON COLUMN load_history.old_status IS 'Previous status before the change (null for initial status)';
COMMENT ON COLUMN load_history.new_status IS 'New status after the change';
COMMENT ON COLUMN load_history.changed_by IS 'User who triggered the status change (null for system changes)';
COMMENT ON COLUMN load_history.notes IS 'Optional notes or reason for the status change';
COMMENT ON COLUMN load_history.changed_at IS 'Timestamp when the status change occurred';

-- Create trigger function to automatically log status changes
CREATE OR REPLACE FUNCTION log_load_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO load_history (load_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, CURRENT_TIMESTAMP);
    END IF;

    -- Log initial status on insert
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO load_history (load_id, old_status, new_status, changed_at)
        VALUES (NEW.id, NULL, NEW.status, CURRENT_TIMESTAMP);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log status changes on loads table
CREATE TRIGGER log_load_status_change_trigger
    AFTER INSERT OR UPDATE ON loads
    FOR EACH ROW
    EXECUTE FUNCTION log_load_status_change();
