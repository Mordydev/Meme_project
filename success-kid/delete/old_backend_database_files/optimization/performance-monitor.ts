/**
 * Database Performance Monitor
 * 
 * Monitors database performance metrics and provides insights for optimization.
 */
import { Pool } from 'pg';
import { logger } from '../../lib/logger';

/**
 * Database performance metrics
 */
export interface DbPerformanceMetrics {
  /** Timestamp when metrics were collected */
  timestamp: Date;
  
  /** Connection pool statistics */
  poolStats: {
    /** Total connections */
    total: number;
    /** Idle connections */
    idle: number;
    /** Active connections */
    active: number;
    /** Waiting clients */
    waiting: number;
    /** Maximum connections */
    max: number;
  };
  
  /** Database statistics */
  dbStats: {
    /** Active backends (connections) */
    activeBackends: number;
    /** Transactions committed */
    transactionsCommitted: number;
    /** Transactions rolled back */
    transactionsRolledBack: number;
    /** Blocks read from disk */
    blocksRead: number;
    /** Blocks read from buffer cache */
    blocksHit: number;
    /** Tuple operations */
    tupleOperations: {
      /** Rows returned by queries */
      returned: number;
      /** Rows fetched by queries */
      fetched: number;
      /** Rows inserted */
      inserted: number;
      /** Rows updated */
      updated: number;
      /** Rows deleted */
      deleted: number;
    };
  };
  
  /** Slow query statistics */
  slowQueries: {
    /** Number of slow queries detected */
    count: number;
    /** Average execution time of slow queries (ms) */
    avgTime: number;
    /** Maximum execution time of slow queries (ms) */
    maxTime: number;
  };
  
  /** Index usage statistics */
  indexUsage: {
    /** Ratio of index scans to sequential scans */
    indexToSeqScanRatio: number;
    /** Number of unused indexes */
    unusedIndexes: number;
    /** Size of unused indexes (bytes) */
    unusedIndexSize: number;
  };
}

/**
 * Collects database performance metrics
 * 
 * @param pool Database connection pool
 * @returns Promise that resolves to performance metrics
 */
export async function collectPerformanceMetrics(pool: Pool): Promise<DbPerformanceMetrics> {
  try {
    // Get pool statistics
    const poolStats = getPoolStats(pool);
    
    // Get database statistics
    const dbStats = await getDbStats(pool);
    
    // Get slow query statistics
    const slowQueries = await getSlowQueryStats(pool);
    
    // Get index usage statistics
    const indexUsage = await getIndexUsageStats(pool);
    
    return {
      timestamp: new Date(),
      poolStats,
      dbStats,
      slowQueries,
      indexUsage
    };
  } catch (error) {
    logger.error('Failed to collect database performance metrics', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Return partial metrics if available
    return {
      timestamp: new Date(),
      poolStats: getPoolStats(pool),
      dbStats: {
        activeBackends: 0,
        transactionsCommitted: 0,
        transactionsRolledBack: 0,
        blocksRead: 0,
        blocksHit: 0,
        tupleOperations: {
          returned: 0,
          fetched: 0,
          inserted: 0,
          updated: 0,
          deleted: 0
        }
      },
      slowQueries: {
        count: 0,
        avgTime: 0,
        maxTime: 0
      },
      indexUsage: {
        indexToSeqScanRatio: 0,
        unusedIndexes: 0,
        unusedIndexSize: 0
      }
    };
  }
}

/**
 * Get connection pool statistics
 * 
 * @param pool Database connection pool
 * @returns Pool statistics
 */
function getPoolStats(pool: Pool): DbPerformanceMetrics['poolStats'] {
  // Access pool internal properties (these are semi-private but commonly used)
  const poolInstance = pool as any;
  
  return {
    total: poolInstance._clients ? poolInstance._clients.length : 0,
    idle: poolInstance._idle ? poolInstance._idle.length : 0,
    active: poolInstance._clients ? 
      poolInstance._clients.length - (poolInstance._idle ? poolInstance._idle.length : 0) : 0,
    waiting: poolInstance._pendingQueue ? poolInstance._pendingQueue.length : 0,
    max: poolInstance.options ? poolInstance.options.max : 0
  };
}

/**
 * Get database statistics
 * 
 * @param pool Database connection pool
 * @returns Promise that resolves to database statistics
 */
async function getDbStats(pool: Pool): Promise<DbPerformanceMetrics['dbStats']> {
  // Query for general database statistics
  const statsResult = await pool.query(`
    SELECT 
      numbackends as active_backends,
      xact_commit as transactions_committed,
      xact_rollback as transactions_rolled_back,
      blks_read as blocks_read,
      blks_hit as blocks_hit,
      tup_returned,
      tup_fetched,
      tup_inserted,
      tup_updated,
      tup_deleted
    FROM 
      pg_stat_database 
    WHERE 
      datname = current_database()
  `);
  
  const stats = statsResult.rows[0];
  
  return {
    activeBackends: parseInt(stats.active_backends, 10),
    transactionsCommitted: parseInt(stats.transactions_committed, 10),
    transactionsRolledBack: parseInt(stats.transactions_rolled_back, 10),
    blocksRead: parseInt(stats.blocks_read, 10),
    blocksHit: parseInt(stats.blocks_hit, 10),
    tupleOperations: {
      returned: parseInt(stats.tup_returned, 10),
      fetched: parseInt(stats.tup_fetched, 10),
      inserted: parseInt(stats.tup_inserted, 10),
      updated: parseInt(stats.tup_updated, 10),
      deleted: parseInt(stats.tup_deleted, 10)
    }
  };
}

/**
 * Get slow query statistics
 * 
 * @param pool Database connection pool
 * @returns Promise that resolves to slow query statistics
 */
async function getSlowQueryStats(pool: Pool): Promise<DbPerformanceMetrics['slowQueries']> {
  // This requires pg_stat_statements extension
  try {
    const slowQueriesResult = await pool.query(`
      SELECT 
        count(*) as query_count,
        avg(mean_exec_time) as avg_time,
        max(mean_exec_time) as max_time
      FROM 
        pg_stat_statements
      WHERE 
        mean_exec_time > 200
    `);
    
    if (slowQueriesResult.rows.length > 0) {
      const slowStats = slowQueriesResult.rows[0];
      
      return {
        count: parseInt(slowStats.query_count, 10),
        avgTime: parseFloat(slowStats.avg_time),
        maxTime: parseFloat(slowStats.max_time)
      };
    }
  } catch (error) {
    // pg_stat_statements may not be available, so return defaults
    logger.warn('Could not collect slow query stats, pg_stat_statements may not be enabled');
  }
  
  return {
    count: 0,
    avgTime: 0,
    maxTime: 0
  };
}

/**
 * Get index usage statistics
 * 
 * @param pool Database connection pool
 * @returns Promise that resolves to index usage statistics
 */
async function getIndexUsageStats(pool: Pool): Promise<DbPerformanceMetrics['indexUsage']> {
  // Get index usage stats
  const indexStatsResult = await pool.query(`
    SELECT 
      sum(idx_scan) as idx_scan_total,
      sum(seq_scan) as seq_scan_total
    FROM 
      pg_stat_user_tables
  `);
  
  // Get unused indexes
  const unusedIndexesResult = await pool.query(`
    SELECT 
      count(*) as unused_count,
      sum(pg_relation_size(indexrelid)) as unused_size
    FROM 
      pg_stat_user_indexes
    WHERE 
      idx_scan = 0 AND
      indexrelid NOT IN (
        SELECT indexrelid
        FROM pg_constraint
        WHERE contype = 'p' OR contype = 'u'
      )
  `);
  
  const indexStats = indexStatsResult.rows[0];
  const unusedStats = unusedIndexesResult.rows[0];
  
  // Calculate ratio, avoiding division by zero
  const idxScanTotal = parseInt(indexStats.idx_scan_total, 10) || 0;
  const seqScanTotal = parseInt(indexStats.seq_scan_total, 10) || 1; // Avoid division by zero
  
  return {
    indexToSeqScanRatio: idxScanTotal / seqScanTotal,
    unusedIndexes: parseInt(unusedStats.unused_count, 10),
    unusedIndexSize: parseInt(unusedStats.unused_size, 10)
  };
}

/**
 * Analyze performance metrics and identify potential issues
 * 
 * @param metrics Database performance metrics
 * @returns Array of identified issues
 */
export function identifyPerformanceIssues(metrics: DbPerformanceMetrics): string[] {
  const issues: string[] = [];
  
  // Check connection pool utilization
  const poolUtilization = metrics.poolStats.active / metrics.poolStats.max;
  if (poolUtilization > 0.9) {
    issues.push(`High connection pool utilization (${Math.round(poolUtilization * 100)}%) - consider increasing max connections`);
  }
  
  // Check for connection pool saturation
  if (metrics.poolStats.waiting > 0) {
    issues.push(`Connection pool has ${metrics.poolStats.waiting} waiting clients - potential connection bottleneck`);
  }
  
  // Check buffer cache hit ratio
  const hitRatio = metrics.dbStats.blocksHit / (metrics.dbStats.blocksHit + metrics.dbStats.blocksRead || 1);
  if (hitRatio < 0.95) {
    issues.push(`Low buffer cache hit ratio (${Math.round(hitRatio * 100)}%) - consider increasing shared_buffers`);
  }
  
  // Check transaction rollback ratio
  const rollbackRatio = metrics.dbStats.transactionsRolledBack / 
    (metrics.dbStats.transactionsCommitted + metrics.dbStats.transactionsRolledBack || 1);
  if (rollbackRatio > 0.05) {
    issues.push(`High transaction rollback ratio (${Math.round(rollbackRatio * 100)}%) - check for application errors`);
  }
  
  // Check slow queries
  if (metrics.slowQueries.count > 0) {
    issues.push(`${metrics.slowQueries.count} slow queries detected with average time ${Math.round(metrics.slowQueries.avgTime)}ms`);
  }
  
  // Check index to sequential scan ratio
  if (metrics.indexUsage.indexToSeqScanRatio < 10) {
    issues.push(`Low index usage ratio (${metrics.indexUsage.indexToSeqScanRatio.toFixed(2)}) - check for missing indexes`);
  }
  
  // Check for unused indexes
  if (metrics.indexUsage.unusedIndexes > 0) {
    const sizeInMB = metrics.indexUsage.unusedIndexSize / (1024 * 1024);
    issues.push(`${metrics.indexUsage.unusedIndexes} unused indexes consuming ${sizeInMB.toFixed(2)} MB`);
  }
  
  return issues;
}

/**
 * Schedule periodic performance monitoring
 * 
 * @param pool Database connection pool
 * @param intervalMs Monitoring interval in milliseconds
 * @returns Monitoring interval ID
 */
export function schedulePerformanceMonitoring(
  pool: Pool, 
  intervalMs: number = 300000 // Default: 5 minutes
): NodeJS.Timeout {
  logger.info(`Scheduling database performance monitoring every ${intervalMs / 1000} seconds`);
  
  return setInterval(async () => {
    try {
      // Collect metrics
      const metrics = await collectPerformanceMetrics(pool);
      
      // Identify issues
      const issues = identifyPerformanceIssues(metrics);
      
      // Log issues if any
      if (issues.length > 0) {
        logger.warn('Database performance issues detected', { issues, metrics });
      } else {
        logger.debug('Database performance metrics collected', { metrics });
      }
    } catch (error) {
      logger.error('Failed to monitor database performance', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, intervalMs);
}

export default {
  collectPerformanceMetrics,
  identifyPerformanceIssues,
  schedulePerformanceMonitoring
};
