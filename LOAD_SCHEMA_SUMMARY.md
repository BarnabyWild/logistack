# Load Database Schema and Models - Implementation Summary

## Overview
Successfully created database schema and models for the Logistack load management system, including all required fields and a comprehensive history tracking system.

## What Was Created

### 1. Drizzle ORM Schema Files
**Location**: `packages/db/src/schema/`

#### loads.ts
- **loads table schema** with all required fields:
  - `id` - Primary key
  - `business_id` - Foreign key to businesses (required)
  - `trucker_id` - Foreign key to truckers (nullable)
  - `origin_location` - Pickup location
  - `destination_location` - Delivery location
  - `weight` - Load weight in pounds
  - `price` - Payment amount in USD
  - `pickup_date` - Scheduled pickup date
  - `delivery_date` - Scheduled delivery date
  - `status` - Load status enum (pending, assigned, in_transit, delivered)
  - `description` - Load details and special instructions
  - `created_at` - Creation timestamp
  - `updated_at` - Last update timestamp

- **load_history table schema** for audit trail:
  - `id` - Primary key
  - `load_id` - Foreign key to loads
  - `old_status` - Previous status
  - `new_status` - New status
  - `changed_by` - User who made the change (nullable)
  - `notes` - Optional notes about the change
  - `changed_at` - Timestamp of the change

- **TypeScript type exports**:
  - `Load`, `NewLoad` - Types for loads table
  - `LoadHistory`, `NewLoadHistory` - Types for load_history table

#### index.ts
- Updated to export the new loads schema alongside existing users schema

### 2. SQL Migration Files
**Location**: `migrations/`

#### Migration 003: Loads Table
- **003_create_loads_updated.sql** - Creates loads table with:
  - Status enum (pending, assigned, in_transit, delivered)
  - All required fields and constraints
  - Foreign key relationships with CASCADE/SET NULL rules
  - Performance indexes for common queries
  - Auto-update trigger for updated_at field
  - Data validation constraints (valid weight, price, dates, etc.)

- **003_create_loads_updated_down.sql** - Rollback migration to remove loads table

#### Migration 004: Load History Table
- **004_create_load_history.sql** - Creates load_history table with:
  - Full audit trail schema
  - Performance indexes for history queries
  - **Automatic trigger** that logs status changes without manual intervention
  - Logs both INSERT (initial status) and UPDATE (status changes)

- **004_create_load_history_down.sql** - Rollback migration to remove load_history table

### 3. Documentation
**Location**: `migrations/`

#### 003_004_LOADS_IMPLEMENTATION.md
Comprehensive documentation including:
- Complete schema design explanation
- All fields and their purposes
- Index strategy and rationale
- Automatic status tracking details
- Foreign key behavior documentation
- Usage examples in both Drizzle ORM and SQL
- Migration instructions
- Future enhancement suggestions

## Key Features Implemented

### 1. Complete Load Management
All required fields from the specification:
- ✅ id
- ✅ business_id
- ✅ trucker_id (nullable)
- ✅ origin_location
- ✅ destination_location
- ✅ weight
- ✅ price
- ✅ pickup_date
- ✅ delivery_date
- ✅ status (pending/assigned/in-transit/delivered)
- ✅ description
- ✅ created_at
- ✅ updated_at

### 2. Automatic Status Change Tracking
- Trigger automatically logs all status changes to load_history
- No manual intervention required
- Captures initial status on load creation
- Records old and new status for each change
- Includes timestamp for every change

### 3. Data Integrity
- Foreign key constraints with appropriate CASCADE rules
- Check constraints for data validation (weight > 0, price >= 0, valid dates)
- Auto-updating timestamps
- Proper indexing for query performance

### 4. Type Safety
- Full TypeScript type definitions exported from Drizzle schema
- Type-safe queries and inserts
- Inference types for both select and insert operations

## Usage Examples

### Creating a Load
```typescript
import { db, loads } from '@logistack/db';

const newLoad = await db.insert(loads).values({
  businessId: 1,
  originLocation: '123 Main St, Chicago, IL',
  destinationLocation: '456 Elm St, Dallas, TX',
  weight: '42000.00',
  price: '2500.00',
  pickupDate: '2026-03-01',
  deliveryDate: '2026-03-03',
  description: 'Steel beams - requires flatbed',
  status: 'pending'
}).returning();
```

### Assigning a Load to a Trucker
```typescript
await db.update(loads)
  .set({
    truckerId: 5,
    status: 'assigned'
  })
  .where(eq(loads.id, 1));
// Automatically creates a load_history entry via database trigger
```

### Viewing Load History
```typescript
const history = await db.select()
  .from(loadHistory)
  .where(eq(loadHistory.loadId, 1))
  .orderBy(desc(loadHistory.changedAt));
```

## How to Apply Migrations

### Using psql (PostgreSQL command line)
```bash
# Apply loads table migration
psql -d logistack -f migrations/003_create_loads_updated.sql

# Apply load_history table migration
psql -d logistack -f migrations/004_create_load_history.sql
```

### Rollback if needed
```bash
# Rollback in reverse order
psql -d logistack -f migrations/004_create_load_history_down.sql
psql -d logistack -f migrations/003_create_loads_updated_down.sql
```

## Files Created

1. `packages/db/src/schema/loads.ts` - Drizzle ORM schema definitions
2. `packages/db/src/schema/index.ts` - Updated to export loads schema
3. `migrations/003_create_loads_updated.sql` - Loads table migration
4. `migrations/003_create_loads_updated_down.sql` - Loads rollback migration
5. `migrations/004_create_load_history.sql` - Load history migration
6. `migrations/004_create_load_history_down.sql` - Load history rollback migration
7. `migrations/003_004_LOADS_IMPLEMENTATION.md` - Detailed documentation

## Next Steps

1. **Install dependencies** (if not already done):
   ```bash
   pnpm install
   ```

2. **Apply migrations** to your database:
   ```bash
   psql -d logistack -f migrations/003_create_loads_updated.sql
   psql -d logistack -f migrations/004_create_load_history.sql
   ```

3. **Build the db package** (if needed):
   ```bash
   cd packages/db
   pnpm build
   ```

4. **Start using the schema** in your application:
   ```typescript
   import { loads, loadHistory, Load, NewLoad } from '@logistack/db';
   ```

## Architecture Notes

### Status Workflow
- **pending** → **assigned**: When trucker accepts the load
- **assigned** → **in_transit**: When trucker picks up the load
- **in_transit** → **delivered**: When load is delivered

### Foreign Key Behavior
- If a business user is deleted, their loads are deleted (CASCADE)
- If a trucker user is deleted, loads remain but trucker_id is set to null (SET NULL)
- If a load is deleted, its history is also deleted (CASCADE)
- If a user who changed status is deleted, history remains but changed_by is set to null (SET NULL)

### Performance Considerations
- Comprehensive indexes on foreign keys and frequently queried fields
- Composite indexes for common query patterns
- Optimized for queries like "show pending loads", "trucker's assigned loads", "load history"

## Summary

This implementation provides a complete, production-ready load management system with:
- ✅ All required fields as specified
- ✅ Automatic status change tracking
- ✅ Type-safe TypeScript models
- ✅ Well-documented SQL migrations
- ✅ Rollback capability
- ✅ Data integrity constraints
- ✅ Performance optimizations
- ✅ Comprehensive documentation

The schema is ready to use and integrates seamlessly with the existing Logistack architecture using Drizzle ORM and PostgreSQL.
