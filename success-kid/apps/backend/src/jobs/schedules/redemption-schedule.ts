/**
 * Redemption Processing Schedule
 * 
 * Configures the schedule for the redemption processing job.
 */
import { REDEMPTION_CONSTANTS } from '../../models/entities/redemption.model';

/**
 * Schedule configuration for redemption processing
 */
export default {
  /**
   * Job name that will be executed
   */
  jobName: 'process-redemptions',
  
  /**
   * Schedule pattern in cron format
   * Default: Every Sunday at 00:00 UTC
   */
  schedule: '0 0 * * 0',
  
  /**
   * Job data to pass to the worker
   */
  data: {
    batchLimit: REDEMPTION_CONSTANTS.BATCH_SIZE_LIMIT
  },
  
  /**
   * Whether to schedule this job when the server starts
   */
  enableOnStart: true,
  
  /**
   * Options for job scheduling
   */
  options: {
    priority: 5,
    // The job will be removed after completion
    removeOnComplete: true,
    // Failed jobs will be kept for review
    removeOnFail: false,
    // Job will be attempted once more if it fails
    attempts: 2,
    // Backoff strategy for retries
    backoff: {
      type: 'exponential',
      delay: 60000 // 1 minute initial delay
    }
  }
};
