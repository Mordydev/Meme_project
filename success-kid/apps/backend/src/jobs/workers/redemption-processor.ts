/**
 * Redemption Processor Job
 * 
 * Background job to process pending point redemptions in batches.
 * Converts Success Points to SKC tokens via blockchain transactions.
 */
import { logger } from '../../lib/logger';
import { redemptionService } from '../../services';
import { REDEMPTION_CONSTANTS } from '../../models/entities/redemption.model';

export default {
  /**
   * Process pending redemptions
   */
  name: 'process-redemptions',
  
  /**
   * Job execution function
   */
  async process(job: any): Promise<any> {
    logger.info('Starting redemption processing job', {
      jobId: job.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Get batch size limit from job data or use default
      const batchLimit = job.data?.batchLimit || REDEMPTION_CONSTANTS.BATCH_SIZE_LIMIT;
      
      // Process pending redemptions
      const result = await redemptionService.processPendingRedemptions(batchLimit);
      
      // Log results
      logger.info('Redemption processing completed', {
        jobId: job.id,
        success: result.success,
        processed: result.processed,
        errors: result.errors,
        batchIds: result.batchIds,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      logger.error('Error in redemption processing job', {
        jobId: job.id,
        error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  },
  
  /**
   * Options for job scheduling
   */
  options: {
    // Retry up to 3 times with exponential backoff
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000 // 1 minute initial delay
    },
    // If job fails after all retries, move to failed queue
    removeOnComplete: true,
    removeOnFail: false
  }
};
