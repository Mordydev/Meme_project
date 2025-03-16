/**
 * Database Health Checks
 * 
 * Provides utilities for checking database health and connectivity.
 */
import { Pool } from 'pg';
import { logger } from '../lib/logger';

/**
 * Database health check result
 */
export interface DbHealthCheckResult {
  isHealthy: boolean;
  responseTimeMs: number;
  connectionsAvailable: boolean;
  tablesAccessible: boolean;
  writeOperationsWorking: boolean;
  replicationLag?: number;
  details?: Record<string, any>;
  error?: string;
}

/**
 * Database health check options
 */
export interface DbHealthCheckOptions {
  /**
   * Check table accessibility
   * @default true
   */
  checkTables?: boolean;
  
  /**
   * Check write operations
   * @default false
   */
  checkWrites?: boolean;
  
  /**
   * Check replication lag (if applicable)
   * @default false
   */
  checkReplication?: boolean;
  
  /**
   * Timeout for health check in milliseconds
   * @default 5000
   */
  timeoutMs?: number;
}

/**
 * Default health check options
 */
const DEFAULT_HEALTH_CHECK_OPTIONS: DbHealthCheckOptions = {
  checkTables: true,
  checkWrites: false,
  checkReplication: false,
  timeoutMs: 5000
};

/**
 * Check database health
 * 
 * @param pool Database connection pool
 * @param options Health check options
 * @returns Health check result
 */
export async function checkDatabaseHealth(
  pool: Pool,
  options: DbHealthCheckOptions = {}
): Promise<DbHealthCheckResult> {
  // Merge options with defaults
  const opts = { ...DEFAULT_HEALTH_CHECK_OPTIONS, ...options };
  
  const startTime = Date.now();
  let client;
  
  try {
    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database health check timed out after ${opts.timeoutMs}ms`));
      }, opts.timeoutMs);
    });
    
    // Run health check with timeout
    const healthCheckPromise = runHealthChecks(pool, opts);
    const result = await Promise.race([healthCheckPromise, timeoutPromise]);
    
    const responseTimeMs = Date.now() - startTime;
    return {
      ...result,
      responseTimeMs
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : String(error),
      responseTimeMs
    });
    
    return {
      isHealthy: false,
      responseTimeMs,
      connectionsAvailable: false,
      tablesAccessible: false,
      writeOperationsWorking: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Run database health checks
 * 
 * @param pool Database connection pool
 * @param options Health check options
 * @returns Health check result
 */
async function runHealthChecks(
  pool: Pool,
  options: DbHealthCheckOptions
): Promise<Omit<DbHealthCheckResult, 'responseTimeMs'>> {
  let client;
  const details: Record<string, any> = {};
  
  try {
    // Check connection availability
    client = await pool.connect();
    details.connectionsAvailable = true;
    
    // Check basic connectivity
    await client.query('SELECT 1 as result');
    
    // Check table accessibility if enabled
    let tablesAccessible = true;
    if (options.checkTables) {
      try {
        // Check if the most important tables are accessible
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'profiles', 'content', 'user_points');
        `);
        
        details.accessibleTables = result.rows.map(row => row.table_name);
        tablesAccessible = result.rows.length > 0;
      } catch (error) {
        tablesAccessible = false;
        details.tableAccessError = error instanceof Error ? error.message : String(error);
      }
    }
    
    // Check write operations if enabled
    let writeOperationsWorking = false;
    if (options.checkWrites) {
      try {
        // Use a transaction to test write operations without keeping test data
        await client.query('BEGIN');
        
        // Insert a test record
        await client.query(`
          CREATE TABLE IF NOT EXISTS health_check_test (
            id SERIAL PRIMARY KEY,
            check_time TIMESTAMP DEFAULT NOW()
          )
        `);
        
        await client.query('INSERT INTO health_check_test DEFAULT VALUES RETURNING id');
        
        // Roll back the transaction
        await client.query('ROLLBACK');
        
        writeOperationsWorking = true;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        writeOperationsWorking = false;
        details.writeError = error instanceof Error ? error.message : String(error);
      }
    } else {
      // Skip write check if not enabled
      writeOperationsWorking = true;
    }
    
    // Check replication lag if enabled
    let replicationLag = undefined;
    if (options.checkReplication) {
      try {
        // This query only works if the database is a replica
        const replicationResult = await client.query(`
          SELECT 
            CASE 
              WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() THEN 0
              ELSE EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp()))
            END AS lag_seconds;
        `);
        
        if (replicationResult.rows.length > 0) {
          replicationLag = parseFloat(replicationResult.rows[0].lag_seconds);
          details.isReplica = true;
        } else {
          details.isReplica = false;
        }
      } catch (error) {
        // Not a replica or no permission to check
        details.isReplica = false;
        details.replicationCheckError = error instanceof Error ? error.message : String(error);
      }
    }
    
    return {
      isHealthy: details.connectionsAvailable && tablesAccessible && writeOperationsWorking,
      connectionsAvailable: details.connectionsAvailable,
      tablesAccessible,
      writeOperationsWorking,
      replicationLag,
      details
    };
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      isHealthy: false,
      connectionsAvailable: false,
      tablesAccessible: false,
      writeOperationsWorking: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}
