-- Validation Script for Users and Authentication Schema
-- Description: Tests constraints, indexes, and triggers
-- Run this after applying the migration to verify everything works correctly

-- Test 1: Verify enum type exists
SELECT '=== Test 1: Verify user_type_enum exists ===' as test;
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'user_type_enum'::regtype
ORDER BY enumsortorder;

-- Test 2: Verify table structure
SELECT '=== Test 2: Verify users table structure ===' as test;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Test 3: Verify indexes exist
SELECT '=== Test 3: Verify indexes exist ===' as test;
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- Test 4: Verify constraints
SELECT '=== Test 4: Verify constraints ===' as test;
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- Test 5: Verify trigger exists
SELECT '=== Test 5: Verify trigger exists ===' as test;
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- Test 6: Test email constraint (should fail)
SELECT '=== Test 6: Test email validation (should fail with invalid email) ===' as test;
DO $$
BEGIN
    INSERT INTO users (user_type, email, password_hash)
    VALUES ('trucker', 'invalid-email', 'hash123');
    RAISE EXCEPTION 'Email constraint failed to reject invalid email';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: Email constraint correctly rejected invalid email';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAIL: Unexpected error: %', SQLERRM;
END $$;

-- Test 7: Test MC number format (should fail)
SELECT '=== Test 7: Test MC number validation (should fail with invalid format) ===' as test;
DO $$
BEGIN
    INSERT INTO users (user_type, email, password_hash, mc_number)
    VALUES ('business', 'test@example.com', 'hash123', 'invalid mc!');
    RAISE EXCEPTION 'MC number constraint failed to reject invalid format';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: MC number constraint correctly rejected invalid format';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAIL: Unexpected error: %', SQLERRM;
END $$;

-- Test 8: Test DOT number format (should fail)
SELECT '=== Test 8: Test DOT number validation (should fail with invalid format) ===' as test;
DO $$
BEGIN
    INSERT INTO users (user_type, email, password_hash, dot_number)
    VALUES ('business', 'test2@example.com', 'hash123', 'ABC123');
    RAISE EXCEPTION 'DOT number constraint failed to reject invalid format';
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'PASS: DOT number constraint correctly rejected invalid format';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAIL: Unexpected error: %', SQLERRM;
END $$;

-- Test 9: Test successful insert
SELECT '=== Test 9: Test successful insert ===' as test;
DO $$
DECLARE
    v_user_id INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at TIMESTAMP WITH TIME ZONE;
BEGIN
    INSERT INTO users (user_type, email, password_hash, phone)
    VALUES ('trucker', 'validation.test@example.com', '$2b$10$test', '+1234567890')
    RETURNING id, created_at, updated_at INTO v_user_id, v_created_at, v_updated_at;

    IF v_created_at IS NULL OR v_updated_at IS NULL THEN
        RAISE EXCEPTION 'FAIL: Timestamps not set automatically';
    END IF;

    RAISE NOTICE 'PASS: User inserted with ID %, created_at: %, updated_at: %',
        v_user_id, v_created_at, v_updated_at;

    -- Clean up
    DELETE FROM users WHERE id = v_user_id;
END $$;

-- Test 10: Test updated_at trigger
SELECT '=== Test 10: Test updated_at trigger ===' as test;
DO $$
DECLARE
    v_user_id INTEGER;
    v_created_at TIMESTAMP WITH TIME ZONE;
    v_updated_at_before TIMESTAMP WITH TIME ZONE;
    v_updated_at_after TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Insert test user
    INSERT INTO users (user_type, email, password_hash)
    VALUES ('trucker', 'trigger.test@example.com', 'hash123')
    RETURNING id, created_at, updated_at INTO v_user_id, v_created_at, v_updated_at_before;

    -- Wait a moment
    PERFORM pg_sleep(0.1);

    -- Update the user
    UPDATE users SET phone = '+9999999999' WHERE id = v_user_id
    RETURNING updated_at INTO v_updated_at_after;

    IF v_updated_at_after <= v_updated_at_before THEN
        RAISE EXCEPTION 'FAIL: updated_at trigger did not update timestamp';
    END IF;

    RAISE NOTICE 'PASS: updated_at trigger working correctly (before: %, after: %)',
        v_updated_at_before, v_updated_at_after;

    -- Clean up
    DELETE FROM users WHERE id = v_user_id;
END $$;

-- Test 11: Test JSONB indexing
SELECT '=== Test 11: Test JSONB profile_data functionality ===' as test;
DO $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Insert user with profile data
    INSERT INTO users (user_type, email, password_hash, profile_data)
    VALUES ('trucker', 'jsonb.test@example.com', 'hash123',
            '{"license_class": "CDL-A", "years_experience": 10}'::jsonb)
    RETURNING id INTO v_user_id;

    -- Test JSONB query
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = v_user_id
        AND profile_data @> '{"license_class": "CDL-A"}'
    ) THEN
        RAISE EXCEPTION 'FAIL: JSONB containment query failed';
    END IF;

    RAISE NOTICE 'PASS: JSONB profile_data working correctly';

    -- Clean up
    DELETE FROM users WHERE id = v_user_id;
END $$;

-- Test 12: Test unique email constraint
SELECT '=== Test 12: Test unique email constraint ===' as test;
DO $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Insert first user
    INSERT INTO users (user_type, email, password_hash)
    VALUES ('trucker', 'unique.test@example.com', 'hash123')
    RETURNING id INTO v_user_id;

    -- Try to insert duplicate email (should fail)
    BEGIN
        INSERT INTO users (user_type, email, password_hash)
        VALUES ('business', 'unique.test@example.com', 'hash456');
        RAISE EXCEPTION 'FAIL: Unique constraint did not prevent duplicate email';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'PASS: Unique email constraint working correctly';
    END;

    -- Clean up
    DELETE FROM users WHERE id = v_user_id;
END $$;

SELECT '=== All validation tests completed ===' as test;
