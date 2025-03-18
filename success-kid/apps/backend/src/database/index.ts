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

// Export optimization utilities
export * from './optimization';

// Export database utilities
import { getPool, checkDatabaseConnection, closePool } from './pool';
import { runMigrations, createMigrationClient } from './migrations';
import { getDatabaseMonitor, DatabaseMonitor } from './monitoring';
import { checkDatabaseHealth, DbHealthCheckResult } from './health';
import { 
  createIndexes, 
  schedulePerformanceMonitoring,
  validateCriticalIndexes 
} from './optimization';
import { Pool } from 'pg';
import { logger } from '../lib/logger';

/**
 * Initialize the database connection and run migrations
 * 
 * @param options Initialization options
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeDatabase(options: {
  runMigrations?: boolean;
  createIndexes?: boolean;
  monitorPerformance?: boolean;
  performanceMonitoringInterval?: number;
} = {}): Promise<void> {
  const {
    runMigrations: shouldRunMigrations = true,
    createIndexes: shouldCreateIndexes = true,
    monitorPerformance = true,
    performanceMonitoringInterval = 300000 // 5 minutes
  } = options;
  
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
    if (shouldRunMigrations) {
      const migrationClient = createMigrationClient(pool);
      await migrationClient.runMigrations();
    }
    
    // Create indexes if enabled
    if (shouldCreateIndexes) {
      await createIndexes(pool, true); // Create only critical indexes initially
    }
    
    // Initialize monitoring
    getDatabaseMonitor(pool);
    
    // Start performance monitoring if enabled
    if (monitorPerformance) {
      schedulePerformanceMonitoring(pool, performanceMonitoringInterval);
    }
    
    // Validate critical indexes
    const missingIndexes = await validateCriticalIndexes(pool);
    if (missingIndexes.length > 0) {
      logger.warn('Missing critical indexes detected', { missingIndexes });
    }
    
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
