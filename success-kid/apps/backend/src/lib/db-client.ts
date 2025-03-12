/**
 * Database Client Singleton
 * 
 * This module provides singleton instances of database clients
 * for PostgreSQL and Redis, ensuring efficient connection management.
 */
import { Pool } from 'pg';
import Redis from 'ioredis';
import { databaseConfig, redisConfig } from '../config';
import { logger } from './logger';

// PostgreSQL connection pool singleton
let pgPool: Pool | null = null;

/**
 * Get PostgreSQL connection pool instance
 * @returns PostgreSQL connection pool
 */
export function getPgPool(): Pool {
  if (!pgPool) {
    // Create a new connection pool
    pgPool = new Pool({
      connectionString: databaseConfig.connectionString,
      max: databaseConfig.pool.max,
      min: databaseConfig.pool.min,
      idleTimeoutMillis: databaseConfig.pool.idleTimeoutMillis,
      connectionTimeoutMillis: databaseConfig.pool.connectionTimeoutMillis,
      ssl: databaseConfig.ssl,
    });
    
    // Handle pool errors
    pgPool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', { error: err.message, stack: err.stack });
    });
    
    // Log connection success
    pgPool.query('SELECT NOW()')
      .then(() => logger.info('PostgreSQL connection established'))
      .catch((err) => logger.error('PostgreSQL connection failed', { error: err.message, stack: err.stack }));
  }
  
  return pgPool;
}

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get Redis client instance
 * @returns Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    // Create a new Redis client
    redisClient = new Redis(redisConfig.url, {
      ...redisConfig.options,
      keyPrefix: redisConfig.keyPrefix,
    });
    
    // Handle connection events
    redisClient.on('connect', () => {
      logger.info('Redis connection established');
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message, stack: err.stack });
    });
    
    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting');
    });
  }
  
  return redisClient;
}

/**
 * Close all database connections
 * Used for graceful shutdown
 */
export async function closeConnections(): Promise<void> {
  // Close PostgreSQL connection pool
  if (pgPool) {
    logger.info('Closing PostgreSQL connection pool');
    await pgPool.end();
    pgPool = null;
  }
  
  // Close Redis connection
  if (redisClient) {
    logger.info('Closing Redis connection');
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Check database health
 * Used for health monitoring
 */
export async function checkDatabaseHealth(): Promise<{ postgres: boolean; redis: boolean }> {
  const health = {
    postgres: false,
    redis: false,
  };
  
  // Check PostgreSQL health
  try {
    const pg = getPgPool();
    await pg.query('SELECT 1');
    health.postgres = true;
  } catch (error) {
    logger.error('PostgreSQL health check failed', { error });
  }
  
  // Check Redis health
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.redis = true;
  } catch (error) {
    logger.error('Redis health check failed', { error });
  }
  
  return health;
}

// Export the closeConnections function as a default export for convenient imports
export default {
  getPgPool,
  getRedisClient,
  closeConnections,
  checkDatabaseHealth,
};