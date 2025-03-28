/**
 * Retry Mechanism
 * 
 * Provides advanced retry capabilities for background jobs.
 */
import { Job } from 'bull';
import { logger } from '../../lib/logger';
import { RetryStrategy, RetryDecision } from './strategies';
import { getDefaultStrategy } from './strategies';
import { analyzeFaulure } from './analyzer';

// Map of job types to retry strategies
const retryStrategies = new Map<string, RetryStrategy>();

/**
 * Configure a retry strategy for a job type
 * 
 * @param queue Queue name
 * @param jobName Job name
 * @param strategy Retry strategy
 */
export function configureRetryStrategy(
  queue: string, 
  jobName: string, 
  strategy: RetryStrategy
): void {
  const key = `${queue}:${jobName}`;
  retryStrategies.set(key, strategy);
  logger.debug(`Configured retry strategy for ${key}`, { strategy });
}

/**
 * Get the retry strategy for a job
 * 
 * @param queue Queue name
 * @param jobName Job name
 * @returns Retry strategy
 */
export function getRetryStrategy(
  queue: string, 
  jobName: string
): RetryStrategy {
  const key = `${queue}:${jobName}`;
  return retryStrategies.get(key) || getDefaultStrategy();
}

/**
 * Handle a failed job
 * 
 * @param job Failed job
 * @param error Error that caused the failure
 * @returns Retry decision
 */
export async function handleFailedJob(
  job: Job, 
  error: Error
): Promise<RetryDecision> {
  // Get the strategy for this job type
  const strategy = getRetryStrategy(job.queue.name, job.name);
  
  // Analyze the failure to determine if it's retryable
  const analysis = analyzeFaulure(error);
  
  // Check if we should retry based on the strategy
  if (
    job.attemptsMade < strategy.maxAttempts && 
    strategy.shouldRetry(job, error, analysis)
  ) {
    // Calculate delay for next attempt
    const delay = strategy.calculateDelay(job.attemptsMade, strategy.baseDelay);
    
    // Schedule retry with calculated delay
    await job.retry({ delay });
    
    logger.info('Job scheduled for retry', { 
      jobId: job.id, 
      queue: job.queue.name, 
      jobName: job.name,
      attempt: job.attemptsMade, 
      nextAttemptDelay: delay 
    });
    
    return {
      shouldRetry: true,
      delay,
      attempt: job.attemptsMade,
      reason: analysis.retryReason
    };
  }
  
  // Job should not be retried
  logger.warn('Job will not be retried', { 
    jobId: job.id, 
    queue: job.queue.name, 
    jobName: job.name,
    attempts: job.attemptsMade, 
    maxAttempts: strategy.maxAttempts,
    permanent: analysis.isPermanentFailure,
    reason: analysis.nonRetryReason
  });
  
  return {
    shouldRetry: false,
    attempt: job.attemptsMade,
    reason: analysis.nonRetryReason || 'Max attempts reached'
  };
}

/**
 * Manually retry a job
 * 
 * @param queue Queue name
 * @param jobId Job ID
 * @returns Job if found and retried, null otherwise
 */
export async function manuallyRetryJob(
  queue: string, 
  jobId: string
): Promise<Job | null> {
  // This is just a stub - in a real implementation,
  // we would get the job from the queue and retry it
  return null;
}

/**
 * Get retry analytics
 * 
 * @param queue Queue name
 * @returns Retry analytics
 */
export async function getRetryAnalytics(
  queue: string
): Promise<any> {
  // This is just a stub - in a real implementation,
  // we would gather analytics from Redis or another data store
  return {
    totalJobs: 0,
    retriedJobs: 0,
    averageRetries: 0,
    successAfterRetry: 0,
    failureAfterRetry: 0
  };
}

export { RetryStrategy, RetryDecision } from './strategies';
export { FailureAnalysis, FailureType } from './analyzer';
