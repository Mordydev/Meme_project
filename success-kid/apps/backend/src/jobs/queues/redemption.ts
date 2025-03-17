/**
 * Redemption Processing Queue
 * 
 * Manages background jobs for redemption-related operations.
 */
import Bull from 'bull';
import { logger } from '../../lib/logger';

// Job names handled by this queue
export enum RedemptionJobType {
  PROCESS = 'process-redemption',
  RETRY_FAILED = 'retry-failed',
  CHECK_PENDING = 'check-pending',
  VERIFICATION = 'verification',
  STATUS_UPDATE = 'status-update',
}

/**
 * Initialize the redemption queue
 * 
 * @param options Bull queue options
 * @returns Configured Bull queue
 */
export async function initializeRedemptionQueue(options: Bull.QueueOptions): Promise<Bull.Queue> {
  // Create the queue
  const queue = new Bull('redemption-processing', options);
  
  // Configure event handlers
  setupQueueEventHandlers(queue);
  
  // Set up recurring jobs
  await scheduleRecurringJobs(queue);
  
  return queue;
}

/**
 * Set up event handlers for the queue
 * 
 * @param queue Redemption queue
 */
function setupQueueEventHandlers(queue: Bull.Queue): void {
  // Job completion
  queue.on('completed', (job, result) => {
    logger.debug('Redemption job completed', { 
      jobId: job.id, 
      type: job.name,
      result: typeof result === 'object' ? { ...result } : result
    });
  });
  
  // Job failure
  queue.on('failed', (job, error) => {
    logger.error('Redemption job failed', { 
      jobId: job.id, 
      type: job.name, 
      error: error.message,
      stack: error.stack
    });
  });
  
  // Queue errors
  queue.on('error', (error) => {
    logger.error('Redemption queue error', { error: error.message });
  });
  
  // Stalled jobs (stuck processing)
  queue.on('stalled', (jobId) => {
    logger.warn('Redemption job stalled', { jobId });
  });
}

/**
 * Schedule recurring jobs in the queue
 * 
 * @param queue Redemption queue
 */
async function scheduleRecurringJobs(queue: Bull.Queue): Promise<void> {
  try {
    // Check for pending transactions every 5 minutes
    await queue.add(
      RedemptionJobType.CHECK_PENDING, 
      { limit: 20 }, 
      {
        repeat: { every: 5 * 60 * 1000 }, // 5 minutes
        removeOnComplete: true
      }
    );
    
    // Retry failed transactions every 15 minutes
    await queue.add(
      RedemptionJobType.RETRY_FAILED, 
      { limit: 10 }, 
      {
        repeat: { every: 15 * 60 * 1000 }, // 15 minutes
        removeOnComplete: true
      }
    );
    
    // Verify redemptions daily
    await queue.add(
      RedemptionJobType.VERIFICATION, 
      { }, 
      {
        repeat: { cron: '0 2 * * *' }, // 2 AM every day
        removeOnComplete: true
      }
    );
    
    logger.info('Scheduled recurring redemption jobs');
  } catch (error) {
    logger.error('Failed to schedule recurring redemption jobs', { error });
    throw error;
  }
}
