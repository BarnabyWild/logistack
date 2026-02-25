# Loads and Load History Implementation

## Overview
Migrations 003 and 004 implement the complete loads management system for LogiStack, including the loads table for managing freight load postings and the load_history table for tracking status changes over time.

## Migration Files

### Migration 003: Loads Table
- `003_create_loads_updated.sql` - Main migration file
- `003_create_loads_updated_down.sql` - Rollback migration

### Migration 004: Load History Table
- `004_create_load_history.sql` - Main migration file
- `004_create_load_history_down.sql` - Rollback migration

## Schema Design

### Loads Table

#### Core Fields
- `id` - Primary key (auto-incrementing)
- `business_id` - Foreign key to users table (business that posted the load)
- `trucker_id` - Foreign key to users table (nullable, trucker assigned to the load)

#### Location Fields
- `origin_location` - Full pickup address/location
- `destination_location` - Full delivery address/location

#### Load Specifications
- `weight` - Weight in pounds (decimal for precision)
- `description` - Text description of the load, cargo details, and special instructions
- `price` - Payment amount in USD

#### Schedule Fields
- `pickup_date` - Scheduled pickup date
- `delivery_date` - Scheduled delivery date

#### Status Field
- `status` - Current load status using enum:
  - `pending` - Load posted, waiting for assignment
  - `assigned` - Load assigned to a trucker
  - `in_transit` - Load picked up and being delivered
  - `delivered` - Load successfully delivered

#### Timestamps
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp (auto-updated via trigger)

### Load History Table

#### Core Fields
- `id` - Primary key (auto-incrementing)
- `load_id` - Foreign key to loads table
- `old_status` - Previous status (nullable for initial status)
- `new_status` - New status after change
- `changed_by` - Foreign key to users table (nullable, user who made the change)
- `notes` - Optional text notes about the change
- `changed_at` - Timestamp when the change occurred

## Key Features

### Automatic Status Tracking
The load_history table includes an automatic trigger that logs all status changes:
- Automatically records status changes when loads are updated
- Logs initial status when a new load is created
- Captures timestamp of each change
- No manual intervention required

### Data Integrity Constraints
- `valid_weight` - Weight must be positive
- `valid_price` - Price must be non-negative
- `valid_dates` - Delivery date cannot be before pickup date
- Foreign key cascade rules ensure data consistency

### Performance Indexes

#### Loads Table Indexes
- `idx_loads_business_id` - Queries by business
- `idx_loads_trucker_id` - Queries by trucker
- `idx_loads_status` - Queries by status
- `idx_loads_pickup_date` - Date range queries
- `idx_loads_delivery_date` - Delivery schedule queries
- `idx_loads_created_at` - Recent loads queries
- `idx_loads_status_pickup_date` - Common query pattern
- `idx_loads_status_business_id` - Business loads by status
- `idx_loads_trucker_id_status` - Trucker loads by status

#### Load History Table Indexes
- `idx_load_history_load_id` - Queries by load
- `idx_load_history_changed_at` - Temporal queries
- `idx_load_history_changed_by` - Queries by user
- `idx_load_history_load_id_changed_at` - View history for a specific load

## Drizzle ORM Models

The TypeScript models are defined in `packages/db/src/schema/loads.ts`:

```typescript
import { loads, loadHistory, Load, NewLoad, LoadHistory, NewLoadHistory } from '@logistack/db';
```

### Type Exports
- `Load` - Select type for loads table
- `NewLoad` - Insert type for loads table
- `LoadHistory` - Select type for load_history table
- `NewLoadHistory` - Insert type for load_history table

## Usage Examples

### Create a New Load

```typescript
// Using Drizzle ORM
const newLoad = await db.insert(loads).values({
  businessId: 1,
  originLocation: '123 Main St, Chicago, IL 60601',
  destinationLocation: '456 Elm St, Dallas, TX 75201',
  weight: '42000.00',
  price: '2500.00',
  pickupDate: '2026-03-01',
  deliveryDate: '2026-03-03',
  description: 'Steel beams - handle with care, requires flatbed',
  status: 'pending'
}).returning();
```

```sql
-- Using SQL
INSERT INTO loads (
    business_id,
    origin_location,
    destination_location,
    weight,
    price,
    pickup_date,
    delivery_date,
    description,
    status
) VALUES (
    1,
    '123 Main St, Chicago, IL 60601',
    '456 Elm St, Dallas, TX 75201',
    42000.00,
    2500.00,
    '2026-03-01',
    '2026-03-03',
    'Steel beams - handle with care, requires flatbed',
    'pending'
);
```

### Assign Load to Trucker

```typescript
// Using Drizzle ORM
await db.update(loads)
  .set({
    truckerId: 5,
    status: 'assigned'
  })
  .where(eq(loads.id, 1));
```

```sql
-- Using SQL
UPDATE loads
SET trucker_id = 5, status = 'assigned'
WHERE id = 1;
-- This automatically creates a load_history entry via trigger
```

### Query Available Loads

```typescript
// Using Drizzle ORM
const availableLoads = await db.select()
  .from(loads)
  .where(eq(loads.status, 'pending'))
  .orderBy(desc(loads.pickupDate));
```

```sql
-- Using SQL
SELECT *
FROM loads
WHERE status = 'pending'
  AND pickup_date >= CURRENT_DATE
ORDER BY pickup_date;
```

### View Load History

```typescript
// Using Drizzle ORM
const history = await db.select()
  .from(loadHistory)
  .where(eq(loadHistory.loadId, 1))
  .orderBy(desc(loadHistory.changedAt));
```

```sql
-- Using SQL
SELECT lh.*, u.email as changed_by_email
FROM load_history lh
LEFT JOIN users u ON lh.changed_by = u.id
WHERE lh.load_id = 1
ORDER BY lh.changed_at DESC;
```

### Query Trucker's Assigned Loads

```typescript
// Using Drizzle ORM
const truckerLoads = await db.select()
  .from(loads)
  .where(and(
    eq(loads.truckerId, 5),
    inArray(loads.status, ['assigned', 'in_transit'])
  ));
```

```sql
-- Using SQL
SELECT *
FROM loads
WHERE trucker_id = 5
  AND status IN ('assigned', 'in_transit')
ORDER BY pickup_date;
```

## Migration Instructions

### Apply Migrations

```bash
# Apply loads table migration
psql -d logistack -f migrations/003_create_loads_updated.sql

# Apply load_history table migration
psql -d logistack -f migrations/004_create_load_history.sql
```

### Rollback Migrations

```bash
# Rollback load_history (must be done first due to dependencies)
psql -d logistack -f migrations/004_create_load_history_down.sql

# Rollback loads table
psql -d logistack -f migrations/003_create_loads_updated_down.sql
```

## Important Notes

### Status Change Workflow
1. **pending** → **assigned**: When a trucker accepts/is assigned to a load
2. **assigned** → **in_transit**: When the trucker picks up the load
3. **in_transit** → **delivered**: When the load is delivered

### Automatic History Logging
- The `log_load_status_change_trigger` automatically logs all status changes
- No need to manually insert into load_history table
- Initial status is logged when a load is created
- Only status changes are logged (no duplicate entries)

### Foreign Key Behavior
- **business_id**: CASCADE delete - if business user is deleted, their loads are deleted
- **trucker_id**: SET NULL - if trucker user is deleted, load remains but trucker_id is set to null
- **load_history.load_id**: CASCADE delete - if load is deleted, its history is deleted
- **load_history.changed_by**: SET NULL - if user is deleted, history remains but changed_by is set to null

### Data Migration from Old Schema
If migrating from the old loads table (migration 002), you'll need to:
1. Export existing data
2. Map old fields to new fields:
   - `posted_by` → `business_id`
   - `origin_address` → `origin_location`
   - `destination_address` → `destination_location`
   - `special_requirements` → `description`
3. Handle status enum differences (map 'posted' → 'pending', etc.)
4. Re-import data after applying new migrations

## Future Enhancements

Potential improvements for future iterations:
- Add `assigned_at` timestamp field to track when load was assigned
- Add `picked_up_at` and `delivered_at` timestamps for precise tracking
- Add `estimated_delivery_date` field for real-time updates
- Add reason codes for status changes (delay, cancellation reasons, etc.)
- Add support for load cancellation with reason tracking
- Add automatic notifications on status changes
- Implement soft delete for loads (add `deleted_at` field)
- Add load rating/review system after delivery
