/**
 * Database Module
 * 
 * This module provides utilities for database connectivity, monitoring, migrations,
 * and health checks.
 */

// Export connection pool management
export * from './pool';

// Export migrations
export * from './migrations';

// Export monitoring utilities
export * from './monitoring';

// Export health checks
export * from './health';

// Export database utilities
import { getPool, checkDatabaseConnection, closePool } from './pool';
import { runMigrations, createMigrationClient } from './migrations';
import { getDatabaseMonitor, DatabaseMonitor } from './monitoring';
import { checkDatabaseHealth, DbHealthCheckResult } from './health';
import { Pool } from 'pg';
import { logger } from '../lib/logger';

/**
 * Initialize the database connection and run migrations
 * 
 * @param runMigrations Whether to run migrations during initialization
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeDatabase(runMigrations: boolean = true): Promise<void> {
  try {
    logger.info('Initializing database connection');
    
    // Get database pool
    const pool = getPool();
    
    // Check connection
    const connected = await checkDatabaseConnection();
    if (!connected) {
      throw new Error('Could not connect to database');
    }
    
    logger.info('Successfully connected to database');
    
    // Run migrations if enabled
    if (runMigrations) {
      const migrationClient = createMigrationClient(pool);
      await migrationClient.runMigrations();
    }
    
    // Initialize monitoring
    getDatabaseMonitor(pool);
    
    logger.info('Database initialization complete');
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get database connection and utilities
 * 
 * @returns Database connection and utilities
 */
export function getDatabase(): {
  pool: Pool;
  monitor: DatabaseMonitor;
  checkHealth: () => Promise<DbHealthCheckResult>;
  close: () => Promise<void>;
} {
  const pool = getPool();
  const monitor = getDatabaseMonitor(pool);
  
  return {
    pool,
    monitor,
    checkHealth: () => checkDatabaseHealth(pool),
    close: closePool
  };
}

// Export default object for convenient import
export default {
  initialize: initializeDatabase,
  getDatabase,
  getPool,
  runMigrations,
  closePool
};
