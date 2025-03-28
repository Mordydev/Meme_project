/**
 * Token Transfer Service
 * 
 * Handles token transfers between wallets, including transaction creation,
 * submission, and confirmation monitoring.
 */
import { getBlockchainProviderFactory } from '../../blockchain';
import { 
  BaseBlockchainProvider, 
  TransactionRequest, 
  TransactionResult, 
  TransactionStatus,
  Transaction 
} from '../../blockchain/types';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';

/**
 * Transfer options
 */
export interface TransferOptions {
  memo?: string;
  fee?: string;
  waitForConfirmation?: boolean;
  confirmations?: number;
  timeout?: number;
}

/**
 * Transfer result
 */
export interface TransferResult {
  success: boolean;
  transactionHash: string;
  status: TransactionStatus;
  error?: string;
  confirmation?: {
    blockNumber?: number;
    confirmations: number;
    timestamp?: Date;
  };
}

/**
 * Token transfer service
 */
export class TokenTransferService {
  private readonly DEFAULT_CONFIRMATIONS = 3;
  private readonly DEFAULT_TIMEOUT = 60000; // 1 minute
  private readonly providers: Record<string, BaseBlockchainProvider>;
  
  /**
   * Create token transfer service
   * 
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private readonly eventBus: EventBus
  ) {
    // Initialize blockchain providers
    const providerFactory = getBlockchainProviderFactory();
    this.providers = providerFactory.getAllProviders();
  }

  /**
   * Transfer tokens from treasury to a user
   * 
   * @param recipientAddress Recipient wallet address
   * @param amount Token amount
   * @param options Transfer options
   * @returns Transfer result
   */
  async transferTokens(
    recipientAddress: string,
    amount: number,
    options: TransferOptions = {}
  ): Promise<TransferResult> {
    const provider = this.getProviderForAddress(recipientAddress);
    logger.info('Transferring tokens', { recipientAddress, amount, provider: provider.getName() });
    
    try {
      // Validate recipient address
      if (!provider.isAddressValid(recipientAddress)) {
        throw new Error('Invalid recipient address');
      }
      
      // Validate amount
      if (amount <= 0) {
        throw new Error('Transfer amount must be positive');
      }
      
      // Get treasury address (from environment or configuration)
      const treasuryAddress = process.env.TREASURY_ADDRESS;
      if (!treasuryAddress) {
        throw new Error('Treasury address not configured');
      }
      
      // Create transaction request
      const request: TransactionRequest = {
        fromAddress: treasuryAddress,
        toAddress: recipientAddress,
        amount: amount.toString(),
        fee: options.fee,
        memo: options.memo
      };
      
      // Send transaction
      const transactionResult = await provider.sendTransaction(request);
      
      // Emit event for transaction sent
      await this.eventBus.publish(EventType.TOKEN_TRANSFER_SENT, {
        fromAddress: treasuryAddress,
        toAddress: recipientAddress,
        amount,
        transactionHash: transactionResult.transactionHash
      });
      
      logger.info('Transaction sent', { 
        transactionHash: transactionResult.transactionHash,
        amount,
        recipient: recipientAddress
      });
      
      // Wait for confirmation if requested
      if (options.waitForConfirmation) {
        return this.waitForConfirmation(
          transactionResult.transactionHash,
          provider,
          options.confirmations || this.DEFAULT_CONFIRMATIONS,
          options.timeout || this.DEFAULT_TIMEOUT
        );
      }
      
      // Return immediate result
      return {
        success: true,
        transactionHash: transactionResult.transactionHash,
        status: transactionResult.status
      };
    } catch (error) {
      logger.error('Token transfer failed', { 
        recipientAddress, 
        amount, 
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        transactionHash: '',
        status: TransactionStatus.FAILED,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get transaction status
   * 
   * @param transactionHash Transaction hash
   * @returns Transaction status
   */
  async getTransactionStatus(transactionHash: string): Promise<TransactionStatus> {
    try {
      // Try to find the transaction in each provider
      for (const provider of Object.values(this.providers)) {
        const transaction = await provider.getTransaction(transactionHash);
        if (transaction) {
          return transaction.status;
        }
      }
      
      // If not found, return unknown
      return TransactionStatus.UNKNOWN;
    } catch (error) {
      logger.error('Failed to get transaction status', { transactionHash, error });
      return TransactionStatus.UNKNOWN;
    }
  }

  /**
   * Wait for transaction confirmation
   * 
   * @param transactionHash Transaction hash
   * @param provider Blockchain provider
   * @param confirmations Number of confirmations required
   * @param timeout Timeout in milliseconds
   * @returns Transfer result
   */
  async waitForConfirmation(
    transactionHash: string,
    provider: BaseBlockchainProvider,
    confirmations: number = this.DEFAULT_CONFIRMATIONS,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<TransferResult> {
    logger.info('Waiting for transaction confirmation', { 
      transactionHash, 
      confirmations,
      timeout 
    });
    
    // Create a promise that resolves when confirmed or rejects on timeout
    return new Promise((resolve) => {
      let isResolved = false;
      let checkCount = 0;
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          logger.warn('Transaction confirmation timed out', { transactionHash });
          
          resolve({
            success: true, // Still consider successful as transaction was submitted
            transactionHash,
            status: TransactionStatus.PENDING,
            error: 'Confirmation timeout'
          });
        }
      }, timeout);
      
      // Check status periodically
      const checkStatus = async () => {
        try {
          checkCount++;
          
          // Get transaction
          const transaction = await provider.getTransaction(transactionHash);
          
          // If transaction not found or still pending
          if (!transaction || transaction.status === TransactionStatus.PENDING) {
            if (checkCount < 10) {
              // Continue checking
              setTimeout(checkStatus, 3000); // Check every 3 seconds
            } else {
              // Too many checks, resolve as pending
              clearTimeout(timeoutId);
              
              if (!isResolved) {
                isResolved = true;
                logger.info('Transaction still pending after multiple checks', { transactionHash });
                
                resolve({
                  success: true,
                  transactionHash,
                  status: TransactionStatus.PENDING
                });
              }
            }
            return;
          }
          
          // Transaction confirmed or failed
          clearTimeout(timeoutId);
          
          if (!isResolved) {
            isResolved = true;
            
            if (transaction.status === TransactionStatus.CONFIRMED) {
              logger.info('Transaction confirmed', { transactionHash });
              
              // Emit event for transaction confirmed
              this.eventBus.publish(EventType.TOKEN_TRANSFER_CONFIRMED, {
                transactionHash,
                blockNumber: transaction.blockNumber,
                timestamp: transaction.timestamp
              }).catch(error => {
                logger.error('Failed to publish confirmation event', { transactionHash, error });
              });
              
              resolve({
                success: true,
                transactionHash,
                status: TransactionStatus.CONFIRMED,
                confirmation: {
                  blockNumber: transaction.blockNumber,
                  confirmations,
                  timestamp: transaction.timestamp
                }
              });
            } else {
              logger.warn('Transaction failed', { transactionHash });
              
              resolve({
                success: false,
                transactionHash,
                status: TransactionStatus.FAILED,
                error: 'Transaction failed on blockchain'
              });
            }
          }
        } catch (error) {
          logger.error('Error checking transaction status', { 
            transactionHash, 
            error: error instanceof Error ? error.message : String(error),
            checkCount
          });
          
          // Continue checking
          if (checkCount < 10 && !isResolved) {
            setTimeout(checkStatus, 3000);
          } else {
            // Too many errors, resolve as pending
            clearTimeout(timeoutId);
            
            if (!isResolved) {
              isResolved = true;
              
              resolve({
                success: true,
                transactionHash,
                status: TransactionStatus.PENDING,
                error: 'Error checking status'
              });
            }
          }
        }
      };
      
      // Start checking
      checkStatus();
    });
  }

  /**
   * Get transaction by hash
   * 
   * @param transactionHash Transaction hash
   * @returns Transaction or null if not found
   */
  async getTransaction(transactionHash: string): Promise<Transaction | null> {
    try {
      // Try to find the transaction in each provider
      for (const provider of Object.values(this.providers)) {
        const transaction = await provider.getTransaction(transactionHash);
        if (transaction) {
          return transaction;
        }
      }
      
      // Not found in any provider
      return null;
    } catch (error) {
      logger.error('Failed to get transaction', { transactionHash, error });
      throw error;
    }
  }

  /**
   * Get provider for wallet address
   * 
   * @param address Wallet address
   * @returns Blockchain provider
   */
  private getProviderForAddress(address: string): BaseBlockchainProvider {
    // Use the provider factory to get the appropriate provider
    const providerFactory = getBlockchainProviderFactory();
    return providerFactory.getProviderForAddress(address);
  }
}
