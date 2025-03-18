/**
 * Transaction Service for Points Redemption
 * 
 * Handles the creation, submission, and monitoring of blockchain transactions
 * for converting Success Points to SKC tokens.
 */
import { logger } from '../../lib/logger';
import { providerManager } from '../../blockchain/providers';
import { SolanaNetwork } from '../../blockchain/types';
import { RedemptionTransaction, RedemptionStatus, TransactionReceipt } from '../models/redemption';
import { EventEmitter } from 'events';
import { config } from '../../config';
import { v4 as uuidv4 } from 'uuid';
import { cache } from '../../lib/cache';

/**
 * Transaction Service for points redemption
 */
export class TransactionService {
  // Event emitter for transaction status updates
  private readonly eventEmitter = new EventEmitter();
  
  // Transaction tracking maps
  private pendingTransactions: Map<string, RedemptionTransaction> = new Map();
  private transactionMonitors: Map<string, NodeJS.Timeout> = new Map();
  
  // Configuration
  private readonly TOKEN_DECIMALS = 9; // SKC token decimals
  private readonly MAX_CONFIRMATION_CHECKS = 30; // Maximum number of checks for confirmation
  private readonly CHECK_INTERVAL = 5000; // 5 seconds between checks
  private readonly TRANSACTION_CACHE_TTL = 86400; // 24 hour cache for transactions
  
  // Treasury wallet (from where tokens are distributed)
  private readonly treasuryWallet = config.get('blockchain.treasuryWallet');
  
  constructor() {
    // Set max listeners to prevent memory leak warnings
    this.eventEmitter.setMaxListeners(100);
    
    // Load pending transactions from cache
    this.loadPendingTransactions();
    
    // Set up transaction monitoring
    this.setupTransactionMonitoring();
  }
  
  /**
   * Load pending transactions from cache or database
   */
  private async loadPendingTransactions(): Promise<void> {
    try {
      // In a production system, this would load from a database
      // For now, we'll use a simple cache
      const pendingTransactionIds = cache.get<string[]>('redemption:pending_transactions') || [];
      
      for (const id of pendingTransactionIds) {
        const transaction = cache.get<RedemptionTransaction>(`redemption:transaction:${id}`);
        if (transaction) {
          this.pendingTransactions.set(transaction.id, transaction);
          
          // Start monitoring for transaction that needs it
          if (transaction.status === RedemptionStatus.PENDING_CONFIRMATION) {
            this.monitorTransaction(transaction);
          }
        }
      }
      
      logger.info(`Loaded ${this.pendingTransactions.size} pending transactions`);
    } catch (error) {
      logger.error('Error loading pending transactions', { error });
    }
  }
  
  /**
   * Set up transaction monitoring
   */
  private setupTransactionMonitoring(): void {
    // Periodically check for stalled transactions
    setInterval(() => {
      this.checkStalledTransactions();
    }, 60000); // Every minute
  }
  
  /**
   * Check for stalled transactions
   */
  private async checkStalledTransactions(): Promise<void> {
    try {
      const now = new Date();
      const stalledTransactions: RedemptionTransaction[] = [];
      
      // Find transactions that have been pending for too long
      for (const transaction of this.pendingTransactions.values()) {
        const createdTime = new Date(transaction.createdAt).getTime();
        const elapsedMinutes = (now.getTime() - createdTime) / (1000 * 60);
        
        // If processing and older than 15 minutes
        if (transaction.status === RedemptionStatus.PROCESSING && elapsedMinutes > 15) {
          stalledTransactions.push(transaction);
        }
        
        // If pending confirmation and older than 30 minutes
        if (transaction.status === RedemptionStatus.PENDING_CONFIRMATION && elapsedMinutes > 30) {
          stalledTransactions.push(transaction);
        }
      }
      
      // Handle stalled transactions
      for (const transaction of stalledTransactions) {
        // For processing transactions, check if they were submitted
        if (transaction.status === RedemptionStatus.PROCESSING) {
          await this.handleStalledProcessingTransaction(transaction);
        }
        
        // For pending confirmation, check one more time
        if (transaction.status === RedemptionStatus.PENDING_CONFIRMATION) {
          await this.checkTransactionConfirmation(transaction);
        }
      }
    } catch (error) {
      logger.error('Error checking stalled transactions', { error });
    }
  }
  
  /**
   * Handle a stalled processing transaction
   * 
   * @param transaction Stalled transaction
   */
  private async handleStalledProcessingTransaction(transaction: RedemptionTransaction): Promise<void> {
    logger.warn('Found stalled processing transaction', { 
      id: transaction.id, 
      walletAddress: transaction.walletAddress
    });
    
    // In a real system, this would trigger an alert and possibly retry the transaction
    // For now, we'll mark it as failed and refund the points
    await this.updateTransactionStatus(transaction.id, {
      status: RedemptionStatus.FAILED,
      error: 'Transaction processing timeout',
      completedAt: new Date()
    });
    
    // Emit transaction failed event to trigger refund
    this.eventEmitter.emit('transaction:failed', transaction);
  }
  
  /**
   * Create a new redemption transaction
   * 
   * @param redemptionId Redemption ID
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param pointsAmount Points amount
   * @param tokenAmount Token amount
   * @returns Created transaction
   */
  async createTransaction(
    redemptionId: string,
    userId: string,
    walletAddress: string,
    pointsAmount: number,
    tokenAmount: number
  ): Promise<RedemptionTransaction> {
    // Create transaction object
    const transaction: RedemptionTransaction = {
      id: uuidv4(),
      redemptionId,
      userId,
      walletAddress,
      pointsAmount,
      tokenAmount,
      status: RedemptionStatus.PENDING,
      createdAt: new Date()
    };
    
    // Save to pending transactions
    this.pendingTransactions.set(transaction.id, transaction);
    
    // Save to cache
    cache.set(`redemption:transaction:${transaction.id}`, transaction, this.TRANSACTION_CACHE_TTL);
    
    // Update pending transactions list
    const pendingTransactionIds = Array.from(this.pendingTransactions.keys());
    cache.set('redemption:pending_transactions', pendingTransactionIds, this.TRANSACTION_CACHE_TTL);
    
    // Log transaction creation
    logger.info('Created redemption transaction', { 
      id: transaction.id, 
      redemptionId,
      userId, 
      walletAddress
    });
    
    return transaction;
  }
  
  /**
   * Process a redemption transaction
   * 
   * @param transactionId Transaction ID
   * @returns Updated transaction
   */
  async processTransaction(transactionId: string): Promise<RedemptionTransaction> {
    const transaction = this.pendingTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    
    // Update status to processing
    await this.updateTransactionStatus(transactionId, {
      status: RedemptionStatus.PROCESSING,
      processedAt: new Date()
    });
    
    try {
      // Validate transaction preconditions
      await this.validateTransaction(transaction);
      
      // Create and send blockchain transaction
      const txHash = await this.sendTokenTransaction(
        transaction.walletAddress,
        transaction.tokenAmount
      );
      
      // Update transaction with hash
      await this.updateTransactionStatus(transactionId, {
        status: RedemptionStatus.PENDING_CONFIRMATION,
        transactionHash: txHash
      });
      
      // Start monitoring transaction
      this.monitorTransaction(transaction);
      
      // Return updated transaction
      return this.pendingTransactions.get(transactionId)!;
    } catch (error) {
      logger.error('Error processing transaction', { 
        transactionId, 
        error
      });
      
      // Mark as failed
      await this.updateTransactionStatus(transactionId, {
        status: RedemptionStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date()
      });
      
      // Emit transaction failed event
      this.eventEmitter.emit('transaction:failed', transaction);
      
      throw error;
    }
  }
  
  /**
   * Update transaction status
   * 
   * @param transactionId Transaction ID
   * @param updates Status updates
   * @returns Updated transaction
   */
  private async updateTransactionStatus(
    transactionId: string,
    updates: Partial<RedemptionTransaction>
  ): Promise<RedemptionTransaction> {
    const transaction = this.pendingTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    
    // Update transaction
    const updatedTransaction = {
      ...transaction,
      ...updates
    };
    
    // Save updated transaction
    this.pendingTransactions.set(transactionId, updatedTransaction);
    
    // Update cache
    cache.set(`redemption:transaction:${transactionId}`, updatedTransaction, this.TRANSACTION_CACHE_TTL);
    
    // If completed (success or failure), remove from pending list
    if (updatedTransaction.status === RedemptionStatus.COMPLETED || 
        updatedTransaction.status === RedemptionStatus.FAILED) {
      
      this.pendingTransactions.delete(transactionId);
      
      // Update pending transactions list
      const pendingTransactionIds = Array.from(this.pendingTransactions.keys());
      cache.set('redemption:pending_transactions', pendingTransactionIds, this.TRANSACTION_CACHE_TTL);
    }
    
    // Emit status update event
    this.eventEmitter.emit('transaction:update', updatedTransaction);
    
    // Log status update
    logger.info('Updated transaction status', { 
      transactionId, 
      status: updatedTransaction.status,
      previousStatus: transaction.status
    });
    
    return updatedTransaction;
  }
  
  /**
   * Validate transaction preconditions
   * 
   * @param transaction Transaction to validate
   */
  private async validateTransaction(transaction: RedemptionTransaction): Promise<void> {
    // Check wallet address validity
    if (!this.isValidWalletAddress(transaction.walletAddress)) {
      throw new Error('Invalid wallet address');
    }
    
    // Check transaction validity
    if (transaction.tokenAmount <= 0) {
      throw new Error('Invalid token amount');
    }
    
    // Check treasury balance (in a real implementation)
    // This is a placeholder for actual balance checking
    const treasuryBalance = 1000000; // 1M tokens
    
    if (treasuryBalance < transaction.tokenAmount) {
      throw new Error('Insufficient treasury balance');
    }
  }
  
  /**
   * Check if wallet address is valid
   * 
   * @param address Wallet address to check
   * @returns True if address is valid
   */
  private isValidWalletAddress(address: string): boolean {
    // Simplified validation - in a real implementation, this would perform proper validation
    return address && address.length >= 32 && address.length <= 44;
  }
  
  /**
   * Send token transaction
   * 
   * @param recipientAddress Recipient wallet address
   * @param amount Token amount
   * @returns Transaction hash
   */
  private async sendTokenTransaction(
    recipientAddress: string,
    amount: number
  ): Promise<string> {
    try {
      logger.info('Sending token transaction', { 
        recipientAddress, 
        amount
      });
      
      // In a real implementation, this would create and send an actual blockchain transaction
      // For demo purposes, we'll simulate a transaction
      
      // Generate a random transaction hash
      const txHash = `tx_${Math.random().toString(36).substring(2, 15)}`;
      
      // Add some delay to simulate blockchain latency
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      logger.info('Token transaction sent', { 
        recipientAddress, 
        amount, 
        txHash
      });
      
      return txHash;
    } catch (error) {
      logger.error('Error sending token transaction', { 
        recipientAddress, 
        amount, 
        error
      });
      
      throw new Error('Failed to send token transaction');
    }
  }
  
  /**
   * Monitor transaction for confirmation
   * 
   * @param transaction Transaction to monitor
   */
  private monitorTransaction(transaction: RedemptionTransaction): void {
    // Clear any existing monitor
    if (this.transactionMonitors.has(transaction.id)) {
      clearTimeout(this.transactionMonitors.get(transaction.id)!);
    }
    
    // Only monitor transactions that are pending confirmation and have a hash
    if (transaction.status !== RedemptionStatus.PENDING_CONFIRMATION || !transaction.transactionHash) {
      return;
    }
    
    // Create a recursive check function
    const checkCounter = { count: 0 };
    
    const checkTransaction = async () => {
      try {
        // Get updated transaction
        const updatedTransaction = this.pendingTransactions.get(transaction.id);
        
        // If transaction no longer exists or is no longer pending, stop monitoring
        if (!updatedTransaction || updatedTransaction.status !== RedemptionStatus.PENDING_CONFIRMATION) {
          return;
        }
        
        // Check for confirmation
        await this.checkTransactionConfirmation(updatedTransaction);
        
        // Increment counter
        checkCounter.count++;
        
        // Continue monitoring if still pending and under max checks
        if (updatedTransaction.status === RedemptionStatus.PENDING_CONFIRMATION && 
            checkCounter.count < this.MAX_CONFIRMATION_CHECKS) {
          
          // Schedule next check
          const timeout = setTimeout(checkTransaction, this.CHECK_INTERVAL);
          this.transactionMonitors.set(transaction.id, timeout);
        } else if (checkCounter.count >= this.MAX_CONFIRMATION_CHECKS) {
          // Max checks reached, mark as failed
          logger.warn('Transaction confirmation timeout', { 
            transactionId: transaction.id, 
            hash: transaction.transactionHash
          });
          
          await this.updateTransactionStatus(transaction.id, {
            status: RedemptionStatus.FAILED,
            error: 'Transaction confirmation timeout',
            completedAt: new Date()
          });
          
          // Emit transaction failed event
          this.eventEmitter.emit('transaction:failed', updatedTransaction);
        }
      } catch (error) {
        logger.error('Error checking transaction confirmation', { 
          transactionId: transaction.id, 
          error
        });
        
        // Schedule retry
        if (checkCounter.count < this.MAX_CONFIRMATION_CHECKS) {
          const timeout = setTimeout(checkTransaction, this.CHECK_INTERVAL);
          this.transactionMonitors.set(transaction.id, timeout);
        } else {
          // Max checks reached, mark as failed
          await this.updateTransactionStatus(transaction.id, {
            status: RedemptionStatus.FAILED,
            error: 'Transaction confirmation check failed',
            completedAt: new Date()
          });
          
          // Emit transaction failed event
          this.eventEmitter.emit('transaction:failed', transaction);
        }
      }
    };
    
    // Start first check
    checkTransaction();
  }
  
  /**
   * Check transaction confirmation
   * 
   * @param transaction Transaction to check
   */
  private async checkTransactionConfirmation(transaction: RedemptionTransaction): Promise<void> {
    try {
      if (!transaction.transactionHash) {
        return;
      }
      
      logger.debug('Checking transaction confirmation', { 
        transactionId: transaction.id, 
        hash: transaction.transactionHash 
      });
      
      // In a real implementation, this would query the blockchain
      // For demo purposes, we'll simulate a transaction confirmation with 80% chance
      
      // Simulate blockchain query latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate confirmation (80% chance)
      const isConfirmed = Math.random() < 0.8;
      
      if (isConfirmed) {
        // Generate receipt
        const receipt: TransactionReceipt = {
          blockNumber: Math.floor(Math.random() * 1000000) + 10000000,
          confirmations: Math.floor(Math.random() * 20) + 1,
          timestamp: new Date(),
          fee: (Math.random() * 0.001).toFixed(6)
        };
        
        // Update transaction status
        await this.updateTransactionStatus(transaction.id, {
          status: RedemptionStatus.COMPLETED,
          receipt,
          completedAt: new Date()
        });
        
        // Emit transaction confirmed event
        this.eventEmitter.emit('transaction:confirmed', transaction);
        
        logger.info('Transaction confirmed', { 
          transactionId: transaction.id, 
          hash: transaction.transactionHash 
        });
      } else {
        logger.debug('Transaction not yet confirmed', { 
          transactionId: transaction.id, 
          hash: transaction.transactionHash 
        });
      }
    } catch (error) {
      logger.error('Error checking transaction confirmation', { 
        transactionId: transaction.id, 
        hash: transaction.transactionHash, 
        error 
      });
      
      throw error;
    }
  }
  
  /**
   * Get transaction status
   * 
   * @param transactionId Transaction ID
   * @returns Transaction or null if not found
   */
  async getTransaction(transactionId: string): Promise<RedemptionTransaction | null> {
    // First check in-memory map
    const transaction = this.pendingTransactions.get(transactionId);
    
    if (transaction) {
      return transaction;
    }
    
    // Check cache for completed transactions
    const cachedTransaction = cache.get<RedemptionTransaction>(`redemption:transaction:${transactionId}`);
    
    if (cachedTransaction) {
      return cachedTransaction;
    }
    
    // In a real implementation, this would query the database
    // For now, return null
    return null;
  }
  
  /**
   * Get transaction by redemption ID
   * 
   * @param redemptionId Redemption ID
   * @returns Transaction or null if not found
   */
  async getTransactionByRedemptionId(redemptionId: string): Promise<RedemptionTransaction | null> {
    // Check in-memory map
    for (const transaction of this.pendingTransactions.values()) {
      if (transaction.redemptionId === redemptionId) {
        return transaction;
      }
    }
    
    // In a real implementation, this would query a database
    // For now, return null
    return null;
  }
  
  /**
   * Subscribe to transaction status updates
   * 
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  subscribeToUpdates(
    callback: (transaction: RedemptionTransaction) => void
  ): () => void {
    this.eventEmitter.on('transaction:update', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('transaction:update', callback);
    };
  }
  
  /**
   * Subscribe to transaction confirmation events
   * 
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  subscribeToConfirmations(
    callback: (transaction: RedemptionTransaction) => void
  ): () => void {
    this.eventEmitter.on('transaction:confirmed', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('transaction:confirmed', callback);
    };
  }
  
  /**
   * Subscribe to transaction failure events
   * 
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  subscribeToFailures(
    callback: (transaction: RedemptionTransaction) => void
  ): () => void {
    this.eventEmitter.on('transaction:failed', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('transaction:failed', callback);
    };
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
