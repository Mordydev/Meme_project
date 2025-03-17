/**
 * Media Processing Queue
 * 
 * Manages background jobs for media-related operations.
 */
import Bull from 'bull';
import { logger } from '../../lib/logger';

// Job names handled by this queue
export enum MediaJobType {
  IMAGE_OPTIMIZATION = 'image-optimization',
  VIDEO_PROCESSING = 'video-processing',
  CLEANUP = 'cleanup',
  VALIDATION = 'validation',
  THUMBNAIL_GENERATION = 'thumbnail-generation',
}

/**
 * Initialize the media queue
 * 
 * @param options Bull queue options
 * @returns Configured Bull queue
 */
export async function initializeMediaQueue(options: Bull.QueueOptions): Promise<Bull.Queue> {
  // Create the queue
  const queue = new Bull('media-processing', options);
  
  // Configure event handlers
  setupQueueEventHandlers(queue);
  
  // Set up recurring jobs
  await scheduleRecurringJobs(queue);
  
  return queue;
}

/**
 * Set up event handlers for the queue
 * 
 * @param queue Media queue
 */
function setupQueueEventHandlers(queue: Bull.Queue): void {
  // Job completion
  queue.on('completed', (job, result) => {
    logger.debug('Media job completed', { 
      jobId: job.id, 
      type: job.name,
      result: typeof result === 'object' ? { ...result } : result
    });
  });
  
  // Job failure
  queue.on('failed', (job, error) => {
    logger.error('Media job failed', { 
      jobId: job.id, 
      type: job.name, 
      error: error.message,
      stack: error.stack
    });
  });
  
  // Queue errors
  queue.on('error', (error) => {
    logger.error('Media queue error', { error: error.message });
  });
  
  // Stalled jobs (stuck processing)
  queue.on('stalled', (jobId) => {
    logger.warn('Media job stalled', { jobId });
  });
  
  // Progress updates for long-running jobs
  queue.on('progress', (job, progress) => {
    if (job.name === MediaJobType.VIDEO_PROCESSING) {
      logger.debug('Video processing progress', { 
        jobId: job.id, 
        progress: typeof progress === 'number' ? `${progress}%` : progress 
      });
    }
  });
}

/**
 * Schedule recurring jobs in the queue
 * 
 * @param queue Media queue
 */
async function scheduleRecurringJobs(queue: Bull.Queue): Promise<void> {
  try {
    // Clean up temporary files daily
    await queue.add(
      MediaJobType.CLEANUP, 
      { olderThan: '24h' }, 
      {
        repeat: { cron: '0 3 * * *' }, // 3 AM every day
        removeOnComplete: true
      }
    );
    
    logger.info('Scheduled recurring media jobs');
  } catch (error) {
    logger.error('Failed to schedule recurring media jobs', { error });
    throw error;
  }
}
