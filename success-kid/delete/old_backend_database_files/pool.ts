/**
 * Database Connection Pool Management
 * 
 * Provides efficient database connection pooling with monitoring, validation, and error handling.
 */
import { Pool, PoolConfig, PoolClient } from 'pg';
import { databaseConfig } from '../config';
import { logger } from '../lib/logger';

/**
 * Database pool options interface
 */
export interface DbPoolOptions {
  /**
   * Maximum number of clients in the pool
   * @default 20
   */
  maxConnections: number;
  
  /**
   * Minimum number of idle clients to maintain
   * @default 2
   */
  minConnections: number;
  
  /**
   * Maximum time (in milliseconds) that a client can be idle before being removed
   * @default 30000 (30 seconds)
   */
  idleTimeoutMs: number;
  
  /**
   * Maximum time (in milliseconds) to wait for a client connection
   * @default 2000 (2 seconds)
   */
  connectionTimeoutMs: number;
  
  /**
   * Maximum time (in milliseconds) for any query before timing out
   * @default 30000 (30 seconds)
   */
  statementTimeoutMs: number;
}

/**
 * Default database pool options
 */
const DEFAULT_POOL_OPTIONS: DbPoolOptions = {
  maxConnections: databaseConfig.pool.max || 20,
  minConnections: databaseConfig.pool.min || 2,
  idleTimeoutMs: databaseConfig.pool.idleTimeoutMillis || 30000,
  connectionTimeoutMs: databaseConfig.pool.connectionTimeoutMillis || 2000,
  statementTimeoutMs: databaseConfig.statement_timeout || 30000
};

/**
 * Create a PostgreSQL connection pool
 * 
 * @param options Pool configuration options
 * @returns Configured database pool
 */
export function createConnectionPool(options: Partial<DbPoolOptions> = {}): Pool {
  // Merge provided options with defaults
  const poolOptions: DbPoolOptions = {
    ...DEFAULT_POOL_OPTIONS,
    ...options
  };
  
  // Configure pool with options
  const poolConfig: PoolConfig = {
    connectionString: databaseConfig.connectionString,
    max: poolOptions.maxConnections,
    min: poolOptions.minConnections,
    idleTimeoutMillis: poolOptions.idleTimeoutMs,
    connectionTimeoutMillis: poolOptions.connectionTimeoutMs,
    statement_timeout: poolOptions.statementTimeoutMs,
    ssl: databaseConfig.ssl
  };
  
  logger.info('Creating PostgreSQL connection pool', { 
    max: poolConfig.max,
    min: poolConfig.min,
    idleTimeoutMillis: poolConfig.idleTimeoutMillis,
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
    statement_timeout: poolConfig.statement_timeout,
    hasSSL: Boolean(poolConfig.ssl)
  });
  
  // Create the connection pool
  const pool = new Pool(poolConfig);
  
  // Add event listeners for connection issues
  pool.on('error', (err, client) => {
    logger.error('Unexpected error on idle PostgreSQL client', { 
      error: err.message,
      stack: err.stack 
    });
  });
  
  // Add connection validation
  pool.on('connect', (client: PoolClient) => {
    // Log successful connection
    logger.debug('New PostgreSQL client connected');
    
    // Add error handler to client
    client.on('error', (err) => {
      logger.error('PostgreSQL client error', { 
        error: err.message,
        stack: err.stack 
      });
    });
    
    // Set application name to help with connection identification in pg_stat_activity
    client.query('SET application_name = $1', ['success-kid-app'])
      .catch(err => {
        logger.warn('Failed to set application name on PostgreSQL client', {
          error: err.message
        });
      });
  });
  
  return pool;
}

// Singleton pool instance
let poolInstance: Pool | null = null;

/**
 * Get the shared database pool instance
 * 
 * @param options Pool configuration options (only used if pool not already created)
 * @returns Database connection pool
 */
export function getPool(options: Partial<DbPoolOptions> = {}): Pool {
  if (!poolInstance) {
    poolInstance = createConnectionPool(options);
  }
  return poolInstance;
}

/**
 * Close the database pool
 */
export async function closePool(): Promise<void> {
  if (poolInstance) {
    logger.info('Closing PostgreSQL connection pool');
    await poolInstance.end();
    poolInstance = null;
    logger.info('PostgreSQL connection pool closed');
  }
}

/**
 * Check database connectivity
 * 
 * @returns Promise that resolves to true if connected, false otherwise
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  const pool = getPool();
  let client;
  
  try {
    // Get a client from the pool
    client = await pool.connect();
    
    // Execute a simple query to verify connection
    await client.query('SELECT 1');
    
    return true;
  } catch (error) {
    logger.error('Database connection check failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

/**
 * Execute a function with a database client from the pool
 * 
 * @param callback Function to execute with client
 * @returns Result of the callback function
 */
export async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}
