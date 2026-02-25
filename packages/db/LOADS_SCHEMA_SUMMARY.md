# Loads Database Schema - Implementation Summary

## Overview
This document summarizes the database schema and models created for the loads management system in Logistack.

## Database Technology
- **ORM**: Drizzle ORM v0.29.3
- **Database**: PostgreSQL
- **Migration Tool**: Drizzle Kit v0.20.10

## Schema Files Created

### 1. Loads Schema (`packages/db/src/schema/loads.ts`)

#### Loads Table
The main table for storing freight load information:

**Fields:**
- `id` - Serial primary key
- `businessId` - Foreign key to users table (business posting the load)
- `truckerId` - Foreign key to users table (trucker assigned, nullable)
- `originLocation` - Text field for pickup address
- `destinationLocation` - Text field for delivery address
- `weight` - Decimal(10,2) for weight in pounds
- `description` - Optional text for cargo details
- `price` - Decimal(10,2) for price in USD
- `pickupDate` - Date for scheduled pickup
- `deliveryDate` - Date for scheduled delivery
- `status` - Enum: 'pending', 'assigned', 'in_transit', 'delivered'
- `createdAt` - Timestamp with timezone
- `updatedAt` - Timestamp with timezone

**Relationships:**
- Many-to-one with users (businessId) - CASCADE delete
- Many-to-one with users (truckerId) - SET NULL on delete

#### Load History Table
Audit table for tracking status changes:

**Fields:**
- `id` - Serial primary key
- `loadId` - Foreign key to loads table
- `oldStatus` - Previous status (nullable for initial)
- `newStatus` - New status after change
- `changedBy` - User who made change (nullable)
- `notes` - Optional notes about the change
- `changedAt` - Timestamp of change

**Features:**
- Automatic status change logging via database trigger
- Tracks both user-initiated and system-initiated changes

### 2. Type Exports (`packages/db/src/index.ts`)
```typescript
export type { Load, NewLoad, LoadHistory, NewLoadHistory } from './schema/loads';
```

## Database Migrations

### Migration 003: Create Updated Loads Table
**File**: `migrations/003_create_loads_updated.sql`

**Features:**
- Creates load_status_enum type
- Creates loads table with all required fields
- Adds performance indexes:
  - Single column indexes on businessId, truckerId, status, dates
  - Composite indexes for common query patterns
- Implements CHECK constraints:
  - `valid_weight`: weight > 0
  - `valid_price`: price >= 0
  - `valid_dates`: delivery_date >= pickup_date
- Auto-updates `updated_at` column via trigger
- Includes comprehensive column comments

### Migration 004: Create Load History Table
**File**: `migrations/004_create_load_history.sql`

**Features:**
- Creates load_history table
- Creates automatic logging trigger function
- Tracks initial status on INSERT
- Tracks status changes on UPDATE
- Includes performance indexes

## Indexes for Performance

### Loads Table Indexes
1. `idx_loads_business_id` - Business load lookups
2. `idx_loads_trucker_id` - Trucker assignment lookups
3. `idx_loads_status` - Status filtering
4. `idx_loads_pickup_date` - Pickup date sorting
5. `idx_loads_delivery_date` - Delivery date sorting
6. `idx_loads_created_at` - Creation time sorting
7. `idx_loads_status_pickup_date` - Available loads queries
8. `idx_loads_status_business_id` - Business dashboard queries
9. `idx_loads_trucker_id_status` - Trucker dashboard queries

### Load History Indexes
1. `idx_load_history_load_id` - History lookups
2. `idx_load_history_changed_at` - Time-based queries
3. `idx_load_history_changed_by` - User audit queries
4. `idx_load_history_load_id_changed_at` - Composite for full history

## Usage Examples

### Create a Load
```typescript
import { db, loads, type NewLoad } from '@logistack/db';

const newLoad: NewLoad = {
  businessId: 1,
  originLocation: 'Los Angeles, CA',
  destinationLocation: 'Phoenix, AZ',
  weight: '45000.00',
  description: 'Palletized freight, refrigeration required',
  price: '2500.00',
  pickupDate: '2026-03-01',
  deliveryDate: '2026-03-02',
  status: 'pending',
};

const [load] = await db.insert(loads).values(newLoad).returning();
```

### Assign Load to Trucker
```typescript
await db
  .update(loads)
  .set({
    truckerId: 5,
    status: 'assigned',
  })
  .where(eq(loads.id, loadId));
// Status change automatically logged to load_history
```

### Query Available Loads
```typescript
const availableLoads = await db
  .select()
  .from(loads)
  .where(
    and(
      eq(loads.status, 'pending'),
      gte(loads.pickupDate, new Date())
    )
  )
  .orderBy(loads.pickupDate);
```

### Get Load with Business and Trucker Info
```typescript
const loadDetails = await db
  .select({
    load: loads,
    business: {
      id: businessUsers.id,
      email: businessUsers.email,
      companyName: businessUsers.companyName,
    },
    trucker: {
      id: truckerUsers.id,
      email: truckerUsers.email,
      phone: truckerUsers.phone,
    },
  })
  .from(loads)
  .innerJoin(businessUsers, eq(loads.businessId, businessUsers.id))
  .leftJoin(truckerUsers, eq(loads.truckerId, truckerUsers.id))
  .where(eq(loads.id, loadId));
```

### Get Load Status History
```typescript
const history = await db
  .select({
    history: loadHistory,
    changedByUser: users,
  })
  .from(loadHistory)
  .leftJoin(users, eq(loadHistory.changedBy, users.id))
  .where(eq(loadHistory.loadId, loadId))
  .orderBy(loadHistory.changedAt);
```

## Database Constraints and Business Rules

### Enforced at Database Level
1. **Weight Validation**: Must be greater than 0
2. **Price Validation**: Must be non-negative
3. **Date Validation**: Delivery date must be on or after pickup date
4. **Foreign Key Integrity**:
   - Deleting a business cascades to delete their loads
   - Deleting a trucker sets load's truckerId to NULL
5. **Status Transitions**: Via enum constraint, only valid statuses allowed

### Status Workflow
```
pending → assigned → in_transit → delivered
```

## TypeScript Type Safety

All database operations are fully type-safe:

```typescript
// Full load record
type Load = typeof loads.$inferSelect;

// For inserting new loads (omits auto-generated fields)
type NewLoad = typeof loads.$inferInsert;

// Load history record
type LoadHistory = typeof loadHistory.$inferSelect;

// For inserting new history records
type NewLoadHistory = typeof loadHistory.$inferInsert;
```

## Files Modified/Created

### Created
1. `packages/db/src/schema/loads.ts` - Drizzle schema definitions
2. `migrations/003_create_loads_updated.sql` - Loads table migration
3. `migrations/003_create_loads_updated_down.sql` - Rollback migration
4. `migrations/004_create_load_history.sql` - Load history migration
5. `migrations/004_create_load_history_down.sql` - Rollback migration

### Modified
1. `packages/db/src/index.ts` - Added Load type exports
2. `packages/db/README.md` - Added loads documentation and examples

## Next Steps

To use this schema in your application:

1. **Apply migrations** to your PostgreSQL database:
   ```bash
   psql -U username -d logistack -f migrations/003_create_loads_updated.sql
   psql -U username -d logistack -f migrations/004_create_load_history.sql
   ```

2. **Import and use** in your API/application code:
   ```typescript
   import {
     createDbConnection,
     loads,
     loadHistory,
     type Load,
     type NewLoad
   } from '@logistack/db';
   ```

3. **Build API endpoints** for:
   - Creating loads (POST /api/loads)
   - Listing available loads (GET /api/loads)
   - Assigning loads to truckers (PATCH /api/loads/:id/assign)
   - Updating load status (PATCH /api/loads/:id/status)
   - Viewing load details and history (GET /api/loads/:id)

## Security Considerations

1. **Input Validation**: Validate all input at the application layer
2. **Authorization**: Ensure users can only modify their own loads
3. **Status Transitions**: Implement business logic to validate status changes
4. **Audit Trail**: load_history provides complete audit trail
5. **Soft Deletes**: Consider implementing if you need to preserve load data

## Performance Considerations

1. **Indexes**: Comprehensive indexes for common query patterns
2. **Connection Pooling**: Use provided connection pool for efficiency
3. **Pagination**: Implement pagination for load listings
4. **Caching**: Consider caching frequently accessed load data
5. **Monitoring**: Track query performance and adjust indexes as needed
