#!/usr/bin/env node
/**
 * Database Connection Validator for Logistack
 *
 * Usage:
 *   node scripts/validate-db.js
 *   DATABASE_URL=postgresql://user:pass@localhost:5432/logistack node scripts/validate-db.js
 *
 * This script checks:
 * 1. PostgreSQL is running and accepting connections
 * 2. The 'logistack' database exists
 * 3. Required tables exist (users, loads, load_history, routes, gps_locations)
 * 4. Schema matches expected Drizzle ORM definitions
 */

const path = require('path');

// Try to load .env from apps/api (has DATABASE_URL)
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', 'apps', 'api', '.env') });
} catch {
  // dotenv may not be available at root
}

// Also try server .env
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', 'server', '.env') });
} catch {
  // ignore
}

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  console.log('=== Logistack Database Validation ===\n');

  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    console.error('');
    console.error('Set it in one of these locations:');
    console.error('  - apps/api/.env');
    console.error('  - server/.env');
    console.error('  - Environment variable: DATABASE_URL=postgresql://user:pass@localhost:5432/logistack');
    console.error('');
    console.error('Example: DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/logistack');
    process.exit(1);
  }

  // Mask password in output
  const maskedUrl = DATABASE_URL.replace(/:([^@]+)@/, ':****@');
  console.log('DATABASE_URL:', maskedUrl);
  console.log('');

  // Try to load pg from packages/db/node_modules
  let Pool;
  try {
    Pool = require(path.resolve(__dirname, '..', 'packages', 'db', 'node_modules', 'pg')).Pool;
  } catch {
    try {
      Pool = require('pg').Pool;
    } catch {
      console.error('ERROR: Cannot find "pg" module. Run "pnpm install" first.');
      process.exit(1);
    }
  }

  // Step 1: Test basic connectivity
  console.log('[1/4] Testing PostgreSQL connection...');
  const pool = new Pool({ connectionString: DATABASE_URL, connectionTimeoutMillis: 10000 });

  try {
    const result = await pool.query('SELECT current_user, current_database(), version()');
    const row = result.rows[0];
    console.log('  OK - Connected as user:', row.current_user);
    console.log('  OK - Database:', row.current_database);
    console.log('  OK - PostgreSQL version:', row.version.split(',')[0]);
    console.log('');
  } catch (err) {
    console.error('  FAILED - Cannot connect to PostgreSQL');
    console.error('  Error:', err.message);
    console.error('');
    if (err.code === '28P01') {
      console.error('  FIX: Update DATABASE_URL with correct username and password.');
    } else if (err.code === '3D000') {
      console.error('  FIX: The database does not exist. Create it with:');
      console.error('    CREATE DATABASE logistack;');
    } else if (err.message.includes('ECONNREFUSED')) {
      console.error('  FIX: PostgreSQL is not running. Start it first.');
    }
    await pool.end();
    process.exit(1);
  }

  // Step 2: Check required enums
  console.log('[2/4] Checking enum types...');
  const expectedEnums = ['user_type_enum', 'load_status_enum', 'equipment_type_enum', 'route_status_enum'];
  try {
    const enumResult = await pool.query(
      "SELECT typname FROM pg_type WHERE typname = ANY($1::text[])",
      [expectedEnums]
    );
    const foundEnums = enumResult.rows.map(r => r.typname);
    for (const e of expectedEnums) {
      if (foundEnums.includes(e)) {
        console.log('  OK -', e, 'exists');
      } else {
        console.log('  MISSING -', e, '(will be created by migration)');
      }
    }
    console.log('');
  } catch (err) {
    console.error('  WARN - Could not check enums:', err.message);
    console.log('');
  }

  // Step 3: Check required tables
  console.log('[3/4] Checking required tables...');
  const expectedTables = ['users', 'loads', 'load_history', 'routes', 'gps_locations'];
  try {
    const tableResult = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])",
      [expectedTables]
    );
    const foundTables = tableResult.rows.map(r => r.tablename);
    let allTablesExist = true;
    for (const t of expectedTables) {
      if (foundTables.includes(t)) {
        console.log('  OK -', t, 'exists');
      } else {
        console.log('  MISSING -', t);
        allTablesExist = false;
      }
    }
    console.log('');

    if (!allTablesExist) {
      console.log('  Some tables are missing. Run migrations to create them:');
      console.log('    pnpm run db:migrate');
      console.log('');
    }
  } catch (err) {
    console.error('  WARN - Could not check tables:', err.message);
    console.log('');
  }

  // Step 4: Check table columns match schema
  console.log('[4/4] Checking table columns...');
  const expectedColumns = {
    users: ['id', 'user_type', 'email', 'password', 'phone', 'company_name', 'mc_number', 'dot_number',
            'insurance_info', 'profile_data', 'email_verified', 'verification_token',
            'reset_password_token', 'reset_password_expires', 'created_at', 'updated_at'],
    loads: ['id', 'business_id', 'trucker_id', 'origin_location', 'destination_location',
            'weight', 'description', 'price', 'pickup_date', 'delivery_date', 'status',
            'created_at', 'updated_at'],
    load_history: ['id', 'load_id', 'old_status', 'new_status', 'changed_by', 'notes', 'changed_at'],
    routes: ['id', 'trucker_id', 'start_location', 'start_lat', 'start_lng',
             'end_location', 'end_lat', 'end_lng', 'departure_date', 'arrival_date',
             'available_capacity', 'equipment_type', 'status', 'created_at', 'updated_at'],
    gps_locations: ['id', 'load_id', 'trucker_id', 'latitude', 'longitude', 'altitude',
                    'speed', 'heading', 'accuracy', 'device_id', 'recorded_at', 'created_at'],
  };

  for (const [table, columns] of Object.entries(expectedColumns)) {
    try {
      const colResult = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
        [table]
      );
      if (colResult.rows.length === 0) {
        console.log(' ', table, '- table does not exist (skipped)');
        continue;
      }
      const foundColumns = colResult.rows.map(r => r.column_name);
      const missingCols = columns.filter(c => !foundColumns.includes(c));
      const extraCols = foundColumns.filter(c => !columns.includes(c));

      if (missingCols.length === 0 && extraCols.length === 0) {
        console.log(' ', table, '- OK (', foundColumns.length, 'columns match schema)');
      } else {
        if (missingCols.length > 0) {
          console.log(' ', table, '- MISSING columns:', missingCols.join(', '));
        }
        if (extraCols.length > 0) {
          console.log(' ', table, '- EXTRA columns:', extraCols.join(', '));
        }
      }
    } catch (err) {
      console.log(' ', table, '- ERROR:', err.message);
    }
  }

  console.log('');
  console.log('=== Validation Complete ===');

  await pool.end();
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
