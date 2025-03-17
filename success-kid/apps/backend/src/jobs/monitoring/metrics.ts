/**
 * Job Metrics Collection
 * 
 * Collects metrics about job processing
 */
import { Queue, JobCounts } from 'bull';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';
import { QueueName } from '../queues';

/**
 * Job metrics interface
 */
export interface JobMetrics {
  queue: string;
  completed: number;
  failed: number;
  delayed: number;
  active: number;
  waiting: number;
  throughput: number; // Jobs per minute
  averageProcessingTime: number; // In milliseconds
  errorRate: number; // Ratio of failed to total jobs
  totalProcessed: number; // Total processed jobs
  waitTime?: number; // Average wait time in queue
  timestamp: Date;
}

/**
 * Job metrics history for trend analysis
 */
export interface JobMetricsHistory {
  queue: string;
  metrics: Array<{
    timestamp: Date;
    completed: number;
    failed: number;
    throughput: number;
    averageProcessingTime: number;
    errorRate: number;
  }>;
}

/**
 * Service for collecting and storing job metrics
 */
export class MetricsService {
  private readonly metricsKey = 'job:metrics';
  private readonly processingTimesKey = 'job:processing:times';
  private readonly throughputWindow = 5 * 60 * 1000; // 5 minutes for throughput calculation
  
  /**
   * Collect metrics for a queue
   * 
   * @param queue The queue object
   * @returns Collected metrics
   */
  async collectQueueMetrics(queue: Queue): Promise<JobMetrics> {
    try {
      // Get job counts
      const counts: JobCounts = await queue.getJobCounts();
      
      // Get throughput (jobs per minute)
      const throughput = await this.calculateThroughput(queue.name);
      
      // Get average processing time
      const averageProcessingTime = await this.getAverageProcessingTime(queue.name);
      
      // Calculate error rate
      const totalProcessed = counts.completed + counts.failed;
      const errorRate = totalProcessed > 0 ? counts.failed / totalProcessed : 0;
      
      // Get average wait time (if available)
      const waitTime = await this.getAverageWaitTime(queue.name);
      
      const metrics: JobMetrics = {
        queue: queue.name,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        active: counts.active,
        waiting: counts.waiting,
        throughput,
        averageProcessingTime,
        errorRate,
        totalProcessed,
        waitTime,
        timestamp: new Date()
      };
      
      // Store metrics
      await this.storeMetrics(metrics);
      
      return metrics;
    } catch (error) {
      logger.error('Error collecting queue metrics', {
        queueName: queue.name,
        error
      });
      
      // Return default metrics on error
      return {
        queue: queue.name,
        completed: 0,
        failed: 0,
        delayed: 0,
        active: 0,
        waiting: 0,
        throughput: 0,
        averageProcessingTime: 0,
        errorRate: 0,
        totalProcessed: 0,
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Calculate job throughput (jobs per minute)
   * 
   * @param queueName The queue name
   * @returns Throughput (jobs per minute)
   */
  private async calculateThroughput(queueName: string): Promise<number> {
    try {
      const now = Date.now();
      const windowStart = now - this.throughputWindow;
      
      // Get completed jobs in the window
      const completedJobs = await redis.zcount(
        `${this.metricsKey}:${queueName}:completed`,
        windowStart,
        now
      );
      
      // Convert to jobs per minute
      return (completedJobs / this.throughputWindow) * 60000;
    } catch (error) {
      logger.error('Error calculating throughput', {
        queueName,
        error
      });
      return 0;
    }
  }
  
  /**
   * Get average processing time for jobs
   * 
   * @param queueName The queue name
   * @returns Average processing time in milliseconds
   */
  private async getAverageProcessingTime(queueName: string): Promise<number> {
    try {
      const times = await redis.lrange(
        `${this.processingTimesKey}:${queueName}`,
        0,
        99
      );
      
      if (times.length === 0) {
        return 0;
      }
      
      const sum = times.reduce((acc, time) => acc + parseInt(time, 10), 0);
      return sum / times.length;
    } catch (error) {
      logger.error('Error getting average processing time', {
        queueName,
        error
      });
      return 0;
    }
  }
  
  /**
   * Get average wait time for jobs
   * 
   * @param queueName The queue name
   * @returns Average wait time in milliseconds
   */
  private async getAverageWaitTime(queueName: string): Promise<number | undefined> {
    try {
      const waitTimes = await redis.lrange(
        `${this.metricsKey}:${queueName}:wait-times`,
        0,
        99
      );
      
      if (waitTimes.length === 0) {
        return undefined;
      }
      
      const sum = waitTimes.reduce((acc, time) => acc + parseInt(time, 10), 0);
      return sum / waitTimes.length;
    } catch (error) {
      logger.error('Error getting average wait time', {
        queueName,
        error
      });
      return undefined;
    }
  }
  
  /**
   * Store job completion time for metrics
   * 
   * @param queueName The queue name
   * @param jobId The job ID
   * @param processingTime Processing time in milliseconds
   */
  async recordJobCompletion(
    queueName: string, 
    jobId: string,
    processingTime: number
  ): Promise<void> {
    try {
      const now = Date.now();
      const multi = redis.multi();
      
      // Add to completed jobs with timestamp
      multi.zadd(`${this.metricsKey}:${queueName}:completed`, now, `${jobId}:${now}`);
      
      // Add processing time to the list (keep last 100)
      multi.lpush(`${this.processingTimesKey}:${queueName}`, processingTime.toString());
      multi.ltrim(`${this.processingTimesKey}:${queueName}`, 0, 99);
      
      // Execute transaction
      await multi.exec();
    } catch (error) {
      logger.error('Error recording job completion', {
        queueName,
        jobId,
        processingTime,
        error
      });
    }
  }
  
  /**
   * Store job failure for metrics
   * 
   * @param queueName The queue name
   * @param jobId The job ID
   * @param errorMessage Error message
   */
  async recordJobFailure(
    queueName: string,
    jobId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      const now = Date.now();
      
      // Add to failed jobs with timestamp
      await redis.zadd(
        `${this.metricsKey}:${queueName}:failed`,
        now,
        `${jobId}:${now}:${errorMessage.substring(0, 100)}`
      );
    } catch (error) {
      logger.error('Error recording job failure', {
        queueName,
        jobId,
        error
      });
    }
  }
  
  /**
   * Record job wait time
   * 
   * @param queueName The queue name
   * @param jobId The job ID
   * @param waitTime Wait time in milliseconds
   */
  async recordJobWaitTime(
    queueName: string,
    jobId: string,
    waitTime: number
  ): Promise<void> {
    try {
      // Add wait time to the list (keep last 100)
      await redis.lpush(`${this.metricsKey}:${queueName}:wait-times`, waitTime.toString());
      await redis.ltrim(`${this.metricsKey}:${queueName}:wait-times`, 0, 99);
    } catch (error) {
      logger.error('Error recording job wait time', {
        queueName,
        jobId,
        waitTime,
        error
      });
    }
  }
  
  /**
   * Store metrics for historical tracking
   * 
   * @param metrics The metrics to store
   */
  private async storeMetrics(metrics: JobMetrics): Promise<void> {
    try {
      // Store current metrics
      await redis.set(
        `${this.metricsKey}:${metrics.queue}:current`,
        JSON.stringify(metrics),
        'EX',
        60 * 30 // Expire after 30 minutes
      );
      
      // Store historical metrics (keep only essential data)
      const historicalMetric = {
        timestamp: metrics.timestamp.getTime(),
        completed: metrics.completed,
        failed: metrics.failed,
        throughput: metrics.throughput,
        averageProcessingTime: metrics.averageProcessingTime,
        errorRate: metrics.errorRate
      };
      
      // Add to sorted set with timestamp as score
      await redis.zadd(
        `${this.metricsKey}:${metrics.queue}:history`,
        metrics.timestamp.getTime(),
        JSON.stringify(historicalMetric)
      );
      
      // Keep only last 24 hours of data
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      await redis.zremrangebyscore(
        `${this.metricsKey}:${metrics.queue}:history`,
        0,
        oneDayAgo
      );
    } catch (error) {
      logger.error('Error storing metrics', {
        queueName: metrics.queue,
        error
      });
    }
  }
  
  /**
   * Get current metrics for all queues
   * 
   * @returns Map of queue name to metrics
   */
  async getCurrentMetrics(): Promise<Map<string, JobMetrics>> {
    try {
      const metrics = new Map<string, JobMetrics>();
      
      // Get all queue metrics
      for (const queueName of Object.values(QueueName)) {
        const metricsJson = await redis.get(`${this.metricsKey}:${queueName}:current`);
        
        if (metricsJson) {
          metrics.set(queueName, JSON.parse(metricsJson));
        }
      }
      
      return metrics;
    } catch (error) {
      logger.error('Error getting current metrics', { error });
      return new Map();
    }
  }
  
  /**
   * Get historical metrics for a queue
   * 
   * @param queueName The queue name
   * @param limit Maximum number of data points (default: 24)
   * @returns Historical metrics
   */
  async getHistoricalMetrics(queueName: string, limit: number = 24): Promise<JobMetricsHistory> {
    try {
      // Get historical metrics from sorted set
      const metricsArray = await redis.zrevrange(
        `${this.metricsKey}:${queueName}:history`,
        0,
        limit - 1
      );
      
      // Parse metrics
      const metrics = metricsArray.map(metricsJson => {
        const metric = JSON.parse(metricsJson);
        return {
          ...metric,
          timestamp: new Date(metric.timestamp)
        };
      });
      
      return {
        queue: queueName,
        metrics
      };
    } catch (error) {
      logger.error('Error getting historical metrics', {
        queueName,
        error
      });
      
      return {
        queue: queueName,
        metrics: []
      };
    }
  }
  
  /**
   * Clean up old metrics data
   */
  async cleanUpOldMetrics(): Promise<void> {
    try {
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneHourAgo = now - (60 * 60 * 1000);
      
      // Clean up for each queue
      for (const queueName of Object.values(QueueName)) {
        // Remove old completed job entries
        await redis.zremrangebyscore(
          `${this.metricsKey}:${queueName}:completed`,
          0,
          oneHourAgo
        );
        
        // Remove old failed job entries
        await redis.zremrangebyscore(
          `${this.metricsKey}:${queueName}:failed`,
          0,
          oneDayAgo
        );
        
        // Keep only last 24 hours of historical metrics
        await redis.zremrangebyscore(
          `${this.metricsKey}:${queueName}:history`,
          0,
          oneDayAgo
        );
      }
      
      logger.info('Cleaned up old metrics data');
    } catch (error) {
      logger.error('Error cleaning up old metrics', { error });
    }
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
