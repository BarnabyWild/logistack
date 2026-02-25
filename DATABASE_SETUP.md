# Logistack Database Setup Guide

## Prerequisites

- **PostgreSQL 15+** installed and running (PostgreSQL 18 detected on this system)
- **pnpm** package manager installed
- All project dependencies installed (`pnpm install`)

## Quick Setup

### 1. Create the Database

Connect to PostgreSQL with your admin user and create the `logistack` database:

```sql
-- Using psql or pgAdmin
CREATE DATABASE logistack;
```

Or from the command line:

```bash
# Windows (adjust path to your PostgreSQL installation)
"C:/Program Files/PostgreSQL/18/bin/createdb.exe" -U postgres logistack

# Linux/macOS
createdb -U postgres logistack
```

### 2. Configure Environment Variables

Update the `DATABASE_URL` in **both** of these files with your actual PostgreSQL credentials:

**`apps/api/.env`** (Fastify API on port 3001):
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/logistack
```

**`server/.env`** (Server on port 8080):
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/logistack
```

Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

### 3. Run Migrations (Drizzle Push)

Push the Drizzle ORM schema to the database:

```bash
pnpm run db:migrate
```

This runs `drizzle-kit push:pg` which reads the schema from `packages/db/src/schema/` and creates/updates the database tables.

### 4. Validate the Setup

Run the validation script to confirm everything is working:

```bash
node scripts/validate-db.js
```

## Database Schema

The Logistack database consists of 5 tables defined in `packages/db/src/schema/`:

### Tables

| Table | Schema File | Description |
|-------|-------------|-------------|
| `users` | `schema/users.ts` | User accounts (truckers and businesses) |
| `loads` | `schema/loads.ts` | Freight loads posted by businesses |
| `load_history` | `schema/loads.ts` | Status change audit trail for loads |
| `routes` | `schema/routes.ts` | Trucker route availability |
| `gps_locations` | `schema/gps-tracking.ts` | Real-time GPS tracking data |

### Enum Types

| Enum | Values |
|------|--------|
| `user_type_enum` | trucker, business |
| `load_status_enum` | pending, assigned, in_transit, delivered, cancelled |
| `equipment_type_enum` | dry_van, flatbed, reefer, step_deck, lowboy, tanker, box_truck, power_only, hotshot, container |
| `route_status_enum` | draft, active, matched, in_transit, completed, cancelled, expired |

## Configuration Files

| File | Purpose |
|------|---------|
| `packages/db/drizzle.config.ts` | Drizzle Kit config (schema location, DB credentials) |
| `packages/db/src/index.ts` | Database connection factory (`createDbConnection`) |
| `packages/db/src/schema/index.ts` | Schema barrel export |
| `apps/api/.env` | API server environment (DATABASE_URL) |
| `server/.env` | Server environment (DATABASE_URL) |
| `config/database.js` | Legacy connection helper (CommonJS) |

## How Apps Connect

Both `apps/api` and `server` use the shared `@logistack/db` package:

```typescript
import { createDbConnection } from '@logistack/db';

const db = createDbConnection(process.env.DATABASE_URL!);
```

The connection is created during server startup and decorated onto the Fastify instance as `fastify.db`.

## Troubleshooting

### "password authentication failed"
Your DATABASE_URL has incorrect credentials. Update the username and password in your `.env` files.

### "database logistack does not exist"
Create the database first: `CREATE DATABASE logistack;`

### "ECONNREFUSED" / PostgreSQL not running
Start PostgreSQL:
- **Windows**: Open Services (`services.msc`) and start the PostgreSQL service
- **macOS**: `brew services start postgresql`
- **Linux**: `sudo systemctl start postgresql`

### "relation does not exist"
Tables haven't been created. Run: `pnpm run db:migrate`

### Migration fails with drizzle-kit errors
Ensure `DATABASE_URL` is set and the database exists. The `db:migrate` command runs `drizzle-kit push:pg` which requires a valid connection.

## SQL Migration Files

The `migrations/` directory contains raw SQL migrations for reference and manual setup. These are **not** used by `drizzle-kit push:pg` (which reads from the TypeScript schema). They can be applied manually if needed:

```bash
psql -U postgres -d logistack -f migrations/001_create_users_and_auth.sql
psql -U postgres -d logistack -f migrations/003_create_loads_updated.sql
psql -U postgres -d logistack -f migrations/004_create_load_history.sql
psql -U postgres -d logistack -f migrations/005_create_routes.sql
```

## Current Status

- **PostgreSQL 18**: Installed at `C:/Program Files/PostgreSQL/18/` and running on port 5432
- **Database credentials**: `.env` files contain placeholder credentials (`user:password`) that must be updated
- **Schema definitions**: Complete in `packages/db/src/schema/` (5 tables, 4 enums)
- **Migration command**: `pnpm run db:migrate` runs `drizzle-kit push:pg`
- **Blocker**: Cannot run migrations until valid PostgreSQL credentials are configured in `.env` files
