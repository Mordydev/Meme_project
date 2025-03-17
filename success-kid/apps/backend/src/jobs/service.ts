/**
 * Job Service
 * 
 * Core service for interacting with background jobs and queues
 */
import { Job, JobOptions } from 'bull';
import { logger } from '../lib/logger';
import { 
  addJob,
  getJob, 
  getJobStatus,
  removeJob,
  retryJob,
  getQueueCounts,
  cleanQueue
} from './utils/queue-utils';
import { QueueName, JobTypeMap } from './queues';

/**
 * Job service for background processing
 */
export class JobService {
  /**
   * Add a job to a specified queue
   * 
   * @param queue The queue name
   * @param name The job name
   * @param data The job data
   * @param options Job options
   * @returns The created job's ID
   */
  async addJob<T extends QueueName, D = any>(
    queue: T,
    name: JobTypeMap[T],
    data: D,
    options?: JobOptions
  ): Promise<string> {
    logger.debug('Adding job to queue', { queue, name });
    const job = await addJob(queue, name, data, options);
    
    return job.id;
  }
  
  /**
   * Get a job by ID
   * 
   * @param queue The queue name
   * @param jobId The job ID
   * @returns The job or null if not found
   */
  async getJob<T extends QueueName, D = any>(
    queue: T,
    jobId: string
  ): Promise<Job<D> | null> {
    return getJob(queue, jobId);
  }
  
  /**
   * Get job status information
   * 
   * @param queue The queue name
   * @param jobId The job ID
   * @returns Job status information
   */
  async getJobStatus<T extends QueueName>(
    queue: T,
    jobId: string
  ): Promise<{
    id: string;
    state: 'completed' | 'failed' | 'delayed' | 'active' | 'waiting' | 'unknown';
    progress: number;
    attempts: number;
    reason?: string;
    result?: any;
  } | null> {
    return getJobStatus(queue, jobId);
  }
  
  /**
   * Remove a job from a queue
   * 
   * @param queue The queue name
   * @param jobId The job ID
   * @returns True if job was removed, false otherwise
   */
  async removeJob<T extends QueueName>(
    queue: T,
    jobId: string
  ): Promise<boolean> {
    return removeJob(queue, jobId);
  }
  
  /**
   * Retry a failed job
   * 
   * @param queue The queue name
   * @param jobId The job ID
   * @returns True if job was retried, false otherwise
   */
  async retryJob<T extends QueueName>(
    queue: T,
    jobId: string
  ): Promise<boolean> {
    return retryJob(queue, jobId);
  }
  
  /**
   * Get queue statistics
   * 
   * @param queue The queue name
   * @returns Queue statistics
   */
  async getQueueStats<T extends QueueName>(queue: T): Promise<{
    counts: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      paused: number;
    };
  }> {
    const counts = await getQueueCounts(queue);
    
    return {
      counts
    };
  }
  
  /**
   * Clean completed jobs from a queue
   * 
   * @param queue The queue name
   * @param olderThan Time in milliseconds
   * @returns Number of removed jobs
   */
  async cleanCompletedJobs<T extends QueueName>(
    queue: T,
    olderThan: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<number> {
    return cleanQueue(queue, olderThan, 'completed');
  }
  
  /**
   * Clean failed jobs from a queue
   * 
   * @param queue The queue name
   * @param olderThan Time in milliseconds
   * @returns Number of removed jobs
   */
  async cleanFailedJobs<T extends QueueName>(
    queue: T,
    olderThan: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<number> {
    return cleanQueue(queue, olderThan, 'failed');
  }
}

// Export a singleton instance
export const jobService = new JobService();