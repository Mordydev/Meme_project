/**
 * Transaction Service
 * 
 * Service for fetching, processing, and caching transaction data from blockchain
 * with support for multiple data sources and failover.
 */

import axios from 'axios';
import { logger } from '../../lib/logger';
import { env } from '../../config/environment';
import { redisClient } from '../../lib/redis-client';
import { formatDistanceToNow } from 'date-fns';

// Transaction types
export interface Transaction {
  hash: string;
  type: 'in' | 'out' | 'swap';
  amount: number;
  timestamp: Date;
  fromAddress?: string;
  toAddress?: string;
  status: 'confirmed' | 'pending';
  usdValue?: number;
}

export interface TransactionProvider {
  id: string;
  name: string;
  url: string;
  priority: number;
  apiKey?: string;
}

export class TransactionService {
  private providers: TransactionProvider[];
  private lastFailure: Map<string, number> = new Map();
  private failureCounters: Map<string, number> = new Map();
  private readonly failoverThreshold = 3;
  private readonly failureWindow = 60000; // 1 minute
  
  constructor() {
    // Initialize providers from environment configuration
    this.initializeProviders();
    
    logger.info('Transaction service initialized');
  }
  
  /**
   * Initialize transaction providers from configuration
   */
  private initializeProviders(): void {
    // Parse provider configuration
    try {
      const providerConfig = JSON.parse(env.TRANSACTION_PROVIDERS || '[]');
      this.providers = providerConfig;
      
      // Sort providers by priority
      this.providers.sort((a, b) => a.priority - b.priority);
      
      logger.info(`Initialized ${this.providers.length} transaction providers`);
    } catch (error) {
      logger.error('Failed to parse transaction provider configuration', { error });
      this.providers = [];
    }
    
    // Fallback to defaults if no providers configured
    if (this.providers.length === 0) {
      this.providers = [
        {
          id: 'solscan',
          name: 'Solscan',
          url: 'https://public-api.solscan.io/account/transactions',
          priority: 1
        },
        {
          id: 'solana-rpc',
          name: 'Solana RPC',
          url: env.BLOCKCHAIN_PROVIDER_URLS.split(',')[0] || 'https://api.mainnet-beta.solana.com',
          priority: 2
        }
      ];
      
      logger.info('Using default transaction providers');
    }
  }
  
  /**
   * Get recent transactions for a specific token address
   */
  async getRecentTransactions(limit = 20): Promise<Transaction[]> {
    try {
      // Try to get data from cache
      const cachedData = await redisClient.get('market:transactions');
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // If not in cache, fetch new data
      return await this.updateRecentTransactions(limit);
    } catch (error) {
      logger.error('Failed to get recent transactions', { error });
      throw error;
    }
  }
  
  /**
   * Get transactions for a specific wallet address
   */
  async getWalletTransactions(walletAddress: string, limit = 10): Promise<Transaction[]> {
    try {
      // Generate cache key specific to this wallet
      const cacheKey = `wallet:${walletAddress}:transactions`;
      
      // Try to get data from cache
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // If not in cache, fetch new data
      return await this.fetchWalletTransactions(walletAddress, limit);
    } catch (error) {
      logger.error('Failed to get wallet transactions', { error, walletAddress });
      throw error;
    }
  }
  
  /**
   * Update recent transaction data
   */
  private async updateRecentTransactions(limit: number): Promise<Transaction[]> {
    let transactions: Transaction[] | null = null;
    let providerUsed: string | null = null;
    
    // Try each provider in priority order
    for (const provider of this.providers) {
      // Skip providers that have failed recently
      if (this.shouldSkipProvider(provider.id)) {
        continue;
      }
      
      try {
        // Fetch data from provider
        transactions = await this.fetchRecentTransactions(provider, limit);
        
        // If successful, reset failure counter
        this.failureCounters.set(provider.id, 0);
        
        // Remember which provider was used
        providerUsed = provider.id;
        
        // Exit the loop since we have data
        break;
      } catch (error) {
        logger.error(`Failed to fetch transactions from ${provider.name}`, { error });
        
        // Increment failure counter
        const currentCount = this.failureCounters.get(provider.id) || 0;
        this.failureCounters.set(provider.id, currentCount + 1);
        this.lastFailure.set(provider.id, Date.now());
      }
    }
    
    // If no data was fetched, throw error
    if (!transactions) {
      throw new Error('Failed to fetch transactions from any provider');
    }
    
    // Cache the result for quick access (keep for 2 minutes)
    await redisClient.set('market:transactions', JSON.stringify(transactions), 'EX', 120);
    
    logger.info(`Updated recent transactions from ${providerUsed}`);
    
    return transactions;
  }
  
  /**
   * Fetch transactions for a specific wallet
   */
  private async fetchWalletTransactions(walletAddress: string, limit: number): Promise<Transaction[]> {
    let transactions: Transaction[] | null = null;
    let providerUsed: string | null = null;
    
    // Try each provider in priority order
    for (const provider of this.providers) {
      // Skip providers that have failed recently
      if (this.shouldSkipProvider(provider.id)) {
        continue;
      }
      
      try {
        // Fetch data from provider
        transactions = await this.fetchFromProvider(provider, walletAddress, limit);
        
        // If successful, reset failure counter
        this.failureCounters.set(provider.id, 0);
        
        // Remember which provider was used
        providerUsed = provider.id;
        
        // Exit the loop since we have data
        break;
      } catch (error) {
        logger.error(`Failed to fetch wallet transactions from ${provider.name}`, { error, walletAddress });
        
        // Increment failure counter
        const currentCount = this.failureCounters.get(provider.id) || 0;
        this.failureCounters.set(provider.id, currentCount + 1);
        this.lastFailure.set(provider.id, Date.now());
      }
    }
    
    // If no data was fetched, return empty array
    if (!transactions) {
      return [];
    }
    
    // Cache the result for quick access (keep for 2 minutes)
    const cacheKey = `wallet:${walletAddress}:transactions`;
    await redisClient.set(cacheKey, JSON.stringify(transactions), 'EX', 120);
    
    logger.info(`Updated wallet transactions from ${providerUsed}`);
    
    return transactions;
  }
  
  /**
   * Determine if a provider should be skipped due to recent failures
   */
  private shouldSkipProvider(providerId: string): boolean {
    const failureCount = this.failureCounters.get(providerId) || 0;
    const lastFailureTime = this.lastFailure.get(providerId) || 0;
    
    // Skip if failure threshold reached and within failure window
    if (failureCount >= this.failoverThreshold) {
      const now = Date.now();
      const elapsed = now - lastFailureTime;
      
      // If within failure window, skip this provider
      if (elapsed < this.failureWindow) {
        return true;
      }
      
      // Reset failure counter if failure window has passed
      this.failureCounters.set(providerId, 0);
    }
    
    return false;
  }
  
  /**
   * Fetch recent transactions (market-wide)
   * In a real implementation, this would fetch from blockchain explorers
   * For now, generate some mock data
   */
  private async fetchRecentTransactions(
    provider: TransactionProvider,
    limit: number
  ): Promise<Transaction[]> {
    logger.debug(`Fetching recent transactions from ${provider.name}`);
    
    // In a real implementation, would fetch from provider
    // For now, return mock data
    const transactions: Transaction[] = [];
    
    // Generate some mock transactions
    for (let i = 0; i < limit; i++) {
      const minutesAgo = Math.floor(Math.random() * 60 * 24); // Random time in last 24 hours
      const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000);
      
      // Randomize transaction type
      const type = Math.random() > 0.5 ? 'in' : 'out';
      
      // Generate random amount between 100 and 10000
      const amount = Math.floor(Math.random() * 9900) + 100;
      
      // Generate random addresses
      const fromAddress = type === 'out' ? env.TOKEN_ADDRESS : this.generateRandomAddress();
      const toAddress = type === 'in' ? env.TOKEN_ADDRESS : this.generateRandomAddress();
      
      transactions.push({
        hash: this.generateRandomTransactionHash(),
        type,
        amount: amount / 100, // Convert to decimal
        timestamp,
        fromAddress,
        toAddress,
        status: 'confirmed',
        usdValue: (amount / 100) * 0.1 // Mock USD value at $0.10 per token
      });
    }
    
    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return transactions;
  }
  
  /**
   * Fetch transactions for a specific wallet
   */
  private async fetchFromProvider(
    provider: TransactionProvider,
    walletAddress: string,
    limit: number
  ): Promise<Transaction[]> {
    logger.debug(`Fetching wallet transactions from ${provider.name}`);
    
    try {
      let transactions;
      
      switch (provider.id) {
        case 'solscan':
          transactions = await this.fetchFromSolscan(provider, walletAddress, limit);
          break;
        case 'solana-rpc':
          transactions = await this.fetchFromSolanaRPC(provider, walletAddress, limit);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider.id}`);
      }
      
      return transactions;
    } catch (error) {
      logger.error(`Error fetching from ${provider.name}`, { error, walletAddress });
      throw error;
    }
  }
  
  /**
   * Fetch transactions from Solscan API
   * This is a placeholder - in a real implementation, would make API call
   */
  private async fetchFromSolscan(
    provider: TransactionProvider,
    walletAddress: string,
    limit: number
  ): Promise<Transaction[]> {
    // In a real implementation, would fetch from Solscan API
    // For now, return mock data
    const transactions: Transaction[] = [];
    
    // Generate some mock transactions
    for (let i = 0; i < limit; i++) {
      const minutesAgo = Math.floor(Math.random() * 60 * 24 * 30); // Random time in last 30 days
      const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000);
      
      // Randomize transaction type
      const type = Math.random() > 0.6 ? 'in' : 'out';
      
      // Generate random amount between 50 and 5000
      const amount = Math.floor(Math.random() * 4950) + 50;
      
      // Generate random addresses
      const fromAddress = type === 'out' ? walletAddress : this.generateRandomAddress();
      const toAddress = type === 'in' ? walletAddress : this.generateRandomAddress();
      
      transactions.push({
        hash: this.generateRandomTransactionHash(),
        type,
        amount: amount / 100, // Convert to decimal
        timestamp,
        fromAddress,
        toAddress,
        status: 'confirmed',
        usdValue: (amount / 100) * 0.1 // Mock USD value at $0.10 per token
      });
    }
    
    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return transactions;
  }
  
  /**
   * Fetch transactions from Solana RPC API
   * This is a placeholder - in a real implementation, would make RPC call
   */
  private async fetchFromSolanaRPC(
    provider: TransactionProvider,
    walletAddress: string,
    limit: number
  ): Promise<Transaction[]> {
    // In a real implementation, would fetch from Solana RPC
    // For now, return mock data similar to Solscan but with slightly different values
    const transactions: Transaction[] = [];
    
    // Generate some mock transactions
    for (let i = 0; i < limit; i++) {
      const minutesAgo = Math.floor(Math.random() * 60 * 24 * 30); // Random time in last 30 days
      const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000);
      
      // Randomize transaction type
      const type = Math.random() > 0.6 ? 'in' : 'out';
      
      // Generate random amount between 50 and 5000
      const amount = Math.floor(Math.random() * 4950) + 50;
      
      // Generate random addresses
      const fromAddress = type === 'out' ? walletAddress : this.generateRandomAddress();
      const toAddress = type === 'in' ? walletAddress : this.generateRandomAddress();
      
      transactions.push({
        hash: this.generateRandomTransactionHash(),
        type,
        amount: amount / 100, // Convert to decimal
        timestamp,
        fromAddress,
        toAddress,
        status: 'confirmed',
        usdValue: (amount / 100) * 0.1 // Mock USD value at $0.10 per token
      });
    }
    
    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return transactions;
  }
  
  /**
   * Helper method to generate a random transaction hash
   */
  private generateRandomTransactionHash(): string {
    // Generate a 64 character random hex string
    let hash = '';
    const characters = 'abcdef0123456789';
    
    for (let i = 0; i < 64; i++) {
      hash += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return hash;
  }
  
  /**
   * Helper method to generate a random Solana address
   */
  private generateRandomAddress(): string {
    // Generate a 32-44 character random base58 string
    let address = '';
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    const length = Math.floor(Math.random() * 12) + 32; // Random length between 32-44
    
    for (let i = 0; i < length; i++) {
      address += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return address;
  }
}
