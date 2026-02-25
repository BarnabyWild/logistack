// Register ts-node to handle TypeScript imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
});

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('../packages/db/src/schema');

/**
 * Create and configure database connection
 * @param {string} connectionString - PostgreSQL connection string
 * @returns {object} Drizzle database instance
 */
function createDbConnection(connectionString) {
  const pool = new Pool({
    connectionString,
  });

  return drizzle(pool, { schema });
}

module.exports = { createDbConnection, schema };
