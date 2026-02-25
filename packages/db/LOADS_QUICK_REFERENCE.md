# Loads Schema - Quick Reference Guide

## Import Statement
```typescript
import {
  createDbConnection,
  loads,
  loadHistory,
  type Load,
  type NewLoad,
  type LoadHistory,
  type NewLoadHistory
} from '@logistack/db';
```

## Load Status Enum
```typescript
'pending'     // Load posted, not assigned
'assigned'    // Assigned to trucker, not picked up
'in_transit'  // Picked up, in transit
'delivered'   // Successfully delivered
```

## Common Operations

### 1. Create a New Load
```typescript
const newLoad: NewLoad = {
  businessId: 1,
  originLocation: 'Los Angeles, CA',
  destinationLocation: 'Phoenix, AZ',
  weight: '45000.00',
  description: 'Refrigerated freight',
  price: '2500.00',
  pickupDate: '2026-03-01',
  deliveryDate: '2026-03-02',
  status: 'pending',
};

const [load] = await db.insert(loads).values(newLoad).returning();
```

### 2. Get All Available Loads
```typescript
import { eq, and, gte } from 'drizzle-orm';

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

### 3. Assign Load to Trucker
```typescript
import { eq } from 'drizzle-orm';

await db
  .update(loads)
  .set({
    truckerId: truckerId,
    status: 'assigned',
  })
  .where(eq(loads.id, loadId));
```

### 4. Update Load Status
```typescript
await db
  .update(loads)
  .set({ status: 'in_transit' })
  .where(eq(loads.id, loadId));

// Status change automatically logged in load_history
```

### 5. Get Load Details with Users
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
  .where(eq(loads.id, loadId))
  .limit(1);
```

### 6. Get Loads for a Business
```typescript
const businessLoads = await db
  .select()
  .from(loads)
  .where(eq(loads.businessId, businessId))
  .orderBy(loads.createdAt);
```

### 7. Get Loads for a Trucker
```typescript
const truckerLoads = await db
  .select()
  .from(loads)
  .where(eq(loads.truckerId, truckerId))
  .orderBy(loads.pickupDate);
```

### 8. Get Load Status History
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

### 9. Search Loads by Location
```typescript
import { or, like } from 'drizzle-orm';

const searchResults = await db
  .select()
  .from(loads)
  .where(
    or(
      like(loads.originLocation, `%${searchTerm}%`),
      like(loads.destinationLocation, `%${searchTerm}%`)
    )
  );
```

### 10. Get Loads by Date Range
```typescript
import { between, and } from 'drizzle-orm';

const loadsInRange = await db
  .select()
  .from(loads)
  .where(
    and(
      between(loads.pickupDate, startDate, endDate),
      eq(loads.status, 'pending')
    )
  );
```

## Validation Rules

### At Database Level
- `weight` must be > 0
- `price` must be >= 0
- `deliveryDate` must be >= `pickupDate`
- `status` must be one of: pending, assigned, in_transit, delivered

### At Application Level (Recommended)
- Validate businessId exists and is type 'business'
- Validate truckerId exists and is type 'trucker' (if assigning)
- Validate location strings are not empty
- Validate dates are not in the past
- Validate status transitions (pending → assigned → in_transit → delivered)
- Validate weight and price are reasonable (e.g., weight < 80000 lbs)

## Status Transition Rules

### Valid Transitions
```
pending → assigned     (when trucker accepts)
assigned → in_transit  (when load picked up)
in_transit → delivered (when load delivered)
assigned → pending     (if trucker cancels)
```

### Invalid Transitions
```
pending → in_transit   (must be assigned first)
in_transit → assigned  (cannot go backward)
delivered → *          (final state)
```

## Performance Tips

### Use Indexes Effectively
```typescript
// Good - uses idx_loads_status_business_id
await db.select().from(loads)
  .where(and(
    eq(loads.status, 'pending'),
    eq(loads.businessId, businessId)
  ));

// Good - uses idx_loads_trucker_id_status
await db.select().from(loads)
  .where(and(
    eq(loads.truckerId, truckerId),
    eq(loads.status, 'in_transit')
  ));
```

### Pagination
```typescript
import { desc } from 'drizzle-orm';

const pageSize = 20;
const page = 1;

const paginatedLoads = await db
  .select()
  .from(loads)
  .where(eq(loads.status, 'pending'))
  .orderBy(desc(loads.pickupDate))
  .limit(pageSize)
  .offset((page - 1) * pageSize);
```

### Count Total Records
```typescript
import { count } from 'drizzle-orm';

const [{ total }] = await db
  .select({ total: count() })
  .from(loads)
  .where(eq(loads.status, 'pending'));
```

## Common Queries for API Endpoints

### GET /api/loads (List available loads)
```typescript
const loads = await db
  .select()
  .from(loads)
  .where(eq(loads.status, 'pending'))
  .orderBy(loads.pickupDate)
  .limit(50);
```

### GET /api/loads/:id (Get load details)
```typescript
const [load] = await db
  .select()
  .from(loads)
  .where(eq(loads.id, loadId))
  .limit(1);
```

### POST /api/loads (Create new load)
```typescript
const [newLoad] = await db
  .insert(loads)
  .values(loadData)
  .returning();
```

### PATCH /api/loads/:id/assign (Assign to trucker)
```typescript
const [updated] = await db
  .update(loads)
  .set({ truckerId, status: 'assigned' })
  .where(and(
    eq(loads.id, loadId),
    eq(loads.status, 'pending')
  ))
  .returning();
```

### PATCH /api/loads/:id/status (Update status)
```typescript
const [updated] = await db
  .update(loads)
  .set({ status: newStatus })
  .where(eq(loads.id, loadId))
  .returning();
```

### GET /api/loads/:id/history (Get status history)
```typescript
const history = await db
  .select()
  .from(loadHistory)
  .where(eq(loadHistory.loadId, loadId))
  .orderBy(loadHistory.changedAt);
```

## Error Handling

### Common Errors
```typescript
try {
  await db.insert(loads).values(newLoad);
} catch (error) {
  if (error.code === '23503') {
    // Foreign key violation
    // businessId or truckerId doesn't exist
  }
  if (error.code === '23514') {
    // Check constraint violation
    // Invalid weight, price, or dates
  }
}
```

## TypeScript Types

```typescript
// Full load record (from database)
type Load = {
  id: number;
  businessId: number;
  truckerId: number | null;
  originLocation: string;
  destinationLocation: string;
  weight: string;
  description: string | null;
  price: string;
  pickupDate: string;
  deliveryDate: string;
  status: "pending" | "assigned" | "in_transit" | "delivered";
  createdAt: Date;
  updatedAt: Date;
};

// For inserting (omits auto-generated fields)
type NewLoad = {
  businessId: number;
  truckerId?: number | null;
  originLocation: string;
  destinationLocation: string;
  weight: string;
  description?: string | null;
  price: string;
  pickupDate: string;
  deliveryDate: string;
  status?: "pending" | "assigned" | "in_transit" | "delivered";
};
```

## Migration Commands

### Apply migrations
```bash
psql -U username -d logistack -f migrations/003_create_loads_updated.sql
psql -U username -d logistack -f migrations/004_create_load_history.sql
```

### Rollback migrations
```bash
psql -U username -d logistack -f migrations/004_create_load_history_down.sql
psql -U username -d logistack -f migrations/003_create_loads_updated_down.sql
```

## Database Connection

```typescript
import { createDbConnection } from '@logistack/db';

const db = createDbConnection(process.env.DATABASE_URL);
```

## Additional Resources

- Full documentation: `packages/db/README.md`
- Schema details: `packages/db/LOADS_SCHEMA_SUMMARY.md`
- Migration files: `migrations/003_*.sql` and `migrations/004_*.sql`
- Drizzle ORM docs: https://orm.drizzle.team/
