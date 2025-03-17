/**
 * Job History Service
 * 
 * Service for tracking and analyzing job execution history
 */
import { Job } from 'bull';
import { getDbClient } from '../../lib/db-client';
import { logger } from '../../lib/logger';
import { 
  JobHistoryRepository, 
  JobHistoryEntry, 
  JobHistoryQuery, 
  JobHistoryPage,
  AnalyticsOptions,
  JobAnalytics
} from './repository';

/**
 * Service for job history and analytics
 */
export class JobHistoryService {
  private repository: JobHistoryRepository;
  
  constructor() {
    const db = getDbClient();
    this.repository = new JobHistoryRepository(db);
  }
  
  /**
   * Record job completion
   * 
   * @param job The completed job
   * @param result The job result
   * @returns The created history entry
   */
  async recordJobCompletion(job: Job, result: any): Promise<JobHistoryEntry> {
    try {
      return await this.repository.recordJobCompletion(job, result);
    } catch (error) {
      logger.error('Error recording job completion', {
        jobId: job.id,
        queue: job.queue.name,
        error
      });
      
      // Return a minimal entry
      return {
        id: 'error',
        queue: job.queue.name,
        jobId: job.id,
        name: job.name,
        data: {},
        options: {},
        startedAt: new Date(),
        finishedAt: new Date(),
        attempts: job.attemptsMade,
        status: 'completed'
      };
    }
  }
  
  /**
   * Record job failure
   * 
   * @param job The failed job
   * @param error The error that caused failure
   * @returns The created history entry
   */
  async recordJobFailure(job: Job, error: Error): Promise<JobHistoryEntry> {
    try {
      return await this.repository.recordJobFailure(job, error);
    } catch (dbError) {
      logger.error('Error recording job failure', {
        jobId: job.id,
        queue: job.queue.name,
        error: error.message,
        dbError
      });
      
      // Return a minimal entry
      return {
        id: 'error',
        queue: job.queue.name,
        jobId: job.id,
        name: job.name,
        data: {},
        options: {},
        error: {
          message: error.message,
          stack: error.stack
        },
        startedAt: new Date(),
        finishedAt: new Date(),
        attempts: job.attemptsMade,
        status: 'failed'
      };
    }
  }
  
  /**
   * Get job history with filtering and pagination
   * 
   * @param query Query parameters
   * @returns Paginated job history
   */
  async getJobHistory(query: JobHistoryQuery): Promise<JobHistoryPage> {
    try {
      return await this.repository.getJobHistory(query);
    } catch (error) {
      logger.error('Error getting job history', { query, error });
      
      // Return empty page
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
      return await this.repository.getRecentJobHistory(queue, limit);
    } catch (error) {
      logger.error('Error getting recent job history', { queue, limit, error });
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
      return await this.repository.generateJobAnalytics(options);
    } catch (error) {
      logger.error('Error generating job analytics', { options, error });
      
      // Return empty analytics
      return {
        timeRange: { startTime: options.startTime, endTime: options.endTime },
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
   * Purge old job history records
   * 
   * @param maxAge Maximum age in milliseconds (default: 30 days)
   * @returns Number of records deleted
   */
  async purgeOldRecords(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      return await this.repository.purgeOldRecords(maxAge);
    } catch (error) {
      logger.error('Error purging old job history records', { maxAge, error });
      return 0;
    }
  }
}

// Export singleton instance
export const jobHistoryService = new JobHistoryService();
