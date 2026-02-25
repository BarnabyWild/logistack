-- Sample Data for Users and Authentication Schema
-- Description: Example data for testing the users table
-- Note: This is for development/testing only - DO NOT use in production

-- Sample trucker users
INSERT INTO users (user_type, email, password_hash, phone, profile_data) VALUES
(
    'trucker',
    'john.driver@example.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36zI7hJQ8LN7xI7hJQ8LN7x',  -- hashed 'password123'
    '+1-555-0101',
    '{
        "license_class": "CDL-A",
        "years_experience": 8,
        "specializations": ["dry_van", "refrigerated"],
        "preferred_routes": ["east_coast", "midwest"],
        "availability_status": "available"
    }'::jsonb
),
(
    'trucker',
    'maria.rodriguez@example.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36zI7hJQ8LN7xI7hJQ8LN7y',
    '+1-555-0102',
    '{
        "license_class": "CDL-A",
        "years_experience": 5,
        "specializations": ["flatbed", "heavy_haul"],
        "preferred_routes": ["west_coast"],
        "availability_status": "on_job"
    }'::jsonb
);

-- Sample business users
INSERT INTO users (
    user_type, email, password_hash, phone,
    company_name, mc_number, dot_number, insurance_info, profile_data
) VALUES
(
    'business',
    'dispatch@fastfreight.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36zI7hJQ8LN7xI7hJQ8LN7z',
    '+1-555-0201',
    'Fast Freight Logistics LLC',
    'MC-123456',
    '1234567',
    '{
        "provider": "TransportInsure Co",
        "policy_number": "TIC-789456",
        "coverage_amount": 1000000,
        "expiry_date": "2027-12-31",
        "cargo_coverage": 100000
    }'::jsonb,
    '{
        "business_type": "freight_broker",
        "years_in_business": 12,
        "service_areas": ["nationwide"],
        "specializations": ["ltl", "ftl", "expedited"],
        "verified": true
    }'::jsonb
),
(
    'business',
    'contact@reliabletrans.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36zI7hJQ8LN7xI7hJQ8LN7a',
    '+1-555-0202',
    'Reliable Transport Inc',
    'MC-789012',
    '7890123',
    '{
        "provider": "National Carrier Insurance",
        "policy_number": "NCI-456789",
        "coverage_amount": 2000000,
        "expiry_date": "2027-06-30",
        "cargo_coverage": 250000
    }'::jsonb,
    '{
        "business_type": "carrier",
        "years_in_business": 25,
        "fleet_size": 45,
        "service_areas": ["southeast", "midwest"],
        "specializations": ["refrigerated", "dry_van"],
        "verified": true
    }'::jsonb
);

-- Verify the data
SELECT
    id,
    user_type,
    email,
    company_name,
    mc_number,
    created_at
FROM users
ORDER BY id;

-- Test queries
SELECT '=== All Trucker Users ===' as query_description;
SELECT id, email, profile_data->>'license_class' as license, profile_data->>'years_experience' as experience
FROM users
WHERE user_type = 'trucker';

SELECT '=== All Business Users ===' as query_description;
SELECT id, email, company_name, mc_number, dot_number
FROM users
WHERE user_type = 'business';

SELECT '=== Users with CDL-A License ===' as query_description;
SELECT id, email, user_type
FROM users
WHERE profile_data @> '{"license_class": "CDL-A"}';

SELECT '=== Verified Businesses ===' as query_description;
SELECT id, email, company_name
FROM users
WHERE user_type = 'business' AND profile_data @> '{"verified": true}';
