/**
 * Job History Service
 * 
 * Provides job history recording and analytics capabilities.
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  JobHistoryEntry,
  JobHistoryQuery,
  JobHistoryPage,
  AnalyticsOptions,
  JobAnalytics,
  TimeSeriesDataPoint,
  AggregationType
} from './types';
import { JobHistoryRepository } from './repository';
import { logger } from '../../lib/logger';
import { getAllQueues } from '../queues';
import Bull from 'bull';

/**
 * Job History Service
 * 
 * Manages job history and provides analytics
 */
export class JobHistoryService {
  private repository: JobHistoryRepository;
  
  /**
   * Create a new job history service
   */
  constructor() {
    this.repository = new JobHistoryRepository();
    
    // Register event handlers
    this.registerEventHandlers();
  }
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.repository.initialize();
    logger.info('Job history service initialized');
  }
  
  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    logger.info('Job history service shut down');
  }
  
  /**
   * Record job completion
   * 
   * @param queue Queue name
   * @param jobId Job ID
   * @param name Job name
   * @param data Job data
   * @param result Job result
   * @param options Job options
   * @param processingTime Processing time in milliseconds
   * @returns Job history entry
   */
  async recordJobCompletion(
    queue: string,
    jobId: string,
    name: string,
    data: any,
    result: any,
    options: any,
    processingTime: number
  ): Promise<JobHistoryEntry> {
    try {
      const now = new Date();
      const startedAt = new Date(now.getTime() - processingTime);
      
      const entry: JobHistoryEntry = {
        id: uuidv4(),
        queue,
        jobId,
        name,
        data,
        result,
        options,
        startedAt,
        finishedAt: now,
        processingTime,
        attempts: options?.attempts || 1,
        status: 'completed',
        createdAt: now
      };
      
      await this.repository.saveEntry(entry);
      
      logger.debug('Recorded job completion', { 
        jobId, 
        queue, 
        name, 
        processingTime 
      });
      
      return entry;
    } catch (error) {
      logger.error('Error recording job completion', { 
        error, 
        jobId, 
        queue, 
        name 
      });
      
      // Create a basic entry even if storage fails
      return {
        id: uuidv4(),
        queue,
        jobId,
        name,
        data,
        result,
        options,
        startedAt: new Date(),
        finishedAt: new Date(),
        processingTime,
        attempts: options?.attempts || 1,
        status: 'completed',
        createdAt: new Date()
      };
    }
  }
  
  /**
   * Record job failure
   * 
   * @param queue Queue name
   * @param jobId Job ID
   * @param name Job name
   * @param data Job data
   * @param error Error that caused the failure
   * @param options Job options
   * @param processingTime Processing time in milliseconds
   * @returns Job history entry
   */
  async recordJobFailure(
    queue: string,
    jobId: string,
    name: string,
    data: any,
    error: Error,
    options: any,
    processingTime: number
  ): Promise<JobHistoryEntry> {
    try {
      const now = new Date();
      const startedAt = new Date(now.getTime() - processingTime);
      
      const entry: JobHistoryEntry = {
        id: uuidv4(),
        queue,
        jobId,
        name,
        data,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        options,
        startedAt,
        finishedAt: now,
        processingTime,
        attempts: options?.attempts || 1,
        status: 'failed',
        createdAt: now
      };
      
      await this.repository.saveEntry(entry);
      
      logger.debug('Recorded job failure', { 
        jobId, 
        queue, 
        name, 
        error: error.message 
      });
      
      return entry;
    } catch (saveError) {
      logger.error('Error recording job failure', { 
        error: saveError, 
        jobId, 
        queue, 
        name,
        originalError: error.message
      });
      
      // Create a basic entry even if storage fails
      return {
        id: uuidv4(),
        queue,
        jobId,
        name,
        data,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        options,
        startedAt: new Date(),
        finishedAt: new Date(),
        processingTime,
        attempts: options?.attempts || 1,
        status: 'failed',
        createdAt: new Date()
      };
    }
  }
  
  /**
   * Get job history
   * 
   * @param query Search query
   * @returns Paginated job history
   */
  async getJobHistory(query: JobHistoryQuery): Promise<JobHistoryPage> {
    return this.repository.findByQuery(query);
  }
  
  /**
   * Generate job analytics
   * 
   * @param options Analytics options
   * @returns Job analytics
   */
  async generateJobAnalytics(options: AnalyticsOptions): Promise<JobAnalytics> {
    try {
      // Get job history for the time range
      const history = await this.repository.findByTimeRange(
        options.timeRange.startTime,
        options.timeRange.endTime,
        {
          queues: options.queues,
          names: options.names
        }
      );
      
      // Group by time buckets
      const timeBuckets = this.groupByTimeBuckets(
        history, 
        options.aggregationType
      );
      
      // Calculate metrics for each bucket
      const timeSeries: TimeSeriesDataPoint[] = timeBuckets.map(bucket => {
        const completed = bucket.entries.filter(
          entry => entry.status === 'completed'
        ).length;
        
        const failed = bucket.entries.filter(
          entry => entry.status === 'failed'
        ).length;
        
        const total = completed + failed;
        
        const averageProcessingTime = bucket.entries
          .filter(entry => entry.processingTime !== undefined)
          .reduce((sum, entry) => sum + (entry.processingTime || 0), 0) / 
          (bucket.entries.length || 1);
        
        const throughput = bucket.entries.length / bucket.durationHours;
        
        const errorRate = total > 0 ? (failed / total) * 100 : 0;
        
        return {
          timestamp: bucket.timestamp,
          completed,
          failed,
          averageProcessingTime,
          throughput,
          errorRate
        };
      });
      
      // Calculate summary metrics
      const totalCompleted = history.filter(
        entry => entry.status === 'completed'
      ).length;
      
      const totalFailed = history.filter(
        entry => entry.status === 'failed'
      ).length;
      
      const total = totalCompleted + totalFailed;
      
      const overallAverageProcessingTime = history
        .filter(entry => entry.processingTime !== undefined)
        .reduce((sum, entry) => sum + (entry.processingTime || 0), 0) / 
        (history.length || 1);
      
      // Calculate overall throughput (jobs per hour)
      const durationHours = (
        options.timeRange.endTime.getTime() - 
        options.timeRange.startTime.getTime()
      ) / (1000 * 60 * 60) || 1; // Avoid division by zero
      
      const overallThroughput = history.length / durationHours;
      
      const overallErrorRate = total > 0 ? (totalFailed / total) * 100 : 0;
      
      // Find peak throughput period
      const peakThroughputPeriod = timeSeries.reduce(
        (max, current) => current.throughput > max.throughput ? current : max,
        { throughput: 0, timestamp: new Date() }
      );
      
      // Find slowest processing period
      const slowestProcessingPeriod = timeSeries.reduce(
        (max, current) => current.averageProcessingTime > max.averageProcessingTime ? current : max,
        { averageProcessingTime: 0, timestamp: new Date() }
      );
      
      return {
        timeRange: options.timeRange,
        timeSeries,
        summary: {
          totalCompleted,
          totalFailed,
          overallAverageProcessingTime,
          overallThroughput,
          overallErrorRate,
          peakThroughput: {
            period: peakThroughputPeriod.timestamp,
            value: peakThroughputPeriod.throughput
          },
          slowestProcessing: {
            period: slowestProcessingPeriod.timestamp,
            value: slowestProcessingPeriod.averageProcessingTime
          }
        },
        aggregationType: options.aggregationType
      };
    } catch (error) {
      logger.error('Error generating job analytics', { error, options });
      
      // Return empty analytics on error
      return {
        timeRange: options.timeRange,
        timeSeries: [],
        summary: {
          totalCompleted: 0,
          totalFailed: 0,
          overallAverageProcessingTime: 0,
          overallThroughput: 0,
          overallErrorRate: 0,
          peakThroughput: {
            period: new Date(),
            value: 0
          },
          slowestProcessing: {
            period: new Date(),
            value: 0
          }
        },
        aggregationType: options.aggregationType
      };
    }
  }
  
  /**
   * Purge old records
   * 
   * @param maxAge Maximum age in milliseconds
   * @returns Number of records purged
   */
  async purgeOldRecords(maxAge: number): Promise<number> {
    return this.repository.deleteOlderThan(maxAge);
  }
  
  /**
   * Group job history entries by time buckets
   * 
   * @param entries Job history entries
   * @param aggregationType Time aggregation type
   * @returns Grouped entries
   */
  private groupByTimeBuckets(
    entries: JobHistoryEntry[],
    aggregationType: AggregationType
  ): { 
    timestamp: Date; 
    entries: JobHistoryEntry[]; 
    durationHours: number;
  }[] {
    // Get the bucket size in milliseconds
    const bucketSize = this.getBucketSizeMs(aggregationType);
    
    // Group entries by bucket
    const buckets: Record<number, JobHistoryEntry[]> = {};
    
    for (const entry of entries) {
      const bucketTimestamp = this.getBucketTimestamp(
        entry.startedAt, 
        aggregationType
      );
      
      const bucketKey = bucketTimestamp.getTime();
      
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = [];
      }
      
      buckets[bucketKey].push(entry);
    }
    
    // Convert to array of buckets
    return Object.entries(buckets).map(([timestampStr, bucketEntries]) => {
      const timestamp = new Date(parseInt(timestampStr, 10));
      
      // Calculate duration in hours based on aggregation type
      let durationHours: number;
      
      switch (aggregationType) {
        case AggregationType.MINUTE:
          durationHours = 1 / 60;
          break;
        case AggregationType.HOUR:
          durationHours = 1;
          break;
        case AggregationType.DAY:
          durationHours = 24;
          break;
        case AggregationType.WEEK:
          durationHours = 24 * 7;
          break;
        case AggregationType.MONTH:
          // Approximate - not perfect for varying month lengths
          durationHours = 24 * 30;
          break;
        default:
          durationHours = 1;
      }
      
      return {
        timestamp,
        entries: bucketEntries,
        durationHours
      };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  /**
   * Get bucket size in milliseconds
   * 
   * @param aggregationType Time aggregation type
   * @returns Bucket size in milliseconds
   */
  private getBucketSizeMs(aggregationType: AggregationType): number {
    switch (aggregationType) {
      case AggregationType.MINUTE:
        return 60 * 1000;
      case AggregationType.HOUR:
        return 60 * 60 * 1000;
      case AggregationType.DAY:
        return 24 * 60 * 60 * 1000;
      case AggregationType.WEEK:
        return 7 * 24 * 60 * 60 * 1000;
      case AggregationType.MONTH:
        return 30 * 24 * 60 * 60 * 1000; // Approximate
      default:
        return 60 * 60 * 1000; // Default to hour
    }
  }
  
  /**
   * Get bucket timestamp
   * 
   * @param date Date to get bucket for
   * @param aggregationType Time aggregation type
   * @returns Bucket timestamp
   */
  private getBucketTimestamp(
    date: Date, 
    aggregationType: AggregationType
  ): Date {
    const result = new Date(date);
    
    switch (aggregationType) {
      case AggregationType.MINUTE:
        result.setSeconds(0, 0);
        break;
      case AggregationType.HOUR:
        result.setMinutes(0, 0, 0);
        break;
      case AggregationType.DAY:
        result.setHours(0, 0, 0, 0);
        break;
      case AggregationType.WEEK:
        // Set to start of day
        result.setHours(0, 0, 0, 0);
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = result.getDay();
        // Subtract days to get to start of week (Sunday)
        result.setDate(result.getDate() - dayOfWeek);
        break;
      case AggregationType.MONTH:
        result.setDate(1);
        result.setHours(0, 0, 0, 0);
        break;
    }
    
    return result;
  }
  
  /**
   * Register event handlers for job events
   */
  private registerEventHandlers(): void {
    // Get all queues
    const queues = getAllQueues();
    
    // Register handlers for each queue
    for (const [queueName, queue] of Object.entries(queues)) {
      this.registerQueueEventHandlers(queueName, queue);
    }
  }
  
  /**
   * Register event handlers for a specific queue
   * 
   * @param queueName Queue name
   * @param queue Bull queue
   */
  private registerQueueEventHandlers(queueName: string, queue: Bull.Queue): void {
    // Job completed
    queue.on('completed', async (job, result) => {
      const processingTime = job.finishedOn && job.processedOn 
        ? job.finishedOn - job.processedOn 
        : 0;
      
      await this.recordJobCompletion(
        queueName,
        job.id.toString(),
        job.name,
        job.data,
        result,
        job.opts,
        processingTime
      );
    });
    
    // Job failed
    queue.on('failed', async (job, error) => {
      const processingTime = job.finishedOn && job.processedOn 
        ? job.finishedOn - job.processedOn 
        : 0;
      
      await this.recordJobFailure(
        queueName,
        job.id.toString(),
        job.name,
        job.data,
        error,
        job.opts,
        processingTime
      );
    });
  }
}
