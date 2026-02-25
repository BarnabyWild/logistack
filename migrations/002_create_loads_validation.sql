-- Validation queries for loads schema
-- Description: Verify the loads table structure and data integrity
-- Created: 2026-02-15

-- Check that the loads table exists
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name = 'loads';

-- Check all columns exist with correct data types
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'loads'
ORDER BY ordinal_position;

-- Check that the load_status_enum type exists
SELECT
    typname,
    typtype,
    enumlabel
FROM pg_type t
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'load_status_enum'
ORDER BY enumsortorder;

-- Verify indexes exist
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'loads'
ORDER BY indexname;

-- Verify foreign key constraint to users table
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'loads';

-- Verify check constraints
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_catalog.pg_constraint con
INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
WHERE nsp.nspname = 'public'
    AND rel.relname = 'loads'
    AND con.contype = 'c'
ORDER BY con.conname;

-- Verify trigger exists
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'loads'
ORDER BY trigger_name;

-- Test basic CRUD operations (if sample data is loaded)
-- Count total loads
SELECT COUNT(*) AS total_loads FROM loads;

-- Count loads by status
SELECT
    status,
    COUNT(*) AS count
FROM loads
GROUP BY status
ORDER BY status;

-- Count loads by load_type
SELECT
    load_type,
    COUNT(*) AS count
FROM loads
GROUP BY load_type
ORDER BY count DESC;

-- Verify that posted_by references valid users
SELECT
    l.id AS load_id,
    l.posted_by,
    u.email AS posted_by_email,
    u.user_type
FROM loads l
LEFT JOIN users u ON l.posted_by = u.id
LIMIT 5;

-- Test coordinate constraints (should return no rows if all valid)
SELECT
    id,
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng
FROM loads
WHERE NOT (
    origin_lat BETWEEN -90 AND 90 AND
    origin_lng BETWEEN -180 AND 180 AND
    destination_lat BETWEEN -90 AND 90 AND
    destination_lng BETWEEN -180 AND 180
);

-- Test date constraints (should return no rows if all valid)
SELECT
    id,
    pickup_date,
    delivery_date
FROM loads
WHERE delivery_date < pickup_date;

-- Test weight and price constraints (should return no rows if all valid)
SELECT
    id,
    weight,
    price
FROM loads
WHERE weight <= 0 OR price < 0;

-- Verify updated_at trigger works
-- (Run an update and check if updated_at changes)
SELECT
    id,
    created_at,
    updated_at,
    (updated_at > created_at) AS timestamps_different
FROM loads
LIMIT 5;

-- Test indexes are being used (explain plans)
EXPLAIN SELECT * FROM loads WHERE status = 'posted';
EXPLAIN SELECT * FROM loads WHERE posted_by = 1;
EXPLAIN SELECT * FROM loads WHERE pickup_date >= CURRENT_DATE;
EXPLAIN SELECT * FROM loads WHERE status = 'posted' AND pickup_date >= CURRENT_DATE;
