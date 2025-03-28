/**
 * Database Monitoring Utilities
 * 
 * Provides tools for monitoring database performance, connection pool status,
 * and query execution metrics. Tracks slow queries, resource utilization, and
 * database performance metrics for health monitoring and optimization.
 */

// Performance monitoring constants
const METRICS_RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
const METRICS_COLLECTION_INTERVAL_MS = 60 * 1000; // 1 minute
import { Pool } from 'pg';
import { logger } from '../lib/logger';

/**
 * Slow query threshold in milliseconds
 */
const SLOW_QUERY_THRESHOLD_MS = 1000;

/**
 * Database metrics interface
 */
/**
 * Database performance metrics
 */
export interface DbMetrics {
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
  totalConnections: number;
  connectionUtilization: number;
  avgQueryExecutionTime: number;
  slowQueries: SlowQuery[];
  databaseSize: string;
  cacheHitRatio: number;
  deadlocks: number;
  activeTransactions: number;
}

/**
 * Slow query information interface
 */
/**
 * Slow query information with query text, duration, and execution context
 */
export interface SlowQuery {
  query: string;
  duration: number;
  executedAt: Date;
  source?: string;
}

/**
 * Database lock information
 */
/**
 * Database lock information for detecting and resolving deadlocks
 */
export interface DbLock {
  pid: number;
  locktype: string;
  lockMode: string;
  tableName: string;
  applicationName: string;
  queryStart: Date;
  durationSec: number;
  waitEvent: string;
  state: string;
  query: string;
}

/**
 * Database monitoring service
 */
/**
 * Time-series metrics point
 */
export interface MetricsPoint {
  timestamp: Date;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
  avgQueryExecutionTime: number;
  slowQueriesCount: number;
}

/**
 * Database monitoring service
 * 
 * Provides real-time and historical metrics for database performance monitoring,
 * query optimization, and health checks.
 */
export class DatabaseMonitor {
  private slowQueries: SlowQuery[] = [];
  private queryTimes: number[] = [];
  private maxSlowQueries = 100;
  private metricsHistory: MetricsPoint[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;
  private lastCollectionTime: Date = new Date();
  private queryCountByTable: Map<string, number> = new Map();
  private indexUsageStats: Map<string, { used: number, unused: number }> = new Map();
  
  /**
   * Create a database monitor
   * 
   * @param pool Database connection pool
   */
  constructor(private readonly pool: Pool) {
    // Start periodic metrics collection
    this.startMetricsCollection();
  }
  
  /**
   * Record a query execution time
   * 
   * @param query SQL query text
   * @param durationMs Duration in milliseconds
   * @param source Source of the query (e.g., repository or service name)
   */
  recordQueryExecution(query: string, durationMs: number, source?: string): void {
    this.queryTimes.push(durationMs);
    
    // Maintain rolling window of last 1000 queries for average calculation
    if (this.queryTimes.length > 1000) {
      this.queryTimes.shift();
    }
    
    // Record slow queries
    if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
      // Log slow query
      logger.warn('Slow query detected', {
        query: this.sanitizeQueryForLogging(query),
        durationMs,
        source
      });
      
      // Add to slow queries list
      this.slowQueries.push({
        query: this.sanitizeQueryForLogging(query),
        duration: durationMs,
        executedAt: new Date(),
        source
      });
      
      // Maintain limited history
      if (this.slowQueries.length > this.maxSlowQueries) {
        this.slowQueries.shift();
      }
    }
  }
  
  /**
   * Get database metrics
   * 
   * @returns Database metrics
   */
  async getMetrics(): Promise<DbMetrics> {
    try {
      // Get pool statistics
      const poolStats = {
        totalConnections: (this.pool as any).totalCount || 0,
        idleConnections: (this.pool as any).idleCount || 0,
        waitingClients: (this.pool as any).waitingCount || 0
      };
      
      const activeConnections = poolStats.totalConnections - poolStats.idleConnections;
      const maxConnections = (this.pool as any).options.max || 10;
      
      // Calculate average query execution time
      const avgQueryExecutionTime = this.queryTimes.length > 0
        ? this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length
        : 0;
      
      // Get additional database information from PostgreSQL
      const dbStats = await this.getDatabaseStats();
      
      return {
        activeConnections,
        idleConnections: poolStats.idleConnections,
        waitingClients: poolStats.waitingClients,
        maxConnections,
        totalConnections: poolStats.totalConnections,
        connectionUtilization: poolStats.totalConnections > 0
          ? activeConnections / poolStats.totalConnections
          : 0,
        avgQueryExecutionTime,
        slowQueries: this.slowQueries,
        databaseSize: dbStats.databaseSize,
        cacheHitRatio: dbStats.cacheHitRatio,
        deadlocks: dbStats.deadlocks,
        activeTransactions: dbStats.activeTransactions
      };
    } catch (error) {
      logger.error('Error getting database metrics', { error });
      
      // Return basic metrics if database query fails
      return {
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        maxConnections: 0,
        totalConnections: 0,
        connectionUtilization: 0,
        avgQueryExecutionTime: 0,
        slowQueries: this.slowQueries,
        databaseSize: 'Unknown',
        cacheHitRatio: 0,
        deadlocks: 0,
        activeTransactions: 0
      };
    }
  }
  
  /**
   * Get active database locks
   * 
   * @returns Array of active locks
   */
  async getActiveLocks(): Promise<DbLock[]> {
    try {
      const result = await this.pool.query(`
        SELECT 
          blocked_locks.pid AS pid,
          blocked_locks.locktype AS locktype,
          blocked_locks.mode AS lock_mode,
          blocked_activity.datname AS database_name,
          blocked_activity.usename AS username,
          blocked_activity.application_name AS application_name,
          blocked_activity.client_addr AS client_address,
          blocked_activity.query_start AS query_start,
          AGE(NOW(), blocked_activity.query_start) AS duration,
          blocked_activity.wait_event_type AS wait_event_type,
          blocked_activity.wait_event AS wait_event,
          blocked_activity.state AS state,
          blocked_activity.query AS query
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
        WHERE NOT blocked_locks.granted
        AND blocked_activity.datname = current_database();
      `);
      
      return result.rows.map(row => ({
        pid: row.pid,
        locktype: row.locktype,
        lockMode: row.lock_mode,
        tableName: row.relation_name || 'Unknown',
        applicationName: row.application_name,
        queryStart: row.query_start,
        durationSec: parseFloat(row.duration),
        waitEvent: row.wait_event,
        state: row.state,
        query: this.sanitizeQueryForLogging(row.query)
      }));
    } catch (error) {
      logger.error('Error getting database locks', { error });
      return [];
    }
  }
  
  /**
   * Get database statistics
   * 
   * @returns Database statistics
   */
  private async getDatabaseStats(): Promise<{
    databaseSize: string;
    cacheHitRatio: number;
    deadlocks: number;
    activeTransactions: number;
  }> {
    try {
      // Get database size
      const sizeResult = await this.pool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;
      `);
      
      // Get cache hit ratio
      const cacheResult = await this.pool.query(`
        SELECT 
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          case when sum(heap_blks_hit) + sum(heap_blks_read) > 0
            then sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))
            else 0
          end as cache_hit_ratio
        FROM pg_statio_user_tables;
      `);
      
      // Get deadlock count
      const deadlockResult = await this.pool.query(`
        SELECT count(*) AS deadlock_count
        FROM pg_stat_database
        WHERE datname = current_database()
        AND deadlocks > 0;
      `);
      
      // Get active transaction count
      const activeTransResult = await this.pool.query(`
        SELECT count(*) AS active_transactions
        FROM pg_stat_activity
        WHERE state = 'active'
        AND xact_start IS NOT NULL;
      `);
      
      return {
        databaseSize: sizeResult.rows[0]?.db_size || 'Unknown',
        cacheHitRatio: parseFloat(cacheResult.rows[0]?.cache_hit_ratio || '0'),
        deadlocks: parseInt(deadlockResult.rows[0]?.deadlock_count || '0', 10),
        activeTransactions: parseInt(activeTransResult.rows[0]?.active_transactions || '0', 10)
      };
    } catch (error) {
      logger.error('Error getting database statistics', { error });
      return {
        databaseSize: 'Unknown',
        cacheHitRatio: 0,
        deadlocks: 0,
        activeTransactions: 0
      };
    }
  }
  
  /**
   * Sanitize a SQL query for logging
   * 
   * @param query SQL query to sanitize
   * @returns Sanitized query
   */
  private sanitizeQueryForLogging(query: string): string {
    if (!query) return '';
    
    // Limit query length for logging
    const maxLength = 500;
    let sanitized = query.trim();
    
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + '...';
    }
    
    return sanitized;
  }
  
  /**
   * Reset monitoring statistics
   */
  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getMetrics();
        
        // Add metrics point to history
        this.metricsHistory.push({
          timestamp: new Date(),
          activeConnections: metrics.activeConnections,
          idleConnections: metrics.idleConnections,
          waitingClients: metrics.waitingClients,
          avgQueryExecutionTime: metrics.avgQueryExecutionTime,
          slowQueriesCount: this.slowQueries.length
        });
        
        // Cleanup old metrics
        this.cleanupOldMetrics();
        
        // Update index usage statistics
        await this.updateIndexUsageStats();
      } catch (error) {
        logger.error('Error collecting database metrics', { error });
      }
    }, METRICS_COLLECTION_INTERVAL_MS);
  }
  
  /**
   * Clean up old metrics data
   */
  private cleanupOldMetrics(): void {
    const now = new Date().getTime();
    const cutoff = now - METRICS_RETENTION_PERIOD_MS;
    
    // Remove old metrics points
    this.metricsHistory = this.metricsHistory.filter(point => 
      point.timestamp.getTime() > cutoff
    );
  }
  
  /**
   * Update index usage statistics
   */
  private async updateIndexUsageStats(): Promise<void> {
    try {
      const result = await this.pool.query(`
        SELECT
          schemaname || '.' || relname as table_name,
          indexrelname as index_name,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_all_indexes
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY idx_scan DESC
      `);
      
      for (const row of result.rows) {
        const indexKey = `${row.table_name}.${row.index_name}`;
        this.indexUsageStats.set(indexKey, {
          used: parseInt(row.index_scans, 10) || 0,
          unused: row.index_scans === '0' ? 1 : 0
        });
      }
    } catch (error) {
      logger.error('Error updating index usage statistics', { error });
    }
  }
  
  /**
   * Get index usage statistics
   * 
   * @returns Index usage statistics
   */
  async getIndexUsageStats() {
    return Array.from(this.indexUsageStats.entries()).map(([key, stats]) => ({
      indexName: key,
      scans: stats.used,
      unused: stats.unused > 0
    }));
  }
  
  /**
   * Identify unused indexes which are candidates for removal
   * 
   * @returns Unused indexes
   */
  async getUnusedIndexes() {
    return Array.from(this.indexUsageStats.entries())
      .filter(([_, stats]) => stats.used === 0)
      .map(([key]) => key);
  }
  
  /**
   * Get historical metrics for time-series analysis
   * 
   * @param duration Duration in milliseconds to retrieve (defaults to 1 hour)
   * @returns Array of metrics points
   */
  getMetricsHistory(duration: number = 60 * 60 * 1000): MetricsPoint[] {
    const cutoffTime = new Date().getTime() - duration;
    return this.metricsHistory.filter(point => 
      point.timestamp.getTime() >= cutoffTime
    );
  }
  
  /**
   * Reset all monitoring statistics
   */
  resetStats(): void {
    this.slowQueries = [];
    this.queryTimes = [];
    this.metricsHistory = [];
    this.queryCountByTable = new Map();
    this.indexUsageStats = new Map();
  }
  
  /**
   * Stop metrics collection and cleanup resources
   */
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

// Create singleton monitor instance
let monitorInstance: DatabaseMonitor | null = null;

/**
 * Get the database monitor instance
 * 
 * @param pool Database connection pool
 * @returns Database monitor
 */
export function getDatabaseMonitor(pool: Pool): DatabaseMonitor {
  if (!monitorInstance) {
    monitorInstance = new DatabaseMonitor(pool);
  }
  return monitorInstance;
}
