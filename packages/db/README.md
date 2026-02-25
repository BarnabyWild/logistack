# @logistack/db

Database schema, migrations, and Drizzle ORM setup for the Logistack platform.

## Overview

This package contains:
- **Database Schema**: Drizzle ORM schema definitions
- **Type Definitions**: TypeScript types for all database tables
- **Database Connection**: Connection setup utilities
- **Migration Support**: Links to SQL migrations in `/migrations` directory

## Installation

This package is part of the Logistack monorepo. Install dependencies from the root:

```bash
pnpm install
```

## Usage

### Import Database Connection

```typescript
import { createDbConnection } from '@logistack/db';

const db = createDbConnection(process.env.DATABASE_URL);
```

### Import Schema and Types

```typescript
import {
  users,
  loads,
  type User,
  type NewUser,
  type PublicUser,
  type Load,
  type NewLoad,
  type LoadHistory,
  type NewLoadHistory
} from '@logistack/db';
```

### Example Queries

#### Create a new user

```typescript
import { db, users, type NewUser } from '@logistack/db';

const newUser: NewUser = {
  userType: 'trucker',
  email: 'john@example.com',
  passwordHash: '$2b$12$...', // hashed password
  phone: '+1234567890',
  profileData: {
    license_class: 'CDL-A',
    years_experience: 5,
  },
};

const [user] = await db.insert(users).values(newUser).returning();
```

#### Find user by email

```typescript
import { db, users } from '@logistack/db';
import { eq } from 'drizzle-orm';

const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'john@example.com'))
  .limit(1);
```

#### Update user profile

```typescript
import { db, users } from '@logistack/db';
import { eq } from 'drizzle-orm';

await db
  .update(users)
  .set({
    phone: '+0987654321',
    profileData: {
      license_class: 'CDL-A',
      years_experience: 6,
    },
  })
  .where(eq(users.id, userId));
```

#### Verify email

```typescript
import { db, users } from '@logistack/db';
import { eq } from 'drizzle-orm';

await db
  .update(users)
  .set({ emailVerified: true })
  .where(eq(users.email, 'john@example.com'));
```

#### Set password reset token

```typescript
import { db, users } from '@logistack/db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const resetToken = crypto.randomBytes(32).toString('hex');
const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

await db
  .update(users)
  .set({
    resetToken,
    resetTokenExpiry,
  })
  .where(eq(users.email, 'john@example.com'));
```

#### Find user by reset token

```typescript
import { db, users } from '@logistack/db';
import { eq, gt, and } from 'drizzle-orm';

const user = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.resetToken, token),
      gt(users.resetTokenExpiry, new Date())
    )
  )
  .limit(1);
```

#### Create a new load

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

#### Find available loads (not assigned)

```typescript
import { db, loads } from '@logistack/db';
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

#### Assign a load to a trucker

```typescript
import { db, loads } from '@logistack/db';
import { eq } from 'drizzle-orm';

await db
  .update(loads)
  .set({
    truckerId: 5,
    status: 'assigned',
  })
  .where(eq(loads.id, loadId));
```

#### Get loads for a specific business

```typescript
import { db, loads, users } from '@logistack/db';
import { eq } from 'drizzle-orm';

const businessLoads = await db
  .select({
    load: loads,
    trucker: users,
  })
  .from(loads)
  .leftJoin(users, eq(loads.truckerId, users.id))
  .where(eq(loads.businessId, businessId))
  .orderBy(loads.createdAt);
```

#### Get loads for a specific trucker

```typescript
import { db, loads, users } from '@logistack/db';
import { eq } from 'drizzle-orm';

const truckerLoads = await db
  .select({
    load: loads,
    business: users,
  })
  .from(loads)
  .innerJoin(users, eq(loads.businessId, users.id))
  .where(eq(loads.truckerId, truckerId))
  .orderBy(loads.pickupDate);
```

#### Update load status

```typescript
import { db, loads } from '@logistack/db';
import { eq } from 'drizzle-orm';

await db
  .update(loads)
  .set({ status: 'in_transit' })
  .where(eq(loads.id, loadId));

// Status change is automatically logged in load_history table via trigger
```

#### Get load status history

```typescript
import { db, loadHistory, users } from '@logistack/db';
import { eq } from 'drizzle-orm';

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

## Schema Overview

### Loads Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | serial | No | Primary key |
| `businessId` | integer | No | Foreign key to users table (business posting the load) |
| `truckerId` | integer | Yes | Foreign key to users table (trucker assigned to the load) |
| `originLocation` | text | No | Pickup location address |
| `destinationLocation` | text | No | Delivery location address |
| `weight` | decimal(10,2) | No | Weight in pounds |
| `description` | text | Yes | Cargo details and special instructions |
| `price` | decimal(10,2) | No | Price offered in USD |
| `pickupDate` | date | No | Scheduled pickup date |
| `deliveryDate` | date | No | Scheduled delivery date |
| `status` | enum | No | Load status: 'pending', 'assigned', 'in_transit', 'delivered' |
| `createdAt` | timestamp | No | Load creation time |
| `updatedAt` | timestamp | No | Last update time |

#### Load Status Enum Values
- `pending` - Load posted but not yet assigned to a trucker
- `assigned` - Load assigned to a trucker but not picked up
- `in_transit` - Load picked up and in transit
- `delivered` - Load successfully delivered

#### Indexes
- `idx_loads_business_id` - Lookups by business
- `idx_loads_trucker_id` - Lookups by trucker
- `idx_loads_status` - Filter by status
- `idx_loads_pickup_date` - Sort by pickup date
- `idx_loads_delivery_date` - Sort by delivery date
- `idx_loads_status_pickup_date` - Composite index for common queries
- `idx_loads_status_business_id` - Business load queries by status
- `idx_loads_trucker_id_status` - Trucker load queries by status

#### Constraints
- `valid_weight` - Weight must be greater than 0
- `valid_price` - Price must be greater than or equal to 0
- `valid_dates` - Delivery date must be on or after pickup date

### Load History Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | serial | No | Primary key |
| `loadId` | integer | No | Foreign key to loads table |
| `oldStatus` | enum | Yes | Previous status (null for initial status) |
| `newStatus` | enum | No | New status after change |
| `changedBy` | integer | Yes | User who made the change (null for system changes) |
| `notes` | text | Yes | Optional notes about the change |
| `changedAt` | timestamp | No | When the status change occurred |

The load_history table automatically tracks all status changes via database triggers.

### Users Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | serial | No | Primary key |
| `userType` | enum | No | 'trucker' or 'business' |
| `email` | varchar(255) | No | Unique email address |
| `passwordHash` | varchar(255) | No | Bcrypt password hash |
| `phone` | varchar(20) | Yes | Contact phone number |
| `companyName` | varchar(255) | Yes | Business name |
| `mcNumber` | varchar(50) | Yes | Motor Carrier number |
| `dotNumber` | varchar(50) | Yes | DOT number |
| `insuranceInfo` | jsonb | Yes | Insurance details |
| `profileData` | jsonb | No | Additional profile info |
| `emailVerified` | boolean | No | Email verification status |
| `resetToken` | varchar(255) | Yes | Password reset token |
| `resetTokenExpiry` | timestamp | Yes | Token expiration time |
| `createdAt` | timestamp | No | Account creation time |
| `updatedAt` | timestamp | No | Last update time |

### Indexes

- `idx_users_email` - Email lookups (unique)
- `idx_users_user_type` - Filter by user type
- `idx_users_mc_number` - MC number lookups (partial, excludes NULL)
- `idx_users_reset_token` - Reset token lookups (partial, excludes NULL)
- `idx_users_created_at` - Sort by registration date
- `idx_users_profile_data` - JSONB queries (GIN index)

## Migrations

Database migrations are stored in the `/migrations` directory at the root of the monorepo.

### Apply migrations

```bash
psql -U username -d database_name -f migrations/001_create_users_and_auth.sql
```

### Rollback migrations

```bash
psql -U username -d database_name -f migrations/001_create_users_and_auth_down.sql
```

## Type Safety

All database operations are fully type-safe with TypeScript:

```typescript
import { type User, type NewUser, type PublicUser } from '@logistack/db';

// User - Full user record including sensitive fields
// NewUser - For inserting new users (omits auto-generated fields)
// PublicUser - User without sensitive fields (passwordHash, resetToken, etc.)
```

## Environment Variables

Set the `DATABASE_URL` environment variable:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/logistack
```

## Development

### Generate migrations from schema

```bash
pnpm run generate
```

### Push schema changes to database

```bash
pnpm run migrate
```

### Open Drizzle Studio (database GUI)

```bash
pnpm run studio
```

## Security Best Practices

1. **Always hash passwords** before storing in `passwordHash` using bcrypt with cost factor >= 12
2. **Hash reset tokens** before storing in `resetToken` field
3. **Set expiration times** for reset tokens (typically 1 hour)
4. **Use PublicUser type** when returning user data to clients to exclude sensitive fields
5. **Validate input** at the application layer before database operations
6. **Use parameterized queries** - Drizzle ORM handles this automatically

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Logistack Architecture](../../ARCHITECTURE.md)
