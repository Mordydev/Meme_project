/**
 * Retry Service
 * 
 * Manages retry policies and handles job failures
 */
import { Job } from 'bull';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { QueueName, JobTypeMap } from '../queues';
import { jobService } from '../service';
import { 
  RetryStrategy, 
  RetryStrategyType,
  defaultRetryStrategies,
  isRetryableError
} from './strategies';

/**
 * Retry decision for handling failed jobs
 */
export interface RetryDecision {
  shouldRetry: boolean;
  delay?: number;
  reason?: string;
}

/**
 * Retry analytics for monitoring retry performance
 */
export interface RetryAnalytics {
  retryCount: number;
  successAfterRetry: number;
  permanentFailures: number;
  averageRetriesPerSuccess: number;
  retryRateByQueue: Record<string, {
    totalJobs: number;
    retriedJobs: number;
    retryRate: number;
  }>;
}

/**
 * Service for handling job retries
 */
export class RetryService {
  private strategies: Map<string, RetryStrategy> = new Map();
  private defaultStrategy: RetryStrategy;
  
  constructor() {
    // Initialize default strategy
    this.defaultStrategy = defaultRetryStrategies.exponential;
    
    // Set up some initial strategies
    this.strategies.set(`${QueueName.POINTS}:redemption`, defaultRetryStrategies.exponential);
    this.strategies.set(`${QueueName.POINTS}:award`, defaultRetryStrategies.fixed);
    this.strategies.set(`${QueueName.CONTENT}:moderation`, defaultRetryStrategies.gentle);
    this.strategies.set(`${QueueName.MEDIA}:optimization`, defaultRetryStrategies.aggressive);
  }
  
  /**
   * Configure a retry strategy for a specific job type
   * 
   * @param queue The queue name
   * @param jobName The job name
   * @param strategy The retry strategy
   */
  configureRetryStrategy<T extends QueueName>(
    queue: T,
    jobName: JobTypeMap[T],
    strategy: RetryStrategy
  ): void {
    const key = `${queue}:${jobName}`;
    this.strategies.set(key, strategy);
    
    logger.info('Configured retry strategy', {
      queue,
      jobName,
      strategyType: strategy.type,
      maxAttempts: strategy.maxAttempts,
      description: strategy.description
    });
  }
  
  /**
   * Get the retry strategy for a specific job type
   * 
   * @param queue The queue name
   * @param jobName The job name
   * @returns The retry strategy
   */
  getRetryStrategy<T extends QueueName>(
    queue: T,
    jobName: JobTypeMap[T]
  ): RetryStrategy {
    const key = `${queue}:${jobName}`;
    return this.strategies.get(key) || this.defaultStrategy;
  }
  
  /**
   * Handle a failed job and decide whether to retry
   * 
   * @param job The failed job
   * @param error The error that caused the failure
   * @returns Decision on whether to retry
   */
  async handleFailedJob(job: Job, error: Error): Promise<RetryDecision> {
    const queue = job.queue.name as QueueName;
    const jobName = job.name as any;
    const attempts = job.attemptsMade;
    
    logger.debug('Handling failed job', {
      jobId: job.id,
      queue,
      jobName,
      attempts,
      error: error.message
    });
    
    // Get the retry strategy for this job type
    const strategy = this.getRetryStrategy(queue, jobName);
    
    // Check if job should be retried
    if (attempts < strategy.maxAttempts && strategy.shouldRetry(job, error)) {
      // Calculate delay for next attempt
      const baseDelay = 5000; // Default base delay
      const delay = strategy.calculateDelay(attempts, baseDelay);
      
      logger.info('Job will be retried', {
        jobId: job.id,
        queue,
        jobName,
        attempts,
        nextAttemptDelay: delay,
        strategy: strategy.type
      });
      
      // Track retry statistics
      await this.recordRetryAttempt(queue, jobName);
      
      return {
        shouldRetry: true,
        delay,
        reason: 'Job failed but is eligible for retry'
      };
    }
    
    // Job should not be retried
    const reason = attempts >= strategy.maxAttempts
      ? `Exceeded maximum retry attempts (${strategy.maxAttempts})`
      : 'Error is not retryable';
    
    logger.warn('Job will not be retried', {
      jobId: job.id,
      queue,
      jobName,
      attempts,
      reason,
      error: error.message
    });
    
    // Track permanent failure statistics
    await this.recordPermanentFailure(queue, jobName);
    
    return {
      shouldRetry: false,
      reason
    };
  }
  
  /**
   * Manually retry a failed job
   * 
   * @param queue The queue name
   * @param jobId The job ID
   * @returns The retried job or null if not found
   */
  async manuallyRetryJob<T extends QueueName>(
    queue: T,
    jobId: string
  ): Promise<Job | null> {
    try {
      // Get the job
      const job = await jobService.getJob(queue, jobId);
      
      if (!job) {
        logger.warn('Job not found for manual retry', { queue, jobId });
        return null;
      }
      
      // Retry the job
      await job.retry();
      
      logger.info('Job manually retried', {
        jobId,
        queue,
        jobName: job.name
      });
      
      // Track manual retry
      await this.recordManualRetry(queue, job.name);
      
      return job;
    } catch (error) {
      logger.error('Error manually retrying job', {
        jobId,
        queue,
        error
      });
      throw error;
    }
  }
  
  /**
   * Get retry analytics for a queue
   * 
   * @param queue The queue name (optional, all queues if not specified)
   * @returns Retry analytics
   */
  async getRetryAnalytics(queue?: QueueName): Promise<RetryAnalytics> {
    try {
      // Get retry stats from Redis
      const retryKey = 'retry:stats';
      const stats = await redis.hgetall(retryKey);
      
      // Parse stats
      const retryCount = parseInt(stats.retryCount || '0', 10);
      const successAfterRetry = parseInt(stats.successAfterRetry || '0', 10);
      const permanentFailures = parseInt(stats.permanentFailures || '0', 10);
      
      // Calculate average retries per success
      const averageRetriesPerSuccess = successAfterRetry > 0
        ? retryCount / successAfterRetry
        : 0;
      
      // Get retry rates by queue
      const retryRateByQueue: Record<string, {
        totalJobs: number;
        retriedJobs: number;
        retryRate: number;
      }> = {};
      
      const queueNames = queue ? [queue] : Object.values(QueueName);
      
      for (const queueName of queueNames) {
        const queueStats = await redis.hgetall(`retry:stats:queue:${queueName}`);
        
        const totalJobs = parseInt(queueStats.totalJobs || '0', 10);
        const retriedJobs = parseInt(queueStats.retriedJobs || '0', 10);
        
        retryRateByQueue[queueName] = {
          totalJobs,
          retriedJobs,
          retryRate: totalJobs > 0 ? retriedJobs / totalJobs : 0
        };
      }
      
      return {
        retryCount,
        successAfterRetry,
        permanentFailures,
        averageRetriesPerSuccess,
        retryRateByQueue
      };
    } catch (error) {
      logger.error('Error getting retry analytics', { error });
      
      // Return empty analytics on error
      return {
        retryCount: 0,
        successAfterRetry: 0,
        permanentFailures: 0,
        averageRetriesPerSuccess: 0,
        retryRateByQueue: {}
      };
    }
  }
  
  /**
   * Record a retry attempt
   * 
   * @param queue The queue name
   * @param jobName The job name
   */
  private async recordRetryAttempt<T extends QueueName>(
    queue: T,
    jobName: string
  ): Promise<void> {
    try {
      const retryKey = 'retry:stats';
      const queueKey = `retry:stats:queue:${queue}`;
      const jobKey = `retry:stats:job:${queue}:${jobName}`;
      
      // Increment retry counters
      await redis.hincrby(retryKey, 'retryCount', 1);
      await redis.hincrby(queueKey, 'retriedJobs', 1);
      await redis.hincrby(jobKey, 'retryCount', 1);
    } catch (error) {
      logger.error('Error recording retry attempt', {
        queue,
        jobName,
        error
      });
    }
  }
  
  /**
   * Record a successful retry
   * 
   * @param queue The queue name
   * @param jobName The job name
   */
  async recordSuccessAfterRetry<T extends QueueName>(
    queue: T,
    jobName: string
  ): Promise<void> {
    try {
      const retryKey = 'retry:stats';
      const queueKey = `retry:stats:queue:${queue}`;
      const jobKey = `retry:stats:job:${queue}:${jobName}`;
      
      // Increment success counters
      await redis.hincrby(retryKey, 'successAfterRetry', 1);
      await redis.hincrby(queueKey, 'successAfterRetry', 1);
      await redis.hincrby(jobKey, 'successAfterRetry', 1);
    } catch (error) {
      logger.error('Error recording success after retry', {
        queue,
        jobName,
        error
      });
    }
  }
  
  /**
   * Record a permanent failure
   * 
   * @param queue The queue name
   * @param jobName The job name
   */
  private async recordPermanentFailure<T extends QueueName>(
    queue: T,
    jobName: string
  ): Promise<void> {
    try {
      const retryKey = 'retry:stats';
      const queueKey = `retry:stats:queue:${queue}`;
      const jobKey = `retry:stats:job:${queue}:${jobName}`;
      
      // Increment failure counters
      await redis.hincrby(retryKey, 'permanentFailures', 1);
      await redis.hincrby(queueKey, 'permanentFailures', 1);
      await redis.hincrby(jobKey, 'permanentFailures', 1);
    } catch (error) {
      logger.error('Error recording permanent failure', {
        queue,
        jobName,
        error
      });
    }
  }
  
  /**
   * Record a manual retry
   * 
   * @param queue The queue name
   * @param jobName The job name
   */
  private async recordManualRetry<T extends QueueName>(
    queue: T,
    jobName: string
  ): Promise<void> {
    try {
      const retryKey = 'retry:stats';
      const queueKey = `retry:stats:queue:${queue}`;
      const jobKey = `retry:stats:job:${queue}:${jobName}`;
      
      // Increment manual retry counters
      await redis.hincrby(retryKey, 'manualRetryCount', 1);
      await redis.hincrby(queueKey, 'manualRetryCount', 1);
      await redis.hincrby(jobKey, 'manualRetryCount', 1);
    } catch (error) {
      logger.error('Error recording manual retry', {
        queue,
        jobName,
        error
      });
    }
  }
}

// Export singleton instance
export const retryService = new RetryService();
