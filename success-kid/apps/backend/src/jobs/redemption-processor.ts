/**
 * Redemption Processor Job
 * 
 * Processes redemption requests from the queue and handles blockchain transactions
 */
import { logger } from '../lib/logger';
import { getRedisClient } from '../lib/db-client';
import { getDbClient } from '../lib/db-client';
import { eventBus, EventType } from '../lib/event-bus';
import { RedemptionService, RedemptionStatus } from '../services/points/redemption-service';
import { TokenTransferService } from '../services/blockchain/token-transfer-service';
import { BlockchainProviderFactory } from '../services/blockchain/providers/blockchain-provider-factory';
import { UserPointsRepository } from '../repositories/user-points/user-points-repository';
import { WalletConnectionRepository } from '../repositories/wallet-connection-repository';
import { RedemptionRepository } from '../repositories/redemption-repository';

// Services will be initialized in the processor
let redemptionService: RedemptionService;
let tokenTransferService: TokenTransferService;

/**
 * Initialize services needed for processing
 */
async function initializeServices() {
  if (!redemptionService) {
    const db = getDbClient();
    const redis = getRedisClient();
    
    // Create repositories
    const userPointsRepository = new UserPointsRepository(db);
    const walletConnectionRepository = new WalletConnectionRepository(db);
    const redemptionRepository = new RedemptionRepository(db);
    
    // Create blockchain services
    const providerFactory = new BlockchainProviderFactory(
      process.env.BLOCKCHAIN_PROVIDER_URLS?.split(',') || [],
      process.env.TOKEN_ADDRESS || '',
      process.env.TREASURY_PRIVATE_KEY || ''
    );
    
    tokenTransferService = new TokenTransferService(
      providerFactory,
      {
        treasuryAddress: process.env.TREASURY_ADDRESS || '',
        tokenAddress: process.env.TOKEN_ADDRESS || '',
        tokenDecimals: parseInt(process.env.TOKEN_DECIMALS || '9', 10),
        minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '1', 10),
        gasMultiplier: parseFloat(process.env.GAS_MULTIPLIER || '1.1'),
        providerUrls: process.env.BLOCKCHAIN_PROVIDER_URLS?.split(',') || [],
        blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || '',
        waitTimeoutMs: parseInt(process.env.TRANSACTION_WAIT_TIMEOUT || '60000', 10)
      }
    );
    
    // Create redemption service
    redemptionService = new RedemptionService(
      db,
      userPointsRepository,
      walletConnectionRepository,
      redemptionRepository,
      tokenTransferService,
      {
        conversionRate: parseInt(process.env.POINTS_TO_TOKEN_RATE || '100', 10),
        minimumRedemptionAmount: parseInt(process.env.MIN_REDEMPTION_AMOUNT || '1000', 10),
        weeklyRedemptionCap: parseInt(process.env.WEEKLY_REDEMPTION_CAP || '10000', 10),
        autoApproveThreshold: parseInt(process.env.AUTO_APPROVE_THRESHOLD || '5000', 10),
        processingTime: process.env.ESTIMATED_PROCESSING_TIME || '24 hours'
      }
    );
  }
}

/**
 * Process a single redemption request from the queue
 */
async function processRedemption(redemptionId: string): Promise<boolean> {
  try {
    // Ensure services are initialized
    await initializeServices();
    
    // Process the redemption
    const result = await redemptionService.processRedemption(redemptionId);
    
    if (result.success) {
      logger.info('Redemption processed successfully', { 
        redemptionId, 
        status: result.status,
        transactionHash: result.transactionHash 
      });
      return true;
    } else {
      logger.warn('Redemption processing failed', { 
        redemptionId, 
        reason: result.reason 
      });
      return false;
    }
  } catch (error) {
    logger.error('Error processing redemption', { error, redemptionId });
    return false;
  }
}

/**
 * Check status of processing redemptions
 * This runs periodically to update the status of transactions
 * that are in processing state
 */
export async function checkProcessingRedemptions(): Promise<{
  checked: number;
  completed: number;
  failed: number;
  stillProcessing: number;
}> {
  try {
    // Ensure services are initialized
    await initializeServices();
    
    const redis = getRedisClient();
    
    // Get all processing redemption IDs
    const processingKey = 'redemption:processing';
    const processingIds = await redis.smembers(processingKey);
    
    let completed = 0;
    let failed = 0;
    let stillProcessing = 0;
    
    // Check each redemption
    for (const redemptionId of processingIds) {
      try {
        // Get current status
        const status = await redemptionService.getRedemptionStatus(redemptionId);
        
        if (!status) {
          // Redemption not found, remove from set
          await redis.srem(processingKey, redemptionId);
          continue;
        }
        
        if (status.status === RedemptionStatus.COMPLETED) {
          // Completed, remove from processing set
          await redis.srem(processingKey, redemptionId);
          completed++;
        } else if (status.status === RedemptionStatus.FAILED) {
          // Failed, remove from processing set
          await redis.srem(processingKey, redemptionId);
          failed++;
        } else if (status.status === RedemptionStatus.PROCESSING) {
          // Still processing, check transaction status
          await redemptionService.checkTransactionStatus(redemptionId);
          stillProcessing++;
        } else {
          // Shouldn't happen, but remove from processing set just in case
          await redis.srem(processingKey, redemptionId);
        }
      } catch (error) {
        logger.error('Error checking redemption status', { error, redemptionId });
      }
    }
    
    return {
      checked: processingIds.length,
      completed,
      failed,
      stillProcessing
    };
  } catch (error) {
    logger.error('Error checking processing redemptions', { error });
    return {
      checked: 0,
      completed: 0,
      failed: 0,
      stillProcessing: 0
    };
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
    
    // Check processing redemptions status
    await checkProcessingRedemptions();
    
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
  batchSize: number = 10,
  statusCheckInterval: number = 300000 // Check processing status every 5 minutes
): { stop: () => void } {
  logger.info('Starting redemption processor', { 
    interval, 
    batchSize, 
    statusCheckInterval 
  });
  
  // Initialize services
  initializeServices()
    .then(() => logger.info('Redemption processor services initialized'))
    .catch(error => logger.error('Error initializing redemption processor services', { error }));
  
  // Run the processor at the specified interval
  const processingTimer = setInterval(async () => {
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
  
  // Run status check at the specified interval
  const statusTimer = setInterval(async () => {
    try {
      const result = await checkProcessingRedemptions();
      
      if (result.checked > 0) {
        logger.info('Checked processing redemptions', { 
          checked: result.checked,
          completed: result.completed,
          failed: result.failed,
          stillProcessing: result.stillProcessing
        });
      }
    } catch (error) {
      logger.error('Error in redemption status check interval', { error });
    }
  }, statusCheckInterval);
  
  // Return a function to stop the processor
  return {
    stop: () => {
      clearInterval(processingTimer);
      clearInterval(statusTimer);
      logger.info('Stopped redemption processor');
    }
  };
}
