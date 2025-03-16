/**
 * Redemption Processor Job
 * 
 * Scheduled job that processes pending redemption requests,
 * converting Success Points to SKC tokens.
 */
import { CronJob } from 'cron';
import { logger } from '../lib/logger';
import { redemptionService } from '../services';

/**
 * Process pending redemptions job
 */
export function scheduleRedemptionProcessingJob(): CronJob {
  // Create a job that runs every day at midnight
  const job = new CronJob(
    '0 0 * * *', // Daily at midnight
    async () => {
      logger.info('Starting redemption processing job');
      
      try {
        // Process pending redemptions in batches
        const result = await redemptionService.processPendingRedemptions(100);
        
        logger.info('Redemption processing job completed', { 
          processed: result.processed,
          successful: result.successful,
          failed: result.failed 
        });
      } catch (error) {
        logger.error('Redemption processing job failed', { error });
      }
    },
    null, // onComplete
    false, // start
    'UTC' // timezone
  );
  
  return job;
}

/**
 * Start the redemption processing job
 */
export function startRedemptionProcessingJob(): CronJob {
  const job = scheduleRedemptionProcessingJob();
  job.start();
  
  logger.info('Redemption processing job scheduled');
  return job;
}
