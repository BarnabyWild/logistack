# Loads Schema Documentation

## Overview
Migration `002_create_loads` implements the loads table for managing freight load postings in the LogiStack platform.

## Files Created
- `002_create_loads.sql` - Main migration file
- `002_create_loads_down.sql` - Rollback migration
- `002_create_loads_sample_data.sql` - Sample test data
- `002_create_loads_validation.sql` - Validation queries

## Schema Design

### Enum Type: load_status_enum
Defines the lifecycle states of a load:
- `draft` - Load created but not yet posted
- `posted` - Load is active and visible to truckers
- `in_transit` - Load has been picked up and is being delivered
- `delivered` - Load has been successfully delivered
- `cancelled` - Load was cancelled before completion
- `expired` - Load posting has expired

### Table: loads

#### Core Fields
- `id` - Primary key (auto-incrementing)
- `posted_by` - Foreign key to users table (business account that posted the load)
- `status` - Current load status (defaults to 'draft')

#### Location Fields
- `origin_address` - Full pickup address
- `origin_lat`, `origin_lng` - Pickup coordinates (for mapping and distance calculations)
- `destination_address` - Full delivery address
- `destination_lat`, `destination_lng` - Delivery coordinates

#### Schedule Fields
- `pickup_date` - Scheduled pickup date
- `delivery_date` - Scheduled delivery date

#### Load Specifications
- `weight` - Weight in pounds (decimal for precision)
- `dimensions` - JSONB field storing length, width, height in feet
- `load_type` - Type of trailer required (e.g., 'flatbed', 'dry_van', 'reefer', 'container')
- `commodity` - Description of what's being shipped

#### Commercial Fields
- `price` - Payment amount in USD
- `special_requirements` - Text field for special handling, equipment, or instructions

#### Timestamps
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp (auto-updated via trigger)

## Indexes

### Single Column Indexes
- `idx_loads_posted_by` - Queries filtering by user
- `idx_loads_status` - Queries filtering by load status
- `idx_loads_pickup_date` - Date range queries
- `idx_loads_delivery_date` - Delivery schedule queries
- `idx_loads_created_at` - Recent loads queries
- `idx_loads_load_type` - Equipment type filtering

### Composite Indexes
- `idx_loads_status_pickup_date` - Common query pattern (active loads by date)
- `idx_loads_status_posted_by` - User's loads by status

### Spatial Indexes
- `idx_loads_origin_coords` - Location-based origin queries
- `idx_loads_destination_coords` - Location-based destination queries

### JSONB Index
- `idx_loads_dimensions` - GIN index for dimensions field queries

## Constraints

### Data Integrity
- Foreign key to users table with CASCADE delete
- Unique primary key
- NOT NULL constraints on required fields

### Business Rules
- `valid_coordinates_origin` - Latitude/longitude must be valid (-90 to 90, -180 to 180)
- `valid_coordinates_destination` - Same as origin
- `valid_weight` - Weight must be positive
- `valid_price` - Price must be non-negative
- `valid_dates` - Delivery date cannot be before pickup date

## Triggers
- `update_loads_updated_at` - Automatically updates `updated_at` timestamp on row modifications

## Usage Examples

### Create a new load
```sql
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
    status
) VALUES (
    1,
    '123 Main St, Chicago, IL',
    41.8781,
    -87.6298,
    '456 Elm St, Dallas, TX',
    32.7767,
    -96.7970,
    '2026-03-01',
    '2026-03-03',
    42000.00,
    '{"length": 48, "width": 8, "height": 8.5}'::jsonb,
    'flatbed',
    'Steel beams',
    2500.00,
    'posted'
);
```

### Query available loads
```sql
SELECT *
FROM loads
WHERE status = 'posted'
  AND pickup_date >= CURRENT_DATE
ORDER BY pickup_date;
```

### Query loads by location proximity (example)
```sql
SELECT *,
    SQRT(
        POWER(origin_lat - 41.8781, 2) +
        POWER(origin_lng - (-87.6298), 2)
    ) AS distance
FROM loads
WHERE status = 'posted'
ORDER BY distance
LIMIT 10;
```

## Migration Instructions

### Apply Migration
```bash
psql -d logistack -f migrations/002_create_loads.sql
```

### Load Sample Data (development only)
```bash
psql -d logistack -f migrations/002_create_loads_sample_data.sql
```

### Validate Migration
```bash
psql -d logistack -f migrations/002_create_loads_validation.sql
```

### Rollback Migration
```bash
psql -d logistack -f migrations/002_create_loads_down.sql
```

## Future Enhancements
Potential improvements for future iterations:
- Add full-text search on commodity and special_requirements
- Implement PostGIS for more advanced spatial queries
- Add load_history table for audit trail
- Add bid/quote system for load assignments
- Implement load visibility rules (public vs private)
- Add recurring/template loads support
