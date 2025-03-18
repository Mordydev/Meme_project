/**
 * Blockchain Service
 * 
 * Service for interacting with blockchain providers, handling caching,
 * failover, retry logic, and general blockchain operations.
 */

import { logger } from '../../lib/logger';
import { env } from '../../config/environment';
import { BlockchainProviderFactory } from './providers/blockchain-provider-factory';
import { TransactionStatus, TokenTransferParams, IBlockchainProvider } from './providers/blockchain-provider-interface';
import { redisClient } from '../../lib/redis-client';

export class BlockchainService {
  private providerFactory: BlockchainProviderFactory;
  
  constructor() {
    // Initialize provider factory with configuration from environment
    const providerUrls = env.BLOCKCHAIN_PROVIDER_URLS.split(',');
    const tokenAddress = env.TOKEN_ADDRESS;
    const treasuryPrivateKey = env.TREASURY_PRIVATE_KEY;
    
    this.providerFactory = new BlockchainProviderFactory(
      providerUrls,
      tokenAddress,
      treasuryPrivateKey
    );
    
    logger.info('Blockchain service initialized');
  }
  
  /**
   * Get token balance for a wallet address with caching
   */
  async getTokenBalance(walletAddress: string): Promise<string> {
    // Cache key for this wallet's balance
    const cacheKey = `balance:${walletAddress}`;
    
    try {
      // Check cache first
      const cachedBalance = await redisClient.get(cacheKey);
      if (cachedBalance) {
        return cachedBalance;
      }
      
      // Get balance from provider
      const provider = this.providerFactory.getProvider();
      const balance = await this.executeWithRetry(() => 
        provider.getTokenBalance(env.TOKEN_ADDRESS, walletAddress)
      );
      
      // Cache the result for 5 minutes
      await redisClient.set(cacheKey, balance, 'EX', 300);
      
      return balance;
    } catch (error) {
      logger.error('Failed to get token balance', { error, walletAddress });
      throw error;
    }
  }
  
  /**
   * Get transaction status
   */
  async getTransaction(txHash: string): Promise<TransactionStatus | null> {
    // Cache key for this transaction
    const cacheKey = `tx:${txHash}`;
    
    try {
      // Check cache first
      const cachedTx = await redisClient.get(cacheKey);
      if (cachedTx) {
        return JSON.parse(cachedTx);
      }
      
      // Get transaction from provider
      const provider = this.providerFactory.getProvider();
      const tx = await this.executeWithRetry(() => 
        provider.getTransaction(txHash)
      );
      
      // If transaction is found and confirmed, cache it permanently
      if (tx && tx.confirmed) {
        await redisClient.set(cacheKey, JSON.stringify(tx));
      } else if (tx) {
        // If transaction is found but not confirmed, cache it for a short time
        await redisClient.set(cacheKey, JSON.stringify(tx), 'EX', 60);
      }
      
      return tx;
    } catch (error) {
      logger.error('Failed to get transaction', { error, txHash });
      throw error;
    }
  }
  
  /**
   * Get recent transactions for a wallet address
   */
  async getRecentTransactions(walletAddress: string, limit = 10): Promise<TransactionStatus[]> {
    // TODO: This is a placeholder - in a real implementation, would query transaction history
    // from a blockchain explorer API or use another method to get transaction history
    
    // Mock recent transactions
    const transactions: TransactionStatus[] = [];
    
    // Return mock data
    return transactions;
  }
  
  /**
   * Transfer tokens from the treasury to a recipient
   */
  async transferTokens(recipientAddress: string, amount: number): Promise<string> {
    try {
      const provider = this.providerFactory.getProvider();
      
      // Create transfer parameters
      const transferParams: TokenTransferParams = {
        tokenAddress: env.TOKEN_ADDRESS,
        fromAddress: env.TREASURY_ADDRESS,
        toAddress: recipientAddress,
        amount: amount.toString()
      };
      
      // Execute transfer
      const { txHash } = await this.executeWithRetry(() => 
        provider.transferTokens(transferParams)
      );
      
      logger.info('Token transfer successful', { 
        txHash, 
        recipient: recipientAddress, 
        amount 
      });
      
      return txHash;
    } catch (error) {
      logger.error('Failed to transfer tokens', { error, recipientAddress, amount });
      throw error;
    }
  }
  
  /**
   * Estimate transaction fee
   */
  async estimateFee(): Promise<{ fee: string; currency: string }> {
    try {
      const provider = this.providerFactory.getProvider();
      const estimate = await this.executeWithRetry(() => 
        provider.estimateFee()
      );
      
      return {
        fee: estimate.fee,
        currency: estimate.currency
      };
    } catch (error) {
      logger.error('Failed to estimate fee', { error });
      throw error;
    }
  }
  
  /**
   * Get network name
   */
  async getNetworkName(): Promise<string> {
    try {
      const provider = this.providerFactory.getProvider();
      return await this.executeWithRetry(() => 
        provider.getNetworkName()
      );
    } catch (error) {
      logger.error('Failed to get network name', { error });
      throw error;
    }
  }
  
  /**
   * Execute a provider function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        logger.warn('Blockchain provider operation failed, retrying', {
          attempt: attempt + 1,
          maxRetries,
          error
        });
        
        // Report failure to potentially trigger failover
        this.providerFactory.reportFailure();
        
        // Wait before retrying with exponential backoff
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }
    
    // If we got here, all retries failed
    throw lastError || new Error('Operation failed after multiple retries');
  }
}
