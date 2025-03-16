/**
 * Redemption Processor Job
 * 
 * Processes redemption requests from the queue
 */
import { logger } from '../lib/logger';
import { getRedisClient } from '../lib/db-client';
import { eventBus, EventType } from '../lib/event-bus';
import { RedemptionStatus, RedemptionRecord } from '../services/points/redemption-service';

/**
 * Process a single redemption request
 */
async function processRedemption(redemptionId: string): Promise<boolean> {
  const redis = getRedisClient();
  
  try {
    // Get redemption record from Redis
    const data = await redis.get(`redemption:${redemptionId}`);
    if (!data) {
      logger.error('Redemption record not found', { redemptionId });
      return false;
    }
    
    const redemption = JSON.parse(data) as RedemptionRecord;
    
    // Skip if not in pending status
    if (redemption.status !== RedemptionStatus.PENDING) {
      logger.warn('Skipping non-pending redemption', { 
        redemptionId, 
        status: redemption.status 
      });
      return false;
    }
    
    // Update status to processing
    redemption.status = RedemptionStatus.PROCESSING;
    await redis.set(
      `redemption:${redemptionId}`, 
      JSON.stringify(redemption),
      'EX',
      60 * 60 * 24 * 7 // 7 days
    );
    
    // Publish status update event
    await eventBus.publish(EventType.POINTS_REDEEMED, {
      userId: redemption.userId,
      redemptionId: redemption.id,
      status: RedemptionStatus.PROCESSING,
      timestamp: new Date().toISOString()
    });
    
    // Simulate blockchain processing time (3-5 seconds)
    const processingTime = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // In a real implementation, this would:
    // 1. Submit a blockchain transaction to transfer tokens
    // 2. Wait for transaction confirmation
    // 3. Update redemption record with transaction hash
    
    // Simulate blockchain transaction
    const transactionHash = `tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Update redemption status to completed
    redemption.status = RedemptionStatus.COMPLETED;
    redemption.processedAt = new Date();
    redemption.transactionHash = transactionHash;
    
    await redis.set(
      `redemption:${redemptionId}`, 
      JSON.stringify(redemption),
      'EX',
      60 * 60 * 24 * 7 // 7 days
    );
    
    // Publish completion event
    await eventBus.publish(EventType.POINTS_REDEEMED, {
      userId: redemption.userId,
      redemptionId: redemption.id,
      status: RedemptionStatus.COMPLETED,
      transactionHash,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Redemption processed successfully', { 
      redemptionId, 
      transactionHash 
    });
    
    return true;
  } catch (error) {
    logger.error('Error processing redemption', { error, redemptionId });
    
    // Attempt to update status to failed
    try {
      const data = await redis.get(`redemption:${redemptionId}`);
      if (data) {
        const redemption = JSON.parse(data) as RedemptionRecord;
        redemption.status = RedemptionStatus.FAILED;
        redemption.failureReason = error.message || 'Unknown error';
        
        await redis.set(
          `redemption:${redemptionId}`, 
          JSON.stringify(redemption),
          'EX',
          60 * 60 * 24 * 7 // 7 days
        );
        
        // Publish failure event
        await eventBus.publish(EventType.POINTS_REDEEMED, {
          userId: redemption.userId,
          redemptionId: redemption.id,
          status: RedemptionStatus.FAILED,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (updateError) {
      logger.error('Error updating failed redemption status', { 
        error: updateError, 
        redemptionId 
      });
    }
    
    return false;
  }
}

/**
 * Process a batch of redemption requests
 */
export async function processRedemptionBatch(batchSize: number = 10): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const redis = getRedisClient();
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  try {
    // Process up to batchSize redemptions
    for (let i = 0; i < batchSize; i++) {
      // Get next redemption from queue
      const redemptionId = await redis.rpop('redemption:queue');
      if (!redemptionId) {
        // No more redemptions in queue
        break;
      }
      
      processed++;
      
      // Process the redemption
      const success = await processRedemption(redemptionId);
      if (success) {
        successful++;
      } else {
        failed++;
      }
    }
    
    return { processed, successful, failed };
  } catch (error) {
    logger.error('Error processing redemption batch', { error });
    return { processed, successful, failed };
  }
}

/**
 * Start the redemption processor
 */
export function startRedemptionProcessor(
  interval: number = 60000, // Default: run every minute
  batchSize: number = 10
): { stop: () => void } {
  logger.info('Starting redemption processor', { interval, batchSize });
  
  // Run the processor at the specified interval
  const timer = setInterval(async () => {
    try {
      const result = await processRedemptionBatch(batchSize);
      
      if (result.processed > 0) {
        logger.info('Processed redemption batch', { 
          processed: result.processed,
          successful: result.successful,
          failed: result.failed
        });
      }
    } catch (error) {
      logger.error('Error in redemption processor interval', { error });
    }
  }, interval);
  
  // Return a function to stop the processor
  return {
    stop: () => {
      clearInterval(timer);
      logger.info('Stopped redemption processor');
    }
  };
}
