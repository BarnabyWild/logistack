import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create PostgreSQL connection pool
export const createDbConnection = (connectionString: string) => {
  const pool = new Pool({
    connectionString,
  });

  return drizzle(pool, { schema });
};

// Export schema and types
export * from './schema';
export type { User, NewUser, PublicUser } from './schema/users';
export type { Load, NewLoad, LoadHistory, NewLoadHistory } from './schema/loads';
export type { Route, NewRoute } from './schema/routes';
