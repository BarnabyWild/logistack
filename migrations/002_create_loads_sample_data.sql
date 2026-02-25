-- Sample data for loads table
-- Description: Insert test data for development and testing
-- Created: 2026-02-15
-- Note: This should only be run in development/testing environments

-- Assume we have some users already created from 001_create_users_and_auth_sample_data.sql
-- These sample loads reference existing user IDs

-- Sample load 1: Chicago to Dallas - Flatbed load
INSERT INTO loads (
    posted_by,
    origin_address,
    origin_lat,
    origin_lng,
    destination_address,
    destination_lat,
    destination_lng,
    pickup_date,
    delivery_date,
    weight,
    dimensions,
    load_type,
    commodity,
    price,
    status,
    special_requirements
) VALUES (
    1, -- Assuming user ID 1 exists (business account)
    '123 W Main St, Chicago, IL 60601',
    41.8781136,
    -87.6297982,
    '456 Commerce St, Dallas, TX 75201',
    32.7766642,
    -96.7969879,
    CURRENT_DATE + INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '5 days',
    42000.00,
    '{"length": 48, "width": 8, "height": 8.5}'::jsonb,
    'flatbed',
    'Steel beams',
    2500.00,
    'posted',
    'Tarps required. Load must be secured with chains.'
);

-- Sample load 2: Los Angeles to Phoenix - Dry van
INSERT INTO loads (
    posted_by,
    origin_address,
    origin_lat,
    origin_lng,
    destination_address,
    destination_lat,
    destination_lng,
    pickup_date,
    delivery_date,
    weight,
    dimensions,
    load_type,
    commodity,
    price,
    status,
    special_requirements
) VALUES (
    1,
    '789 Harbor Blvd, Los Angeles, CA 90001',
    33.9731563,
    -118.2479269,
    '321 Desert Rd, Phoenix, AZ 85001',
    33.4483771,
    -112.0740373,
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '3 days',
    15000.00,
    '{"length": 40, "width": 8, "height": 8}'::jsonb,
    'dry_van',
    'Electronics',
    1200.00,
    'posted',
    'Temperature controlled facility pickup. Handle with care.'
);

-- Sample load 3: New York to Miami - Refrigerated
INSERT INTO loads (
    posted_by,
    origin_address,
    origin_lat,
    origin_lng,
    destination_address,
    destination_lat,
    destination_lng,
    pickup_date,
    delivery_date,
    weight,
    dimensions,
    load_type,
    commodity,
    price,
    status,
    special_requirements
) VALUES (
    1,
    '100 Broadway, New York, NY 10005',
    40.7127753,
    -74.0059728,
    '200 Biscayne Blvd, Miami, FL 33131',
    25.7616798,
    -80.1917902,
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '3 days',
    25000.00,
    '{"length": 45, "width": 8, "height": 9}'::jsonb,
    'reefer',
    'Frozen food products',
    3200.00,
    'posted',
    'Must maintain 0°F throughout transit. Temperature monitoring required.'
);

-- Sample load 4: Seattle to Portland - Container
INSERT INTO loads (
    posted_by,
    origin_address,
    origin_lat,
    origin_lng,
    destination_address,
    destination_lat,
    destination_lng,
    pickup_date,
    delivery_date,
    weight,
    dimensions,
    load_type,
    commodity,
    price,
    status,
    special_requirements
) VALUES (
    1,
    '500 Port St, Seattle, WA 98101',
    47.6062095,
    -122.3320708,
    '600 Harbor Way, Portland, OR 97201',
    45.5051064,
    -122.6750261,
    CURRENT_DATE + INTERVAL '4 days',
    CURRENT_DATE + INTERVAL '5 days',
    35000.00,
    '{"length": 40, "width": 8, "height": 8.5}'::jsonb,
    'container',
    'Manufacturing equipment',
    1800.00,
    'posted',
    'Chassis required. Port pickup - bring TWIC card.'
);

-- Sample load 5: Atlanta to Houston - In transit
INSERT INTO loads (
    posted_by,
    origin_address,
    origin_lat,
    origin_lng,
    destination_address,
    destination_lat,
    destination_lng,
    pickup_date,
    delivery_date,
    weight,
    dimensions,
    load_type,
    commodity,
    price,
    status,
    special_requirements
) VALUES (
    1,
    '700 Peachtree St, Atlanta, GA 30308',
    33.7489954,
    -84.3879824,
    '800 Texas Ave, Houston, TX 77002',
    29.7604267,
    -95.3698028,
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '1 day',
    28000.00,
    '{"length": 48, "width": 8, "height": 9}'::jsonb,
    'dry_van',
    'Retail goods',
    2100.00,
    'in_transit',
    'Appointment required for delivery. Call 24 hours ahead.'
);

-- Sample load 6: Draft load (not yet posted)
INSERT INTO loads (
    posted_by,
    origin_address,
    origin_lat,
    origin_lng,
    destination_address,
    destination_lat,
    destination_lng,
    pickup_date,
    delivery_date,
    weight,
    dimensions,
    load_type,
    commodity,
    price,
    status,
    special_requirements
) VALUES (
    1,
    '900 Market St, Denver, CO 80202',
    39.7392358,
    -104.990251,
    '1000 Las Vegas Blvd, Las Vegas, NV 89101',
    36.1699412,
    -115.1398296,
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '9 days',
    18000.00,
    '{"length": 45, "width": 8, "height": 8}'::jsonb,
    'dry_van',
    'Consumer electronics',
    1500.00,
    'draft',
    NULL
);
