-- Migration Down: Remove 'cancelled' value from load_status_enum
-- Description: Reverts the addition of 'cancelled' status
-- Created: 2026-02-16
-- Version: 007
--
-- NOTE: PostgreSQL does not support removing values from enums directly.
-- To fully revert, you must recreate the enum type. This migration will:
-- 1. Update any loads with 'cancelled' status back to 'pending'
-- 2. Recreate the enum without 'cancelled'

-- First update any cancelled loads back to pending
UPDATE loads SET status = 'pending' WHERE status = 'cancelled';
UPDATE load_history SET old_status = 'pending' WHERE old_status = 'cancelled';
UPDATE load_history SET new_status = 'pending' WHERE new_status = 'cancelled';

-- Recreate the enum without 'cancelled'
ALTER TYPE load_status_enum RENAME TO load_status_enum_old;

CREATE TYPE load_status_enum AS ENUM ('pending', 'assigned', 'in_transit', 'delivered');

ALTER TABLE loads ALTER COLUMN status TYPE load_status_enum USING status::text::load_status_enum;
ALTER TABLE load_history ALTER COLUMN old_status TYPE load_status_enum USING old_status::text::load_status_enum;
ALTER TABLE load_history ALTER COLUMN new_status TYPE load_status_enum USING new_status::text::load_status_enum;

DROP TYPE load_status_enum_old;
