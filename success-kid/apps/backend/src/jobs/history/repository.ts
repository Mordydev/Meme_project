/**
 * Job History Repository
 * 
 * Manages job history storage and retrieval
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';

/**
 * Job history entry interface
 */
export interface JobHistoryEntry {
  id: string;
  queue: string;
  jobId: string;
  name: string;
  data: any;
  options: any;
  result?: any;
  error?: {
    message: string;
    stack?: string;
  };
  startedAt: Date;
  finishedAt?: Date;
  processingTime?: number;
  attempts: number;
  status: 'completed' | 'failed' | 'cancelled';
}

/**
 * Job history query interface
 */
export interface JobHistoryQuery {
  queue?: string;
  jobName?: string;
  status?: 'completed' | 'failed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Job history page interface
 */
export interface JobHistoryPage {
  entries: JobHistoryEntry[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Job analytics options interface
 */
export interface AnalyticsOptions {
  startTime: Date;
  endTime: Date;
  queues?: string[];
  granularity: 'hour' | 'day' | 'week';
}

/**
 * Job analytics interface
 */
export interface JobAnalytics {
  timeRange: {
    startTime: Date;
    endTime: Date;
  };
  metrics: Array<{
    timestamp: Date;
    completed: number;
    failed: number;
    averageProcessingTime: number;
    throughput: number;
  }>;
  summary: {
    totalJobs: number;
    successRate: number;
    averageProcessingTime: number;
    peakThroughput: number;
  };
}

/**
 * Repository for job history
 */
export class JobHistoryRepository {
  private readonly historyKey = 'job:history';
  
  constructor(private db: Pool) {}
  
  /**
   * Record job completion
   * 
   * @param job Job details
   * @param result Job result
   * @returns The created history entry
   */
  async recordJobCompletion(job: any, result: any): Promise<JobHistoryEntry> {
    try {
      const finishedAt = new Date();
      const processingTime = job.processedOn 
        ? finishedAt.getTime() - job.processedOn 
        : undefined;
      
      const entry: JobHistoryEntry = {
        id: uuidv4(),
        queue: job.queue.name,
        jobId: job.id,
        name: job.name,
        data: this.sanitizeJobData(job.data),
        options: this.sanitizeJobOptions(job.opts),
        result: this.sanitizeJobResult(result),
        startedAt: job.processedOn ? new Date(job.processedOn) : new Date(),
        finishedAt,
        processingTime,
        attempts: job.attemptsMade,
        status: 'completed'
      };
      
      // Store in database
      await this.db.query(
        `INSERT INTO job_history (
          id, queue, job_id, name, data, options, result, 
          started_at, finished_at, processing_time, attempts, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          entry.id,
          entry.queue,
          entry.jobId,
          entry.name,
          JSON.stringify(entry.data),
          JSON.stringify(entry.options),
          JSON.stringify(entry.result),
          entry.startedAt,
          entry.finishedAt,
          entry.processingTime,
          entry.attempts,
          entry.status
        ]
      );
      
      // Cache recent history in Redis (last 100 entries)
      await this.cacheHistoryEntry(entry);
      
      logger.debug('Recorded job completion', {
        jobId: job.id,
        queue: job.queue.name,
        processingTime
      });
      
      return entry;
    } catch (error) {
      logger.error('Error recording job completion', {
        jobId: job?.id,
        queue: job?.queue?.name,
        error
      });
      
      // Return minimal entry even if storage fails
      return {
        id: uuidv4(),
        queue: job?.queue?.name || 'unknown',
        jobId: job?.id || 'unknown',
        name: job?.name || 'unknown',
        data: {},
        options: {},
        startedAt: new Date(),
        finishedAt: new Date(),
        attempts: job?.attemptsMade || 0,
        status: 'completed'
      };
    }
  }
  
  /**
   * Record job failure
   * 
   * @param job Job details
   * @param error Error that caused the failure
   * @returns The created history entry
   */
  async recordJobFailure(job: any, error: Error): Promise<JobHistoryEntry> {
    try {
      const finishedAt = new Date();
      const processingTime = job.processedOn 
        ? finishedAt.getTime() - job.processedOn 
        : undefined;
      
      const entry: JobHistoryEntry = {
        id: uuidv4(),
        queue: job.queue.name,
        jobId: job.id,
        name: job.name,
        data: this.sanitizeJobData(job.data),
        options: this.sanitizeJobOptions(job.opts),
        error: {
          message: error.message,
          stack: error.stack
        },
        startedAt: job.processedOn ? new Date(job.processedOn) : new Date(),
        finishedAt,
        processingTime,
        attempts: job.attemptsMade,
        status: 'failed'
      };
      
      // Store in database
      await this.db.query(
        `INSERT INTO job_history (
          id, queue, job_id, name, data, options, error, 
          started_at, finished_at, processing_time, attempts, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          entry.id,
          entry.queue,
          entry.jobId,
          entry.name,
          JSON.stringify(entry.data),
          JSON.stringify(entry.options),
          JSON.stringify(entry.error),
          entry.startedAt,
          entry.finishedAt,
          entry.processingTime,
          entry.attempts,
          entry.status
        ]
      );
      
      // Cache recent history in Redis (last 100 entries)
      await this.cacheHistoryEntry(entry);
      
      logger.debug('Recorded job failure', {
        jobId: job.id,
        queue: job.queue.name,
        error: error.message,
        attempts: job.attemptsMade
      });
      
      return entry;
    } catch (dbError) {
      logger.error('Error recording job failure', {
        jobId: job?.id,
        queue: job?.queue?.name,
        error: error.message,
        dbError
      });
      
      // Return minimal entry even if storage fails
      return {
        id: uuidv4(),
        queue: job?.queue?.name || 'unknown',
        jobId: job?.id || 'unknown',
        name: job?.name || 'unknown',
        data: {},
        options: {},
        error: {
          message: error.message,
          stack: error.stack
        },
        startedAt: new Date(),
        finishedAt: new Date(),
        attempts: job?.attemptsMade || 0,
        status: 'failed'
      };
    }
  }
  
  /**
   * Get job history with pagination and filtering
   * 
   * @param query Query parameters
   * @returns Paginated job history entries
   */
  async getJobHistory(query: JobHistoryQuery): Promise<JobHistoryPage> {
    try {
      const {
        queue,
        jobName,
        status,
        startDate,
        endDate,
        page = 1,
        pageSize = 20,
        sortBy = 'startedAt',
        sortDirection = 'desc'
      } = query;
      
      // Build query conditions
      const conditions: string[] = [];
      const params: any[] = [];
      
      let paramIndex = 1;
      
      if (queue) {
        conditions.push(`queue = $${paramIndex++}`);
        params.push(queue);
      }
      
      if (jobName) {
        conditions.push(`name = $${paramIndex++}`);
        params.push(jobName);
      }
      
      if (status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(status);
      }
      
      if (startDate) {
        conditions.push(`started_at >= $${paramIndex++}`);
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push(`started_at <= $${paramIndex++}`);
        params.push(endDate);
      }
      
      // Build where clause
      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';
      
      // Map sort column
      const sortColumn = this.mapSortColumn(sortBy);
      
      // Calculate pagination
      const offset = (page - 1) * pageSize;
      params.push(pageSize);
      params.push(offset);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM job_history 
        ${whereClause}
      `;
      
      const countResult = await this.db.query(countQuery, params.slice(0, -2));
      const totalItems = parseInt(countResult.rows[0].total, 10);
      const totalPages = Math.ceil(totalItems / pageSize);
      
      // Get history entries
      const query = `
        SELECT * 
        FROM job_history 
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection === 'asc' ? 'ASC' : 'DESC'}
        LIMIT $${paramIndex++}
        OFFSET $${paramIndex++}
      `;
      
      const result = await this.db.query(query, params);
      
      // Map rows to entries
      const entries = result.rows.map(row => this.mapRowToHistoryEntry(row));
      
      return {
        entries,
        page,
        pageSize,
        totalItems,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting job history', { query, error });
      
      // Return empty page on error
      return {
        entries: [],
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        totalItems: 0,
        totalPages: 0
      };
    }
  }
  
  /**
   * Find history entries by time range
   * 
   * @param startTime Start time
   * @param endTime End time
   * @param options Additional options
   * @returns Array of history entries
   */
  async findByTimeRange(
    startTime: Date,
    endTime: Date,
    options: { queues?: string[] } = {}
  ): Promise<JobHistoryEntry[]> {
    try {
      // Build query conditions
      const conditions = ['started_at BETWEEN $1 AND $2'];
      const params = [startTime, endTime];
      
      let paramIndex = 3;
      
      if (options.queues && options.queues.length > 0) {
        conditions.push(`queue = ANY($${paramIndex++})`);
        params.push(options.queues);
      }
      
      // Build query
      const query = `
        SELECT * 
        FROM job_history 
        WHERE ${conditions.join(' AND ')}
        ORDER BY started_at ASC
      `;
      
      const result = await this.db.query(query, params);
      
      // Map rows to entries
      return result.rows.map(row => this.mapRowToHistoryEntry(row));
    } catch (error) {
      logger.error('Error finding history by time range', { 
        startTime, 
        endTime, 
        options, 
        error 
      });
      return [];
    }
  }
  
  /**
   * Generate job analytics
   * 
   * @param options Analytics options
   * @returns Job analytics
   */
  async generateJobAnalytics(options: AnalyticsOptions): Promise<JobAnalytics> {
    try {
      const { startTime, endTime, queues, granularity } = options;
      
      // Build query conditions
      const conditions = ['started_at BETWEEN $1 AND $2'];
      const params = [startTime, endTime];
      
      let paramIndex = 3;
      
      if (queues && queues.length > 0) {
        conditions.push(`queue = ANY($${paramIndex++})`);
        params.push(queues);
      }
      
      // Determine time interval for grouping based on granularity
      let interval;
      switch (granularity) {
        case 'hour':
          interval = '1 hour';
          break;
        case 'week':
          interval = '1 week';
          break;
        case 'day':
        default:
          interval = '1 day';
          break;
      }
      
      // Build analytics query
      const query = `
        WITH time_buckets AS (
          SELECT 
            date_trunc('${granularity}', started_at) AS bucket,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed,
            COUNT(*) FILTER (WHERE status = 'failed') AS failed,
            AVG(processing_time) FILTER (WHERE processing_time IS NOT NULL) AS avg_processing_time
          FROM job_history 
          WHERE ${conditions.join(' AND ')}
          GROUP BY bucket
          ORDER BY bucket
        )
        SELECT 
          bucket,
          completed,
          failed,
          avg_processing_time,
          (completed + failed) / 
            EXTRACT(EPOCH FROM '${interval}'::interval) * 3600 AS throughput
        FROM time_buckets
      `;
      
      const result = await this.db.query(query, params);
      
      // Calculate metrics and summary
      const metrics = result.rows.map(row => ({
        timestamp: row.bucket,
        completed: parseInt(row.completed, 10),
        failed: parseInt(row.failed, 10),
        averageProcessingTime: row.avg_processing_time || 0,
        throughput: parseFloat(row.throughput) || 0
      }));
      
      // Calculate summary
      const totalJobs = metrics.reduce(
        (sum, m) => sum + m.completed + m.failed, 
        0
      );
      
      const totalCompleted = metrics.reduce(
        (sum, m) => sum + m.completed, 
        0
      );
      
      const totalProcessingTime = metrics.reduce(
        (sum, m) => sum + (m.averageProcessingTime * m.completed), 
        0
      );
      
      const successRate = totalJobs > 0 ? totalCompleted / totalJobs : 0;
      
      const averageProcessingTime = totalCompleted > 0 
        ? totalProcessingTime / totalCompleted 
        : 0;
      
      const peakThroughput = Math.max(...metrics.map(m => m.throughput), 0);
      
      return {
        timeRange: { startTime, endTime },
        metrics,
        summary: {
          totalJobs,
          successRate,
          averageProcessingTime,
          peakThroughput
        }
      };
    } catch (error) {
      logger.error('Error generating job analytics', { options, error });
      
      // Return empty analytics on error
      return {
        timeRange: { startTime, endTime },
        metrics: [],
        summary: {
          totalJobs: 0,
          successRate: 0,
          averageProcessingTime: 0,
          peakThroughput: 0
        }
      };
    }
  }
  
  /**
   * Purge old history records
   * 
   * @param maxAge Maximum age in milliseconds
   * @returns Number of records deleted
   */
  async purgeOldRecords(maxAge: number): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      
      const result = await this.db.query(
        `DELETE FROM job_history WHERE finished_at < $1 RETURNING id`,
        [cutoffDate]
      );
      
      const deleted = result.rowCount;
      
      logger.info('Purged old job history records', {
        deleted,
        cutoffDate
      });
      
      return deleted;
    } catch (error) {
      logger.error('Error purging old job history records', { error });
      return 0;
    }
  }
  
  /**
   * Cache history entry in Redis
   * 
   * @param entry History entry to cache
   */
  private async cacheHistoryEntry(entry: JobHistoryEntry): Promise<void> {
    try {
      // Push to queue-specific list
      const queueKey = `${this.historyKey}:${entry.queue}`;
      await redis.lpush(queueKey, JSON.stringify(entry));
      await redis.ltrim(queueKey, 0, 99); // Keep last 100 entries
      
      // Push to global list
      await redis.lpush(this.historyKey, JSON.stringify(entry));
      await redis.ltrim(this.historyKey, 0, 99); // Keep last 100 entries
    } catch (error) {
      logger.error('Error caching history entry', { 
        jobId: entry.jobId,
        queue: entry.queue,
        error
      });
    }
  }
  
  /**
   * Get recent job history from cache
   * 
   * @param queue Optional queue name to filter by
   * @param limit Maximum number of entries to return
   * @returns Recent job history entries
   */
  async getRecentJobHistory(
    queue?: string,
    limit: number = 20
  ): Promise<JobHistoryEntry[]> {
    try {
      const key = queue ? `${this.historyKey}:${queue}` : this.historyKey;
      
      const entriesJson = await redis.lrange(key, 0, limit - 1);
      
      return entriesJson.map(json => JSON.parse(json));
    } catch (error) {
      logger.error('Error getting recent job history', { queue, error });
      return [];
    }
  }
  
  /**
   * Sanitize job data for storage
   * 
   * @param data Job data
   * @returns Sanitized data
   */
  private sanitizeJobData(data: any): any {
    try {
      // Return original data if not an object
      if (!data || typeof data !== 'object') {
        return data;
      }
      
      // Make a copy to avoid modifying the original
      const sanitized = { ...data };
      
      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.secret;
      delete sanitized.credential;
      
      // Truncate large fields
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
          sanitized[key] = `${sanitized[key].substring(0, 1000)}... (truncated)`;
        }
      }
      
      return sanitized;
    } catch (error) {
      logger.error('Error sanitizing job data', { error });
      return { sanitized: true };
    }
  }
  
  /**
   * Sanitize job options for storage
   * 
   * @param options Job options
   * @returns Sanitized options
   */
  private sanitizeJobOptions(options: any): any {
    try {
      // Return empty object if no options
      if (!options) {
        return {};
      }
      
      // Extract relevant options
      return {
        delay: options.delay,
        attempts: options.attempts,
        priority: options.priority,
        timeout: options.timeout,
        removeOnComplete: options.removeOnComplete,
        removeOnFail: options.removeOnFail
      };
    } catch (error) {
      logger.error('Error sanitizing job options', { error });
      return {};
    }
  }
  
  /**
   * Sanitize job result for storage
   * 
   * @param result Job result
   * @returns Sanitized result
   */
  private sanitizeJobResult(result: any): any {
    try {
      // Return null for undefined or null result
      if (result === undefined || result === null) {
        return null;
      }
      
      // Handle different result types
      if (typeof result === 'object') {
        // Make a copy to avoid modifying the original
        const sanitized = { ...result };
        
        // Remove sensitive fields
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        delete sanitized.credential;
        
        // Truncate large fields
        for (const key in sanitized) {
          if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
            sanitized[key] = `${sanitized[key].substring(0, 1000)}... (truncated)`;
          }
        }
        
        return sanitized;
      }
      
      // For simple types, return as is
      return result;
    } catch (error) {
      logger.error('Error sanitizing job result', { error });
      return null;
    }
  }
  
  /**
   * Map database row to job history entry
   * 
   * @param row Database row
   * @returns Job history entry
   */
  private mapRowToHistoryEntry(row: any): JobHistoryEntry {
    return {
      id: row.id,
      queue: row.queue,
      jobId: row.job_id,
      name: row.name,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      result: row.result ? (typeof row.result === 'string' ? JSON.parse(row.result) : row.result) : undefined,
      error: row.error ? (typeof row.error === 'string' ? JSON.parse(row.error) : row.error) : undefined,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      processingTime: row.processing_time,
      attempts: row.attempts,
      status: row.status
    };
  }
  
  /**
   * Map sort column name to database column
   * 
   * @param sortColumn Sort column name
   * @returns Database column name
   */
  private mapSortColumn(sortColumn: string): string {
    const columnMap: Record<string, string> = {
      id: 'id',
      queue: 'queue',
      jobId: 'job_id',
      name: 'name',
      startedAt: 'started_at',
      finishedAt: 'finished_at',
      processingTime: 'processing_time',
      attempts: 'attempts',
      status: 'status'
    };
    
    return columnMap[sortColumn] || 'started_at';
  }
}
