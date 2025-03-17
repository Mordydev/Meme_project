/**
 * Queue Utility Functions
 * 
 * Provides helper functions for job queue operations.
 */
import Bull, { JobOptions, Queue, Job } from 'bull';
import { logger } from '../../lib/logger';
import { queues, getQueue } from '../queues';

/**
 * Standard job options interface
 */
export interface JobOptions {
  /** Job priority (lower number = higher priority) */
  priority?: number;
  /** Number of retry attempts */
  attempts?: number;
  /** Backoff strategy for retries */
  backoff?: {
    /** Backoff type */
    type: 'exponential' | 'fixed';
    /** Delay in milliseconds */
    delay: number;
  };
  /** Job timeout in milliseconds */
  timeout?: number;
  /** Whether to remove the job when completed */
  removeOnComplete?: boolean | number;
  /** Whether to remove the job when failed */
  removeOnFail?: boolean | number;
  /** Job delay in milliseconds */
  delay?: number;
  /** Job lifespan in milliseconds */
  ttl?: number;
}

/**
 * Add a job to a queue
 * 
 * @param queueName Name of the queue to add the job to
 * @param jobName Name of the job
 * @param data Job data
 * @param options Job options
 * @returns The created job
 */
export async function addJob<T = any>(
  queueName: string, 
  jobName: string, 
  data: T, 
  options?: JobOptions
): Promise<Job<T>> {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found`);
  }
  
  // Convert our options format to Bull options
  const bullOptions: Bull.JobOptions = {
    priority: options?.priority,
    attempts: options?.attempts,
    backoff: options?.backoff,
    timeout: options?.timeout,
    removeOnComplete: options?.removeOnComplete,
    removeOnFail: options?.removeOnFail,
    delay: options?.delay,
    jobId: `${jobName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    ttl: options?.ttl,
  };
  
  // Add the job to the queue
  const job = await queue.add(jobName, data, bullOptions);
  
  logger.debug('Added job to queue', { 
    queueName, 
    jobName, 
    jobId: job.id,
    priority: options?.priority
  });
  
  return job;
}

/**
 * Get a job by ID from a queue
 * 
 * @param queueName Name of the queue
 * @param jobId Job ID
 * @returns The job or null if not found
 */
export async function getJob(queueName: string, jobId: string): Promise<Job | null> {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found`);
  }
  
  return queue.getJob(jobId);
}

/**
 * Get job status
 * 
 * @param queueName Name of the queue
 * @param jobId Job ID
 * @returns Job status
 */
export async function getJobStatus(queueName: string, jobId: string): Promise<string> {
  const job = await getJob(queueName, jobId);
  
  if (!job) {
    return 'not-found';
  }
  
  const state = await job.getState();
  return state;
}

/**
 * Remove a job from a queue
 * 
 * @param queueName Name of the queue
 * @param jobId Job ID
 */
export async function removeJob(queueName: string, jobId: string): Promise<void> {
  const job = await getJob(queueName, jobId);
  
  if (job) {
    await job.remove();
    logger.debug('Removed job from queue', { queueName, jobId });
  }
}

/**
 * Get job counts for a queue
 * 
 * @param queueName Name of the queue
 * @returns Job counts
 */
export async function getJobCounts(queueName: string): Promise<Bull.JobCounts> {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found`);
  }
  
  return queue.getJobCounts();
}

/**
 * Get all jobs in a queue by status
 * 
 * @param queueName Name of the queue
 * @param status Job status(es)
 * @param start Start index (pagination)
 * @param end End index (pagination)
 * @returns Jobs in the specified state(s)
 */
export async function getJobs(
  queueName: string,
  status: Bull.JobStatus | Bull.JobStatus[],
  start = 0,
  end = 10
): Promise<Job[]> {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found`);
  }
  
  return queue.getJobs(status, start, end);
}

/**
 * Clean a queue (remove completed and/or failed jobs)
 * 
 * @param queueName Name of the queue
 * @param maxAge Maximum age of jobs to clean (in milliseconds)
 * @param status Job status to clean
 * @returns Number of jobs cleaned
 */
export async function cleanQueue(
  queueName: string,
  maxAge: number,
  status: 'completed' | 'failed' | 'delayed' | 'active' | 'wait' | 'paused'
): Promise<number> {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found`);
  }
  
  return queue.clean(maxAge, status);
}

/**
 * Pause a queue
 * 
 * @param queueName Name of the queue
 * @param isLocal Whether to pause only local workers
 * @returns The queue instance
 */
export async function pauseQueue(queueName: string, isLocal = true): Promise<Queue> {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found`);
  }
  
  await queue.pause(isLocal);
  logger.info(`Queue "${queueName}" paused`, { isLocal });
  
  return queue;
}

/**
 * Resume a paused queue
 * 
 * @param queueName Name of the queue
 * @param isLocal Whether to resume only local workers
 * @returns The queue instance
 */
export async function resumeQueue(queueName: string, isLocal = true): Promise<Queue> {
  const queue = getQueue(queueName);
  
  if (!queue) {
    throw new Error(`Queue "${queueName}" not found`);
  }
  
  await queue.resume(isLocal);
  logger.info(`Queue "${queueName}" resumed`, { isLocal });
  
  return queue;
}

/**
 * Retry a failed job
 * 
 * @param queueName Name of the queue
 * @param jobId Job ID
 * @returns The job instance
 */
export async function retryJob(queueName: string, jobId: string): Promise<Job | null> {
  const job = await getJob(queueName, jobId);
  
  if (!job) {
    return null;
  }
  
  await job.retry();
  logger.info(`Job ${jobId} in queue "${queueName}" scheduled for retry`);
  
  return job;
}

/**
 * Promote a delayed job to be executed immediately
 * 
 * @param queueName Name of the queue
 * @param jobId Job ID
 * @returns The job instance
 */
export async function promoteJob(queueName: string, jobId: string): Promise<Job | null> {
  const job = await getJob(queueName, jobId);
  
  if (!job) {
    return null;
  }
  
  await job.promote();
  logger.info(`Job ${jobId} in queue "${queueName}" promoted to immediate execution`);
  
  return job;
}

/**
 * Get all active queues
 * 
 * @returns Object with queue names as keys and queue instances as values
 */
export function getAllQueues(): Record<string, Bull.Queue> {
  return { ...queues };
}
