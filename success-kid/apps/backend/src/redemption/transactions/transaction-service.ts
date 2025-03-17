/**
 * Redemption Transaction Service
 * 
 * Handles the blockchain transaction aspects of redemption processing.
 */
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { EventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { getBlockchainProviderFactory } from '../../blockchain';
import { NotFoundError, BlockchainError } from '../../errors';
import { RedemptionTransaction } from '../../models/entities/redemption.model';
import { TransactionType, TransactionStatus, TransactionRequest } from '../../blockchain/types';
import { IdempotencyService } from './idempotency-service';

/**
 * Transaction processing result
 */
interface ProcessResult {
  success: boolean;
  status?: string;
  txHash?: string;
  reason?: string;
}

/**
 * Handles the blockchain transactions for token redemptions
 */
export class TransactionService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE_MS = 30000; // 30 seconds
  
  /**
   * Create a new TransactionService
   * 
   * @param redemptionRepository Repository for redemption data
   * @param eventBus Event bus for publishing events
   * @param idempotencyService Service for ensuring idempotency
   */
  constructor(
    private redemptionRepository: RedemptionRepository,
    private eventBus: EventBus,
    private idempotencyService: IdempotencyService
  ) {}

  /**
   * Queue a transaction for processing
   * 
   * @param transactionId Transaction ID to queue
   * @returns Success indicator
   */
  async queueTransaction(transactionId: string): Promise<boolean> {
    try {
      // This would typically add the transaction to a job queue
      // For simplicity, we'll just mark it as queued and process it in the background
      
      logger.info('Transaction queued for processing', { transactionId });
      
      // In a production system, this would be a background job
      // For now, we'll process it immediately for demonstration
      setTimeout(() => {
        this.processTransaction(transactionId).catch(error => {
          logger.error('Error processing transaction', { transactionId, error });
        });
      }, 100);
      
      return true;
    } catch (error) {
      logger.error('Failed to queue transaction', { transactionId, error });
      return false;
    }
  }

  /**
   * Process a transaction
   * 
   * @param transactionId Transaction ID to process
   * @returns Processing result
   */
  async processTransaction(transactionId: string): Promise<ProcessResult> {
    // Check for idempotency
    const idempotencyKey = `redemption:process:${transactionId}`;
    const existingResult = await this.idempotencyService.getOperationResult(idempotencyKey);
    
    if (existingResult) {
      return existingResult as ProcessResult;
    }
    
    try {
      // Begin operation
      await this.idempotencyService.beginOperation(idempotencyKey);
      
      // Get transaction record
      const transaction = await this.getTransactionById(transactionId);
      
      // Get redemption record
      const redemption = await this.redemptionRepository.findById(transaction.redemption_id);
      
      if (!redemption) {
        const result = { 
          success: false, 
          reason: 'Redemption not found'
        };
        await this.idempotencyService.failOperation(idempotencyKey, new Error(result.reason));
        return result;
      }
      
      // Validate state
      if (redemption.status !== 'processing') {
        const result = {
          success: false,
          reason: `Invalid redemption status: ${redemption.status}`
        };
        await this.idempotencyService.failOperation(idempotencyKey, new Error(result.reason));
        return result;
      }
      
      // Update transaction attempts and time
      await this.redemptionRepository.updateRedemptionTransaction(transactionId, {
        attempts: transaction.attempts + 1,
        last_attempt: new Date(),
        status: 'processing'
      });
      
      try {
        // Get blockchain provider
        const providerFactory = getBlockchainProviderFactory();
        const provider = providerFactory.getProviderForAddress(redemption.wallet_address);
        
        // Create transaction request
        const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
        if (!treasuryAddress) {
          throw new Error('Treasury wallet address not configured');
        }
        
        // Estimate fee
        const feeEstimate = await provider.estimateFee({
          fromAddress: treasuryAddress,
          toAddress: redemption.wallet_address,
          amount: redemption.token_amount.toString()
        });
        
        // Create transaction request
        const txRequest: TransactionRequest = {
          fromAddress: treasuryAddress,
          toAddress: redemption.wallet_address,
          amount: redemption.token_amount.toString(),
          token: process.env.TOKEN_ADDRESS,
          fee: feeEstimate.medium // Use medium fee for balance between cost and speed
        };
        
        // Submit transaction
        const txResult = await provider.sendTransaction(txRequest);
        
        // Update transaction record
        await this.redemptionRepository.updateRedemptionTransaction(transactionId, {
          transaction_hash: txResult.transactionHash,
          status: 'completed',
          completed_at: new Date()
        });
        
        // Update redemption record
        await this.redemptionRepository.updateRedemptionStatus(
          redemption.id,
          'pending_confirmation',
          {
            transaction_hash: txResult.transactionHash
          }
        );
        
        // Emit event
        await this.eventBus.publish(EventType.REDEMPTION_PROCESSING, {
          userId: redemption.user_id,
          redemptionId: redemption.id,
          transactionHash: txResult.transactionHash,
          timestamp: new Date()
        });
        
        logger.info('Transaction submitted successfully', {
          transactionId,
          redemptionId: redemption.id,
          txHash: txResult.transactionHash
        });
        
        // Start monitoring for confirmation
        this.monitorTransaction(redemption.id, txResult.transactionHash);
        
        const result = { 
          success: true, 
          status: 'pending_confirmation',
          txHash: txResult.transactionHash
        };
        
        await this.idempotencyService.completeOperation(idempotencyKey, result);
        return result;
      } catch (error) {
        logger.error('Error submitting blockchain transaction', {
          transactionId,
          redemptionId: redemption.id,
          error: error instanceof Error ? error.message : String(error),
          attempt: transaction.attempts + 1
        });
        
        // Check if we should retry
        if (transaction.attempts + 1 < this.MAX_RETRIES) {
          // Mark as failed but available for retry
          await this.redemptionRepository.updateRedemptionTransaction(transactionId, {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
          
          // Schedule retry with exponential backoff
          const delayMs = this.RETRY_DELAY_BASE_MS * Math.pow(2, transaction.attempts);
          setTimeout(() => {
            this.queueTransaction(transactionId).catch(err => {
              logger.error('Failed to requeue transaction', { transactionId, error: err });
            });
          }, delayMs);
          
          const result = { 
            success: false, 
            reason: `Transaction failed, will retry in ${delayMs / 1000} seconds`
          };
          
          await this.idempotencyService.failOperation(idempotencyKey, new Error(result.reason));
          return result;
        } else {
          // Mark as permanently failed
          await this.redemptionRepository.updateRedemptionTransaction(transactionId, {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
          
          // Update redemption status
          await this.redemptionRepository.updateRedemptionStatus(
            redemption.id,
            'failed',
            {
              error: `Transaction failed after ${this.MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`
            }
          );
          
          // Emit event
          await this.eventBus.publish(EventType.REDEMPTION_FAILED, {
            userId: redemption.user_id,
            redemptionId: redemption.id,
            reason: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          });
          
          const result = { 
            success: false, 
            reason: `Transaction failed after ${this.MAX_RETRIES} attempts` 
          };
          
          await this.idempotencyService.failOperation(idempotencyKey, new Error(result.reason));
          return result;
        }
      }
    } catch (error) {
      logger.error('Error processing transaction', { transactionId, error });
      
      const result = { 
        success: false, 
        reason: error instanceof Error ? error.message : String(error)
      };
      
      await this.idempotencyService.failOperation(idempotencyKey, error instanceof Error ? error : new Error(String(error)));
      return result;
    }
  }

  /**
   * Monitor a transaction for confirmation
   * 
   * @param redemptionId Redemption ID
   * @param txHash Transaction hash
   */
  private async monitorTransaction(redemptionId: string, txHash: string): Promise<void> {
    try {
      // In a production system, this would be a separate process or job
      // For simplicity, we'll use setTimeout to simulate monitoring
      
      // Get blockchain provider
      const providerFactory = getBlockchainProviderFactory();
      
      // Wait a bit for transaction to propagate
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get transaction status
      const txData = await providerFactory.getProvider('solana').getTransaction(txHash);
      
      if (!txData) {
        // Transaction not found yet, wait longer
        logger.info('Transaction not found yet, will check again', { redemptionId, txHash });
        
        // Check again in 30 seconds
        setTimeout(() => {
          this.monitorTransaction(redemptionId, txHash).catch(error => {
            logger.error('Error monitoring transaction', { redemptionId, txHash, error });
          });
        }, 30000);
        
        return;
      }
      
      if (txData.status === TransactionStatus.CONFIRMED) {
        // Transaction confirmed
        await this.processConfirmedTransaction(redemptionId, txHash);
      } else if (txData.status === TransactionStatus.FAILED) {
        // Transaction failed
        await this.processFailedTransaction(redemptionId, txHash, 'Transaction failed on blockchain');
      } else {
        // Transaction still pending
        logger.info('Transaction still pending, will check again', { redemptionId, txHash });
        
        // Check again in 30 seconds
        setTimeout(() => {
          this.monitorTransaction(redemptionId, txHash).catch(error => {
            logger.error('Error monitoring transaction', { redemptionId, txHash, error });
          });
        }, 30000);
      }
    } catch (error) {
      logger.error('Error monitoring transaction', { redemptionId, txHash, error });
      
      // Check again in 30 seconds
      setTimeout(() => {
        this.monitorTransaction(redemptionId, txHash).catch(error => {
          logger.error('Error monitoring transaction', { redemptionId, txHash, error });
        });
      }, 30000);
    }
  }

  /**
   * Process a confirmed transaction
   * 
   * @param redemptionId Redemption ID
   * @param txHash Transaction hash
   */
  private async processConfirmedTransaction(redemptionId: string, txHash: string): Promise<void> {
    try {
      // Update redemption status
      const redemption = await this.redemptionRepository.updateRedemptionStatus(
        redemptionId,
        'completed',
        {
          transaction_hash: txHash,
          completed_at: new Date()
        }
      );
      
      // Emit event
      await this.eventBus.publish(EventType.REDEMPTION_COMPLETED, {
        userId: redemption.user_id,
        redemptionId: redemption.id,
        transactionHash: txHash,
        pointsAmount: redemption.points_amount,
        tokenAmount: redemption.token_amount,
        timestamp: new Date()
      });
      
      logger.info('Redemption completed successfully', {
        redemptionId,
        txHash,
        userId: redemption.user_id
      });
    } catch (error) {
      logger.error('Error processing confirmed transaction', { redemptionId, txHash, error });
    }
  }

  /**
   * Process a failed transaction
   * 
   * @param redemptionId Redemption ID
   * @param txHash Transaction hash
   * @param reason Failure reason
   */
  private async processFailedTransaction(redemptionId: string, txHash: string, reason: string): Promise<void> {
    try {
      // Update redemption status
      const redemption = await this.redemptionRepository.updateRedemptionStatus(
        redemptionId,
        'failed',
        {
          transaction_hash: txHash,
          error: reason
        }
      );
      
      // Emit event
      await this.eventBus.publish(EventType.REDEMPTION_FAILED, {
        userId: redemption.user_id,
        redemptionId: redemption.id,
        transactionHash: txHash,
        reason,
        timestamp: new Date()
      });
      
      logger.error('Redemption failed', {
        redemptionId,
        txHash,
        userId: redemption.user_id,
        reason
      });
    } catch (error) {
      logger.error('Error processing failed transaction', { redemptionId, txHash, reason, error });
    }
  }

  /**
   * Retry a failed transaction
   * 
   * @param transactionId Transaction ID to retry
   * @returns Result of retry operation
   */
  async retryTransaction(transactionId: string): Promise<ProcessResult> {
    try {
      const transaction = await this.getTransactionById(transactionId);
      
      if (transaction.status !== 'failed') {
        return {
          success: false,
          reason: `Cannot retry transaction with status: ${transaction.status}`
        };
      }
      
      // Reset transaction status
      await this.redemptionRepository.updateRedemptionTransaction(transactionId, {
        status: 'pending',
        error: null
      });
      
      // Queue for processing
      await this.queueTransaction(transactionId);
      
      return {
        success: true,
        status: 'queued'
      };
    } catch (error) {
      logger.error('Error retrying transaction', { transactionId, error });
      
      return {
        success: false,
        reason: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get a transaction by ID
   * 
   * @param transactionId Transaction ID
   * @returns Transaction record
   */
  private async getTransactionById(transactionId: string): Promise<RedemptionTransaction> {
    // In a real implementation, this would fetch from the database
    // For now, let's simulate by creating a new record
    
    // Find transactions that need processing
    const transactions = await this.redemptionRepository.findPendingTransactions(1);
    
    if (transactions.length === 0) {
      throw new NotFoundError('Transaction not found');
    }
    
    return transactions[0];
  }
}
