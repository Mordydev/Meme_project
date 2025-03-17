/**
 * Points Processing Workers
 * 
 * Process jobs related to points management and redemption
 */
import { Job } from 'bull';
import { logger } from '../../lib/logger';
import { eventBus, EventType } from '../../lib/event-bus';
import { RedemptionService, RedemptionStatus } from '../../services/points/redemption-service';

let redemptionService: RedemptionService;

/**
 * Set the redemption service
 * This is called during worker initialization
 */
export function setRedemptionService(service: RedemptionService): void {
  redemptionService = service;
}

/**
 * Process a redemption job
 * 
 * @param job The Bull job
 * @returns Result of the processing
 */
export async function processRedemption(job: Job): Promise<{
  success: boolean;
  transactionHash?: string;
  status?: RedemptionStatus;
  reason?: string;
}> {
  const { redemptionId } = job.data;
  
  try {
    if (!redemptionService) {
      throw new Error('Redemption service not initialized');
    }
    
    // Update progress
    await job.progress(10);
    
    logger.info('Processing redemption job', { 
      jobId: job.id, 
      redemptionId
    });
    
    // Process the redemption
    const result = await redemptionService.processRedemption(redemptionId);
    
    // Update progress
    await job.progress(100);
    
    if (result.success) {
      logger.info('Redemption processed successfully', { 
        jobId: job.id,
        redemptionId, 
        status: result.status,
        transactionHash: result.transactionHash 
      });
      
      // Emit event for successful redemption
      eventBus.emit(EventType.REDEMPTION_COMPLETED, {
        redemptionId,
        userId: job.data.userId,
        amount: job.data.amount,
        transactionHash: result.transactionHash
      });
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        status: result.status
      };
    } else {
      logger.warn('Redemption processing failed', { 
        jobId: job.id,
        redemptionId, 
        reason: result.reason 
      });
      
      // Emit event for failed redemption
      eventBus.emit(EventType.REDEMPTION_FAILED, {
        redemptionId,
        userId: job.data.userId,
        amount: job.data.amount,
        reason: result.reason
      });
      
      return {
        success: false,
        reason: result.reason,
        status: result.status
      };
    }
  } catch (error) {
    logger.error('Error processing redemption job', { 
      jobId: job.id, 
      redemptionId, 
      error 
    });
    
    // Emit event for error
    eventBus.emit(EventType.REDEMPTION_FAILED, {
      redemptionId,
      userId: job.data.userId,
      amount: job.data.amount,
      reason: error.message
    });
    
    throw error;
  }
}

/**
 * Process a point award job
 * 
 * @param job The Bull job
 * @returns Result of the processing
 */
export async function processPointsAward(job: Job): Promise<{
  success: boolean;
  pointsId?: string;
  total?: number;
}> {
  const { userId, amount, source, referenceId } = job.data;
  
  try {
    // This is a placeholder for actual points award processing
    // In a real implementation, this would use the points service to award points
    logger.info('Processing points award job', { 
      jobId: job.id,
      userId,
      amount,
      source
    });
    
    // Update progress
    await job.progress(100);
    
    // Return success result
    return {
      success: true,
      pointsId: `points_${Date.now()}`,
      total: 1000 // This would be the actual total
    };
  } catch (error) {
    logger.error('Error processing points award job', { 
      jobId: job.id,
      userId,
      amount,
      source,
      error
    });
    
    throw error;
  }
}

/**
 * Process a point transfer job
 * 
 * @param job The Bull job
 * @returns Result of the processing
 */
export async function processPointsTransfer(job: Job): Promise<{
  success: boolean;
  transferId?: string;
  fromBalance?: number;
  toBalance?: number;
}> {
  const { fromUserId, toUserId, amount, reason } = job.data;
  
  try {
    // This is a placeholder for actual points transfer processing
    // In a real implementation, this would use the points service to transfer points
    logger.info('Processing points transfer job', { 
      jobId: job.id,
      fromUserId,
      toUserId,
      amount,
      reason
    });
    
    // Update progress
    await job.progress(100);
    
    // Return success result
    return {
      success: true,
      transferId: `transfer_${Date.now()}`,
      fromBalance: 950, // This would be the actual from balance
      toBalance: 1050 // This would be the actual to balance
    };
  } catch (error) {
    logger.error('Error processing points transfer job', { 
      jobId: job.id,
      fromUserId,
      toUserId,
      amount,
      reason,
      error
    });
    
    throw error;
  }
}
