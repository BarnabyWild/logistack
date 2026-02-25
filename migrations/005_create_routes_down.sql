-- Rollback Migration: Drop routes schema
-- Description: Removes routes table and related enum types
-- Created: 2026-02-15
-- Version: 005

-- Drop trigger
DROP TRIGGER IF EXISTS update_routes_updated_at ON routes;

-- Drop indexes (will be automatically dropped with table, but explicit for clarity)
DROP INDEX IF EXISTS idx_routes_end_coords;
DROP INDEX IF EXISTS idx_routes_start_coords;
DROP INDEX IF EXISTS idx_routes_equipment_status;
DROP INDEX IF EXISTS idx_routes_status_trucker_id;
DROP INDEX IF EXISTS idx_routes_status_departure_date;
DROP INDEX IF EXISTS idx_routes_equipment_type;
DROP INDEX IF EXISTS idx_routes_created_at;
DROP INDEX IF EXISTS idx_routes_arrival_date;
DROP INDEX IF EXISTS idx_routes_departure_date;
DROP INDEX IF EXISTS idx_routes_status;
DROP INDEX IF EXISTS idx_routes_trucker_id;

-- Drop table
DROP TABLE IF EXISTS routes;

-- Drop enum types
DROP TYPE IF EXISTS route_status_enum;
DROP TYPE IF EXISTS equipment_type_enum;
