-- Migration Rollback: Drop updated loads schema
-- Description: Removes the loads table and enum created in migration 003
-- Created: 2026-02-15
-- Version: 003_down

-- Drop trigger
DROP TRIGGER IF EXISTS update_loads_updated_at ON loads;

-- Drop indexes
DROP INDEX IF EXISTS idx_loads_trucker_id_status;
DROP INDEX IF EXISTS idx_loads_status_business_id;
DROP INDEX IF EXISTS idx_loads_status_pickup_date;
DROP INDEX IF EXISTS idx_loads_created_at;
DROP INDEX IF EXISTS idx_loads_delivery_date;
DROP INDEX IF EXISTS idx_loads_pickup_date;
DROP INDEX IF EXISTS idx_loads_status;
DROP INDEX IF EXISTS idx_loads_trucker_id;
DROP INDEX IF EXISTS idx_loads_business_id;

-- Drop table
DROP TABLE IF EXISTS loads CASCADE;

-- Drop enum type
DROP TYPE IF EXISTS load_status_enum CASCADE;
