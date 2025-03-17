/**
 * Queue Utilities
 * 
 * Shared utilities for interacting with job queues
 */
import { Job, JobOptions, Queue } from 'bull';
import { logger } from '../../lib/logger';
import { QueueName, JobTypeMap, getQueue } from '../queues';

/**
 * Job options interface with defaults
 */
export interface EnhancedJobOptions extends JobOptions {
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  timeout?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

/**
 * Add a job to a specified queue
 * 
 * @param queue The queue name
 * @param name The job name
 * @param data The job data
 * @param options Job options
 * @returns The created job
 */
export async function addJob<T extends QueueName, D = any>(
  queue: T,
  name: JobTypeMap[T],
  data: D,
  options?: EnhancedJobOptions
): Promise<Job<D>> {
  try {
    const targetQueue = getQueue(queue);
    
    const job = await targetQueue.add(name, data, {
      priority: options?.priority ?? 0,
      attempts: options?.attempts ?? 3,
      backoff: options?.backoff ?? { type: 'exponential', delay: 5000 },
      timeout: options?.timeout ?? 60000,
      removeOnComplete: options?.removeOnComplete ?? true,
      removeOnFail: options?.removeOnFail ?? false,
      delay: options?.delay ?? 0,
      ...options
    });
    
    logger.debug(`Added job to queue ${queue}`, {
      jobId: job.id,
      jobName: name,
      priority: options?.priority,
      delay: options?.delay
    });
    
    return job;
  } catch (error) {
    logger.error(`Error adding job to queue ${queue}`, {
      jobName: name,
      error
    });
    throw error;
  }
}

/**
 * Get a job by ID from a specified queue
 * 
 * @param queue The queue name
 * @param jobId The job ID
 * @returns The job or null if not found
 */
export async function getJob<T extends QueueName, D = any>(
  queue: T,
  jobId: string
): Promise<Job<D> | null> {
  try {
    const targetQueue = getQueue(queue);
    return await targetQueue.getJob(jobId);
  } catch (error) {
    logger.error(`Error getting job ${jobId} from queue ${queue}`, { error });
    throw error;
  }
}

/**
 * Get job status information
 * 
 * @param queue The queue name
 * @param jobId The job ID
 * @returns Job status information
 */
export async function getJobStatus<T extends QueueName>(
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
  try {
    const job = await getJob(queue, jobId);
    
    if (!job) {
      return null;
    }
    
    // Get job state
    const state = await job.getState();
    
    return {
      id: job.id,
      state: state as any,
      progress: job.progress,
      attempts: job.attemptsMade,
      reason: job.failedReason,
      result: job.returnvalue
    };
  } catch (error) {
    logger.error(`Error getting job status for ${jobId} from queue ${queue}`, { error });
    return null;
  }
}

/**
 * Remove a job from a queue
 * 
 * @param queue The queue name
 * @param jobId The job ID
 * @returns True if job was removed, false otherwise
 */
export async function removeJob<T extends QueueName>(
  queue: T,
  jobId: string
): Promise<boolean> {
  try {
    const job = await getJob(queue, jobId);
    
    if (!job) {
      return false;
    }
    
    await job.remove();
    return true;
  } catch (error) {
    logger.error(`Error removing job ${jobId} from queue ${queue}`, { error });
    return false;
  }
}

/**
 * Process counts for a queue
 */
export type QueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
};

/**
 * Get job counts for a queue
 * 
 * @param queue The queue name
 * @returns Job counts by status
 */
export async function getQueueCounts<T extends QueueName>(
  queue: T
): Promise<QueueCounts> {
  try {
    const targetQueue = getQueue(queue);
    return await targetQueue.getJobCounts();
  } catch (error) {
    logger.error(`Error getting job counts for queue ${queue}`, { error });
    throw error;
  }
}

/**
 * Clean a queue by removing jobs in specified states
 * 
 * @param queue The queue name
 * @param grace Period in milliseconds to keep jobs
 * @param status Job status to clean ('completed', 'failed', 'delayed')
 * @param limit Maximum number of jobs to clean
 * @returns Number of removed jobs
 */
export async function cleanQueue<T extends QueueName>(
  queue: T,
  grace: number = 24 * 60 * 60 * 1000, // 24 hours by default
  status: 'completed' | 'failed' | 'delayed' | 'wait' | 'active' | 'paused' = 'completed',
  limit: number = 1000
): Promise<number> {
  try {
    const targetQueue = getQueue(queue);
    return await targetQueue.clean(grace, status, limit);
  } catch (error) {
    logger.error(`Error cleaning queue ${queue}`, { error, status, grace });
    throw error;
  }
}

/**
 * Pause a queue
 * 
 * @param queue The queue name
 * @returns Void
 */
export async function pauseQueue<T extends QueueName>(queue: T): Promise<void> {
  try {
    const targetQueue = getQueue(queue);
    await targetQueue.pause();
    logger.info(`Queue ${queue} paused`);
  } catch (error) {
    logger.error(`Error pausing queue ${queue}`, { error });
    throw error;
  }
}

/**
 * Resume a queue
 * 
 * @param queue The queue name
 * @returns Void
 */
export async function resumeQueue<T extends QueueName>(queue: T): Promise<void> {
  try {
    const targetQueue = getQueue(queue);
    await targetQueue.resume();
    logger.info(`Queue ${queue} resumed`);
  } catch (error) {
    logger.error(`Error resuming queue ${queue}`, { error });
    throw error;
  }
}

/**
 * Empty a queue by removing all jobs
 * 
 * @param queue The queue name
 * @returns Void
 */
export async function emptyQueue<T extends QueueName>(queue: T): Promise<void> {
  try {
    const targetQueue = getQueue(queue);
    await targetQueue.empty();
    logger.info(`Queue ${queue} emptied`);
  } catch (error) {
    logger.error(`Error emptying queue ${queue}`, { error });
    throw error;
  }
}

/**
 * Get a list of jobs by status
 * 
 * @param queue The queue name
 * @param status Job status or list of statuses
 * @param start Start index (0-based)
 * @param end End index (inclusive)
 * @returns Array of jobs
 */
export async function getJobs<T extends QueueName, D = any>(
  queue: T,
  status: 'completed' | 'failed' | 'delayed' | 'active' | 'waiting' | string | string[],
  start: number = 0,
  end: number = 100
): Promise<Job<D>[]> {
  try {
    const targetQueue = getQueue(queue);
    return await targetQueue.getJobs(status as any, start, end);
  } catch (error) {
    logger.error(`Error getting jobs from queue ${queue}`, { error, status });
    throw error;
  }
}

/**
 * Retry a failed job
 * 
 * @param queue The queue name
 * @param jobId The job ID
 * @returns True if job was retried, false otherwise
 */
export async function retryJob<T extends QueueName>(
  queue: T,
  jobId: string
): Promise<boolean> {
  try {
    const job = await getJob(queue, jobId);
    
    if (!job) {
      return false;
    }
    
    await job.retry();
    logger.info(`Job ${jobId} in queue ${queue} retried`);
    return true;
  } catch (error) {
    logger.error(`Error retrying job ${jobId} in queue ${queue}`, { error });
    return false;
  }
}
