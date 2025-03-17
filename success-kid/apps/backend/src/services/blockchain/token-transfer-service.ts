/**
 * Token Transfer Service
 * 
 * Handles blockchain interactions for token transfers.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';
import { BlockchainProviderFactory } from './providers/blockchain-provider-factory';

// Enum for transaction statuses
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

// Interface for transaction details
export interface TransactionDetails {
  txHash: string;
  status: TransactionStatus;
  fromAddress: string;
  toAddress: string;
  amount: number;
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: number;
  timestamp?: Date;
}

// Interface for transaction fee estimation
export interface FeeEstimate {
  fee: string;
  currency: string;
  fastFee?: string;
  averageFee?: string;
  slowFee?: string;
  estimatedTimeInSeconds?: number;
}

// Configuration for token transfer service
export interface TokenTransferConfig {
  treasuryAddress: string;
  tokenAddress: string;
  tokenDecimals: number;
  minConfirmations: number;
  gasMultiplier: number;
  providerUrls: string[];
  blockExplorerUrl: string;
  waitTimeoutMs: number;
}

/**
 * Service for handling token transfers on the blockchain
 */
export class TokenTransferService {
  private redis = getRedisClient();
  private providerFactory: BlockchainProviderFactory;
  private defaultConfig: TokenTransferConfig = {
    treasuryAddress: process.env.TREASURY_ADDRESS || '',
    tokenAddress: process.env.TOKEN_ADDRESS || '',
    tokenDecimals: parseInt(process.env.TOKEN_DECIMALS || '9', 10),
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '1', 10),
    gasMultiplier: parseFloat(process.env.GAS_MULTIPLIER || '1.1'),
    providerUrls: process.env.BLOCKCHAIN_PROVIDER_URLS?.split(',') || [],
    blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || '',
    waitTimeoutMs: parseInt(process.env.TRANSACTION_WAIT_TIMEOUT || '60000', 10) // 1 minute
  };

  private config: TokenTransferConfig;

  constructor(
    providerFactory: BlockchainProviderFactory,
    config?: Partial<TokenTransferConfig>
  ) {
    this.providerFactory = providerFactory;
    this.config = { ...this.defaultConfig, ...config };
    
    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validate the service configuration
   */
  private validateConfig(): void {
    if (!this.config.treasuryAddress) {
      throw new Error('Treasury address must be configured');
    }
    
    if (!this.config.tokenAddress) {
      throw new Error('Token address must be configured');
    }
    
    if (this.config.providerUrls.length === 0) {
      throw new Error('At least one blockchain provider URL must be configured');
    }
  }

  /**
   * Transfer tokens from treasury to a user wallet
   */
  async transferTokens(recipient: string, amount: number): Promise<string> {
    try {
      // Validate parameters
      if (!this.isValidAddress(recipient)) {
        throw new Error('Invalid recipient wallet address');
      }
      
      if (!this.isValidAmount(amount)) {
        throw new Error('Invalid amount');
      }
      
      // Get the provider
      const provider = this.providerFactory.getProvider();
      
      // Check treasury balance
      const treasuryBalance = await this.getTreasuryBalance();
      
      if (treasuryBalance < amount) {
        throw new Error('Insufficient treasury balance');
      }
      
      // Estimate fee
      const feeEstimate = await this.estimateTransactionFee();
      
      // Format amount according to token decimals
      const formattedAmount = this.formatTokenAmount(amount);
      
      // Create transaction
      const txResponse = await provider.transferTokens({
        tokenAddress: this.config.tokenAddress,
        fromAddress: this.config.treasuryAddress,
        toAddress: recipient,
        amount: formattedAmount,
        gasMultiplier: this.config.gasMultiplier,
        gasFee: feeEstimate.fee
      });
      
      // Store transaction in Redis for tracking
      await this.storeTransaction({
        txHash: txResponse.txHash,
        status: TransactionStatus.PENDING,
        fromAddress: this.config.treasuryAddress,
        toAddress: recipient,
        amount: amount,
        timestamp: new Date()
      });
      
      logger.info('Token transfer initiated', {
        recipient,
        amount,
        txHash: txResponse.txHash
      });
      
      return txResponse.txHash;
    } catch (error) {
      logger.error('Error transferring tokens', { error, recipient, amount });
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<TransactionDetails | null> {
    try {
      // Check cache first
      const cachedTx = await this.getTransactionFromCache(txHash);
      
      // If the transaction is already confirmed in cache, return it
      if (cachedTx && cachedTx.status === TransactionStatus.CONFIRMED && cachedTx.confirmations >= this.config.minConfirmations) {
        return cachedTx;
      }
      
      // Get provider
      const provider = this.providerFactory.getProvider();
      
      // Get transaction status from blockchain
      const txStatus = await provider.getTransaction(txHash);
      
      if (!txStatus) {
        // Transaction not found on blockchain, return cached version if available
        return cachedTx || null;
      }
      
      // Update cached transaction
      const updatedTx: TransactionDetails = {
        txHash,
        status: txStatus.confirmed ? TransactionStatus.CONFIRMED : TransactionStatus.PENDING,
        fromAddress: txStatus.fromAddress || cachedTx?.fromAddress || this.config.treasuryAddress,
        toAddress: txStatus.toAddress || cachedTx?.toAddress || '',
        amount: txStatus.amount || cachedTx?.amount || 0,
        blockNumber: txStatus.blockNumber,
        confirmations: txStatus.confirmations || 0,
        gasUsed: txStatus.gasUsed,
        timestamp: txStatus.timestamp || new Date()
      };
      
      // Update cache with new information
      await this.storeTransaction(updatedTx);
      
      return updatedTx;
    } catch (error) {
      logger.error('Error getting transaction status', { error, txHash });
      
      // Return cached version on error if available
      const cachedTx = await this.getTransactionFromCache(txHash);
      return cachedTx || null;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    txHash: string, 
    confirmations: number = this.config.minConfirmations
  ): Promise<boolean> {
    try {
      const startTime = Date.now();
      const checkInterval = 5000; // Check every 5 seconds
      
      while (Date.now() - startTime < this.config.waitTimeoutMs) {
        // Get current status
        const txStatus = await this.getTransactionStatus(txHash);
        
        // If transaction is confirmed with enough confirmations, return true
        if (txStatus?.status === TransactionStatus.CONFIRMED && 
            (txStatus.confirmations || 0) >= confirmations) {
          return true;
        }
        
        // If transaction failed, return false
        if (txStatus?.status === TransactionStatus.FAILED) {
          return false;
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
      
      // Timeout reached, return false (transaction still pending)
      logger.warn('Transaction confirmation timeout', { txHash, confirmations });
      return false;
    } catch (error) {
      logger.error('Error waiting for confirmation', { error, txHash });
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateTransactionFee(): Promise<FeeEstimate> {
    try {
      const provider = this.providerFactory.getProvider();
      return await provider.estimateFee();
    } catch (error) {
      logger.error('Error estimating transaction fee', { error });
      throw error;
    }
  }

  /**
   * Get treasury token balance
   */
  async getTreasuryBalance(): Promise<number> {
    try {
      const provider = this.providerFactory.getProvider();
      
      const balanceRaw = await provider.getTokenBalance(
        this.config.tokenAddress,
        this.config.treasuryAddress
      );
      
      // Convert from token units to display units based on decimals
      return this.convertTokenUnitsToDisplay(balanceRaw);
    } catch (error) {
      logger.error('Error getting treasury balance', { error });
      throw error;
    }
  }

  /**
   * Check if an address is valid
   */
  private isValidAddress(address: string): boolean {
    // Basic validation - should be enhanced based on blockchain specifics
    return address && typeof address === 'string' && address.length >= 30;
  }

  /**
   * Check if amount is valid
   */
  private isValidAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount);
  }

  /**
   * Format token amount according to decimals
   */
  private formatTokenAmount(amount: number): string {
    // Convert from display units (e.g., 1.0) to token units (e.g., 1000000000 for 9 decimals)
    const multiplier = Math.pow(10, this.config.tokenDecimals);
    const tokenUnits = Math.floor(amount * multiplier);
    return tokenUnits.toString();
  }

  /**
   * Convert token units to display units
   */
  private convertTokenUnitsToDisplay(tokenUnits: string): number {
    const divisor = Math.pow(10, this.config.tokenDecimals);
    return Number(tokenUnits) / divisor;
  }

  /**
   * Store transaction in Redis
   */
  private async storeTransaction(tx: TransactionDetails): Promise<void> {
    const key = `transaction:${tx.txHash}`;
    await this.redis.set(key, JSON.stringify(tx), 'EX', 60 * 60 * 24 * 7); // 7 days expiry
  }

  /**
   * Get transaction from Redis cache
   */
  private async getTransactionFromCache(txHash: string): Promise<TransactionDetails | null> {
    const key = `transaction:${txHash}`;
    const data = await this.redis.get(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as TransactionDetails;
  }
}
