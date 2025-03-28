/**
 * Points Processing Queue
 * 
 * Manages background jobs for points-related operations.
 */
import Bull from 'bull';
import { logger } from '../../lib/logger';

// Job names handled by this queue
export enum PointsJobType {
  AWARD = 'award',
  REDEMPTION = 'redemption',
  BATCH_PROCESSING = 'batch-processing',
  POINTS_VERIFICATION = 'verification',
  LEADERBOARD_UPDATE = 'leaderboard-update',
}

/**
 * Initialize the points queue
 * 
 * @param options Bull queue options
 * @returns Configured Bull queue
 */
export async function initializePointsQueue(options: Bull.QueueOptions): Promise<Bull.Queue> {
  // Create the queue
  const queue = new Bull('points-processing', options);
  
  // Configure event handlers
  setupQueueEventHandlers(queue);
  
  // Set up recurring jobs
  await scheduleRecurringJobs(queue);
  
  return queue;
}

/**
 * Set up event handlers for the queue
 * 
 * @param queue Points queue
 */
function setupQueueEventHandlers(queue: Bull.Queue): void {
  // Job completion
  queue.on('completed', (job, result) => {
    logger.debug('Points job completed', { 
      jobId: job.id, 
      type: job.name,
      result: typeof result === 'object' ? { ...result } : result
    });
  });
  
  // Job failure
  queue.on('failed', (job, error) => {
    logger.error('Points job failed', { 
      jobId: job.id, 
      type: job.name, 
      error: error.message,
      stack: error.stack
    });
  });
  
  // Queue errors
  queue.on('error', (error) => {
    logger.error('Points queue error', { error: error.message });
  });
  
  // Stalled jobs (stuck processing)
  queue.on('stalled', (jobId) => {
    logger.warn('Points job stalled', { jobId });
  });
}

/**
 * Schedule recurring jobs in the queue
 * 
 * @param queue Points queue
 */
async function scheduleRecurringJobs(queue: Bull.Queue): Promise<void> {
  try {
    // Daily leaderboard update
    await queue.add(
      PointsJobType.LEADERBOARD_UPDATE, 
      { type: 'daily' }, 
      {
        repeat: { cron: '0 0 * * *' }, // Midnight every day
        removeOnComplete: true
      }
    );
    
    // Weekly leaderboard update
    await queue.add(
      PointsJobType.LEADERBOARD_UPDATE, 
      { type: 'weekly' }, 
      {
        repeat: { cron: '0 0 * * 0' }, // Midnight on Sunday
        removeOnComplete: true
      }
    );
    
    // Monthly leaderboard update
    await queue.add(
      PointsJobType.LEADERBOARD_UPDATE, 
      { type: 'monthly' }, 
      {
        repeat: { cron: '0 0 1 * *' }, // Midnight on 1st of month
        removeOnComplete: true
      }
    );
    
    // Points verification (run every 6 hours)
    await queue.add(
      PointsJobType.POINTS_VERIFICATION, 
      { limit: 1000 }, 
      {
        repeat: { cron: '0 */6 * * *' }, // Every 6 hours
        removeOnComplete: true
      }
    );
    
    logger.info('Scheduled recurring points jobs');
  } catch (error) {
    logger.error('Failed to schedule recurring points jobs', { error });
    throw error;
  }
}
