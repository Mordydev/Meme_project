/**
 * Transaction Verification Service
 * 
 * Provides robust verification of blockchain transactions for token redemptions
 * with retry mechanisms and detailed status tracking.
 */
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { getBlockchainProviderManager } from '../../blockchain/providers/provider-manager';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { Transaction } from '../../models/entities/transaction.model';
import { RedemptionStatus } from '../../models/entities/redemption.model';
import { SystemError } from '../../errors';

// Maximum verification attempts for a transaction
const MAX_VERIFICATION_ATTEMPTS = 10;

// Interval between verification attempts (in milliseconds)
const VERIFICATION_INTERVAL = 15000; // 15 seconds

// Default transaction timeout (3 minutes)
const TRANSACTION_TIMEOUT = 3 * 60 * 1000;

/**
 * Transaction verification options
 */
interface VerificationOptions {
  maxAttempts?: number;
  interval?: number;
  timeout?: number;
}

/**
 * Transaction verification result
 */
interface VerificationResult {
  success: boolean;
  transactionId: string;
  redemptionId: string;
  status: string;
  confirmedAt?: Date;
  error?: string;
  attempts: number;
}

/**
 * Transaction verification service
 */
export class TransactionVerificationService {
  private activeVerifications: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Create transaction verification service
   * 
   * @param redemptionRepository Redemption repository
   * @param eventBus Event bus
   */
  constructor(
    private readonly redemptionRepository: RedemptionRepository,
    private readonly eventBus: EventBus
  ) {}
  
  /**
   * Start verification process for a transaction
   * 
   * @param transaction Transaction to verify
   * @param options Verification options
   * @returns Verification result promise
   */
  startVerification(
    transaction: Transaction,
    options: VerificationOptions = {}
  ): Promise<VerificationResult> {
    logger.info('Starting transaction verification', { 
      transactionId: transaction.id, 
      redemptionId: transaction.redemptionId,
      transactionHash: transaction.transactionHash
    });
    
    // Set verification options
    const settings = {
      maxAttempts: options.maxAttempts || MAX_VERIFICATION_ATTEMPTS,
      interval: options.interval || VERIFICATION_INTERVAL,
      timeout: options.timeout || TRANSACTION_TIMEOUT
    };
    
    // Create verification promise
    return new Promise<VerificationResult>((resolve, reject) => {
      // Track verification attempts
      let attempts = 0;
      
      // Create verification timeout
      const timeoutId = setTimeout(() => {
        // Clean up interval if it exists
        if (this.activeVerifications.has(transaction.id)) {
          clearInterval(this.activeVerifications.get(transaction.id)!);
          this.activeVerifications.delete(transaction.id);
        }
        
        // Update redemption status to failed
        this.updateRedemptionStatus(
          transaction.redemptionId, 
          'failed',
          { error: 'Transaction verification timed out' }
        ).catch(error => {
          logger.error('Failed to update redemption status', {
            redemptionId: transaction.redemptionId,
            error
          });
        });
        
        // Resolve with failure
        resolve({
          success: false,
          transactionId: transaction.id,
          redemptionId: transaction.redemptionId,
          status: 'timeout',
          error: 'Transaction verification timed out',
          attempts
        });
      }, settings.timeout);
      
      // Create verification interval
      const intervalId = setInterval(async () => {
        try {
          attempts++;
          
          // Update verification attempt count
          await this.redemptionRepository.updateTransactionAttempts(
            transaction.id,
            attempts
          );
          
          // Get transaction status from blockchain
          const blockchainManager = getBlockchainProviderManager();
          const txStatus = await blockchainManager.getTransaction(
            transaction.transactionHash!
          );
          
          logger.debug('Transaction verification attempt', {
            transactionId: transaction.id,
            redemptionId: transaction.redemptionId,
            attempt: attempts,
            status: txStatus?.status
          });
          
          // If transaction is confirmed
          if (txStatus && txStatus.status === 'confirmed') {
            // Clear timeout and interval
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            this.activeVerifications.delete(transaction.id);
            
            // Update transaction status
            const confirmedAt = new Date();
            await this.redemptionRepository.updateTransactionStatus(
              transaction.id,
              'confirmed',
              { 
                confirmedAt,
                confirmations: txStatus.confirmations || 1
              }
            );
            
            // Update redemption status
            await this.updateRedemptionStatus(
              transaction.redemptionId,
              'completed',
              {
                completedAt: confirmedAt,
                transactionDetail: {
                  blockNumber: txStatus.blockNumber,
                  confirmations: txStatus.confirmations,
                  fee: txStatus.fee
                }
              }
            );
            
            // Emit event
            await this.eventBus.publish(EventType.REDEMPTION_COMPLETED, {
              redemptionId: transaction.redemptionId,
              transactionId: transaction.id,
              transactionHash: transaction.transactionHash,
              confirmedAt
            });
            
            // Resolve with success
            resolve({
              success: true,
              transactionId: transaction.id,
              redemptionId: transaction.redemptionId,
              status: 'confirmed',
              confirmedAt,
              attempts
            });
          } 
          // If transaction is failed
          else if (txStatus && txStatus.status === 'failed') {
            // Clear timeout and interval
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            this.activeVerifications.delete(transaction.id);
            
            // Update transaction status
            await this.redemptionRepository.updateTransactionStatus(
              transaction.id,
              'failed',
              { 
                error: txStatus.error || 'Transaction failed on blockchain'
              }
            );
            
            // Update redemption status
            await this.updateRedemptionStatus(
              transaction.redemptionId,
              'failed',
              {
                error: txStatus.error || 'Transaction failed on blockchain'
              }
            );
            
            // Emit event
            await this.eventBus.publish(EventType.REDEMPTION_FAILED, {
              redemptionId: transaction.redemptionId,
              transactionId: transaction.id,
              transactionHash: transaction.transactionHash,
              error: txStatus.error || 'Transaction failed on blockchain'
            });
            
            // Resolve with failure
            resolve({
              success: false,
              transactionId: transaction.id,
              redemptionId: transaction.redemptionId,
              status: 'failed',
              error: txStatus.error || 'Transaction failed on blockchain',
              attempts
            });
          }
          // If max attempts reached
          else if (attempts >= settings.maxAttempts) {
            // Clear timeout and interval
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            this.activeVerifications.delete(transaction.id);
            
            // Update transaction status
            await this.redemptionRepository.updateTransactionStatus(
              transaction.id,
              'unconfirmed',
              { 
                error: 'Max verification attempts reached without confirmation'
              }
            );
            
            // Update redemption status to pending manual verification
            await this.updateRedemptionStatus(
              transaction.redemptionId,
              'pending_review',
              {
                reviewReason: 'Transaction unconfirmed after maximum verification attempts'
              }
            );
            
            // Emit event
            await this.eventBus.publish(EventType.REDEMPTION_REQUIRES_REVIEW, {
              redemptionId: transaction.redemptionId,
              transactionId: transaction.id,
              transactionHash: transaction.transactionHash,
              reason: 'Max verification attempts reached'
            });
            
            // Resolve with warning status
            resolve({
              success: false,
              transactionId: transaction.id,
              redemptionId: transaction.redemptionId,
              status: 'unconfirmed',
              error: 'Transaction unconfirmed after maximum verification attempts',
              attempts
            });
          }
          // Continue verification
        } catch (error) {
          logger.error('Error during transaction verification', {
            transactionId: transaction.id,
            redemptionId: transaction.redemptionId,
            attempt: attempts,
            error: error instanceof Error ? error.message : String(error)
          });
          
          // If error is fatal or max attempts reached
          if (attempts >= settings.maxAttempts) {
            // Clear timeout and interval
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            this.activeVerifications.delete(transaction.id);
            
            // Update transaction status
            await this.redemptionRepository.updateTransactionStatus(
              transaction.id,
              'error',
              { 
                error: error instanceof Error ? error.message : String(error)
              }
            );
            
            // Update redemption status
            await this.updateRedemptionStatus(
              transaction.redemptionId,
              'pending_review',
              {
                reviewReason: 'Transaction verification error'
              }
            );
            
            // Emit event
            await this.eventBus.publish(EventType.REDEMPTION_REQUIRES_REVIEW, {
              redemptionId: transaction.redemptionId,
              transactionId: transaction.id,
              transactionHash: transaction.transactionHash,
              reason: 'Verification error'
            });
            
            // Resolve with error
            resolve({
              success: false,
              transactionId: transaction.id,
              redemptionId: transaction.redemptionId,
              status: 'error',
              error: error instanceof Error ? error.message : String(error),
              attempts
            });
          }
          // Otherwise continue verification
        }
      }, settings.interval);
      
      // Store interval for cleanup
      this.activeVerifications.set(transaction.id, intervalId);
    });
  }
  
  /**
   * Stop verification for a transaction
   * 
   * @param transactionId Transaction ID
   * @returns True if verification was stopped
   */
  stopVerification(transactionId: string): boolean {
    if (this.activeVerifications.has(transactionId)) {
      clearInterval(this.activeVerifications.get(transactionId)!);
      this.activeVerifications.delete(transactionId);
      
      logger.info('Stopped transaction verification', { transactionId });
      return true;
    }
    return false;
  }
  
  /**
   * Check if verification is active for a transaction
   * 
   * @param transactionId Transaction ID
   * @returns True if verification is active
   */
  isVerificationActive(transactionId: string): boolean {
    return this.activeVerifications.has(transactionId);
  }
  
  /**
   * Update redemption status
   * 
   * @param redemptionId Redemption ID
   * @param status New status
   * @param data Additional data
   * @returns Updated redemption
   */
  private async updateRedemptionStatus(
    redemptionId: string,
    status: RedemptionStatus,
    data: any = {}
  ) {
    try {
      return await this.redemptionRepository.updateRedemptionStatus(
        redemptionId,
        status,
        data
      );
    } catch (error) {
      logger.error('Failed to update redemption status', {
        redemptionId,
        status,
        error
      });
      
      throw new SystemError(`Failed to update redemption status: ${
        error instanceof Error ? error.message : String(error)
      }`);
    }
  }
  
  /**
   * Get active verification count
   * 
   * @returns Number of active verifications
   */
  getActiveVerificationCount(): number {
    return this.activeVerifications.size;
  }
}
