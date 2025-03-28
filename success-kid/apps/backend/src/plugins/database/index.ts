/**
 * Database Plugin for Fastify
 * 
 * Registers PostgreSQL database connection with Fastify and provides
 * lifecycle management for database connections.
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { databaseConfig } from '../../config';
import { logger } from '../../lib/logger';

/**
 * Plugin to register PostgreSQL database connection with Fastify
 */
export default fp(async function(fastify: FastifyInstance) {
  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: databaseConfig.connectionString,
    max: databaseConfig.pool.max,
    min: databaseConfig.pool.min,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    statement_timeout: databaseConfig.statement_timeout,
    ssl: databaseConfig.ssl,
  });

  // Test database connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now');
    client.release();
    
    fastify.log.info(`PostgreSQL connected: ${result.rows[0].now}`);
  } catch (err) {
    fastify.log.error('Failed to connect to PostgreSQL', err);
    throw err;
  }

  // Handle connection errors
  pool.on('error', (err) => {
    fastify.log.error('Unexpected error on idle PostgreSQL client', err);
  });

  // Decorate Fastify instance with database pool
  fastify.decorate('db', pool);

  // Add hook to close database connections on shutdown
  fastify.addHook('onClose', async (instance) => {
    fastify.log.info('Closing PostgreSQL connections');
    await instance.db.end();
    fastify.log.info('PostgreSQL connections closed');
  });
}, {
  name: 'fastify-postgres',
  dependencies: [],
});
