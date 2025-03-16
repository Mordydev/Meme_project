/**
 * Transaction feed service for token transactions
 */
import { TransactionFeedItem, TransactionFeedOptions, PaginatedResult } from '../types';
import { IProviderManager } from '../providers/provider-manager';
import { TransactionProvider } from '../providers/provider-interface';
import { ICacheService } from '../caching/cache-service';
import { IPriceService } from '../price/price-service';
import { logger } from '../../../lib/logger';
import { eventBus, EventType } from '../../../lib/event-bus';

/**
 * Transaction service interface
 */
export interface ITransactionService {
  getTransactions(options?: TransactionFeedOptions): Promise<PaginatedResult<TransactionFeedItem>>;
  getSignificantTransactions(limit?: number): Promise<TransactionFeedItem[]>;
  subscribeToTransactions(callback: (transaction: TransactionFeedItem) => void): () => void;
  refreshTransactionFeed(): Promise<void>;
  getTransactionVolume(period: string): Promise<any>;
}

/**
 * Transaction service implementation
 */
export class TransactionService implements ITransactionService {
  private tokenAddresses: Record<string, string>;
  private knownWallets: Record<string, string>;
  
  /**
   * Create a new transaction service
   * @param providerManager Provider manager for data sources
   * @param cacheService Cache service for data caching
   * @param priceService Price service for token prices
   */
  constructor(
    private providerManager: IProviderManager,
    private cacheService: ICacheService,
    private priceService: IPriceService
  ) {
    // Initialize token addresses and known wallets
    this.tokenAddresses = {
      'SKC': process.env.SKC_TOKEN_ADDRESS || '',
    };
    
    this.knownWallets = {
      // Example of known wallets for labeling
      [process.env.TREASURY_WALLET_ADDRESS || '']: 'Treasury',
      [process.env.TEAM_WALLET_ADDRESS || '']: 'Team Wallet',
      [process.env.MARKETING_WALLET_ADDRESS || '']: 'Marketing Wallet',
    };
    
    // Set up scheduled transaction updates
    this.setupTransactionUpdateSchedule();
  }
  
  /**
   * Get transactions with filtering and pagination
   * @param options Transaction feed options
   * @returns Paginated list of transactions
   */
  async getTransactions(
    options: TransactionFeedOptions = {}
  ): Promise<PaginatedResult<TransactionFeedItem>> {
    // Set default options
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const types = options.types || ['buy', 'sell', 'transfer', 'liquidity'];
    const minAmount = options.minAmount || 0;
    
    // Create cache key based on options
    const cacheKey = this.createTransactionCacheKey(options);
    
    return this.cacheService.getWithFetch<PaginatedResult<TransactionFeedItem>>(
      cacheKey,
      async () => this.fetchTransactions(options),
      {
        ttl: 60, // Cache for 1 minute
        staleWhileRevalidate: true,
        staleTtl: 300 // Stale data valid for 5 minutes
      }
    );
  }
  
  /**
   * Get significant transactions (large volume)
   * @param limit Maximum number of transactions to return
   * @returns List of significant transactions
   */
  async getSignificantTransactions(limit = 10): Promise<TransactionFeedItem[]> {
    const cacheKey = `transactions:significant:${limit}`;
    
    return this.cacheService.getWithFetch<TransactionFeedItem[]>(
      cacheKey,
      async () => {
        // Get transactions with significant flag
        const result = await this.getTransactions({
          limit,
          significantOnly: true
        });
        
        return result.data;
      },
      {
        ttl: 300, // Cache for 5 minutes
        staleWhileRevalidate: true,
        staleTtl: 900 // Stale data valid for 15 minutes
      }
    );
  }
  
  /**
   * Subscribe to transaction updates
   * @param callback Callback function for transaction updates
   * @returns Unsubscribe function
   */
  subscribeToTransactions(
    callback: (transaction: TransactionFeedItem) => void
  ): () => void {
    // Create unique subscription ID
    const subscriptionId = `tx-sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up event listener
    const unsubscribe = eventBus.subscribe(EventType.TRANSACTION_DETECTED, (data: any) => {
      if (data && data.transaction) {
        callback(data.transaction);
      }
    });
    
    // Return unsubscribe function
    return () => {
      unsubscribe();
      logger.debug(`Transaction subscription ${subscriptionId} removed`);
    };
  }
  
  /**
   * Force refresh of transaction feed
   */
  async refreshTransactionFeed(): Promise<void> {
    try {
      // Invalidate transaction cache
      await this.cacheService.invalidatePattern('transactions');
      
      // Fetch new transactions
      const transactions = await this.fetchTransactions({
        limit: 20
      });
      
      logger.info('Transaction feed refreshed', {
        count: transactions.data.length
      });
    } catch (error) {
      logger.error('Failed to refresh transaction feed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get transaction volume for a specific period
   * @param period Time period (e.g. '24h', '7d', '30d')
   * @returns Volume data
   */
  async getTransactionVolume(period: string): Promise<any> {
    const cacheKey = `transactions:volume:${period}`;
    
    return this.cacheService.getWithFetch<any>(
      cacheKey,
      async () => this.calculateTransactionVolume(period),
      {
        ttl: 300, // Cache for 5 minutes
        staleWhileRevalidate: true,
        staleTtl: 900 // Stale data valid for 15 minutes
      }
    );
  }
  
  /**
   * Fetch transactions from provider
   * @param options Transaction feed options
   * @returns Paginated list of transactions
   */
  private async fetchTransactions(
    options: TransactionFeedOptions
  ): Promise<PaginatedResult<TransactionFeedItem>> {
    try {
      const tokenAddress = this.tokenAddresses['SKC'];
      const limit = options.limit || 50;
      
      // Get token price for USD conversion
      const price = await this.priceService.getCurrentPrice('SKC');
      
      // Fetch transactions from provider
      const rawTransactions = await this.providerManager.executeWithFailover<any[]>(
        'transaction',
        async (provider: TransactionProvider) => 
          provider.getRecentTransactions(tokenAddress, limit * 2) // Get more to allow for filtering
      );
      
      // Transform and filter transactions
      const transformedTransactions = await this.transformTransactions(
        rawTransactions,
        price.priceUsd
      );
      
      // Apply filters
      let filteredTransactions = transformedTransactions;
      
      // Filter by type
      if (options.types && options.types.length > 0) {
        filteredTransactions = filteredTransactions.filter(tx => 
          options.types!.includes(tx.type)
        );
      }
      
      // Filter by minimum amount
      if (options.minAmount && options.minAmount > 0) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.amountUsd >= options.minAmount!
        );
      }
      
      // Filter by timestamp range
      if (options.fromTimestamp) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.timestamp >= options.fromTimestamp!
        );
      }
      
      if (options.toTimestamp) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.timestamp <= options.toTimestamp!
        );
      }
      
      // Filter by significance
      if (options.significantOnly) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.isSignificant
        );
      }
      
      // Apply pagination
      const paginatedTransactions = filteredTransactions.slice(
        options.offset || 0,
        (options.offset || 0) + (options.limit || 50)
      );
      
      // Return paginated result
      return {
        data: paginatedTransactions,
        pagination: {
          total: filteredTransactions.length,
          limit: options.limit || 50,
          offset: options.offset || 0,
          hasMore: (options.offset || 0) + paginatedTransactions.length < filteredTransactions.length
        }
      };
    } catch (error) {
      logger.error('Failed to fetch transactions', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Transform raw transaction data to standard format
   * @param rawTransactions Raw transaction data from provider
   * @param tokenPrice Current token price for USD conversion
   * @returns Formatted transaction feed items
   */
  private async transformTransactions(
    rawTransactions: any[],
    tokenPrice: number
  ): Promise<TransactionFeedItem[]> {
    // This transformation is provider-specific
    // Here we're using a generic approach that should be customized
    // based on the actual provider's response format
    
    const transformedTransactions: TransactionFeedItem[] = [];
    
    for (const tx of rawTransactions) {
      try {
        // Extract transaction data
        // Note: This will vary based on provider response structure
        const txItem: TransactionFeedItem = {
          txHash: tx.txId || tx.hash || tx.id,
          blockNumber: tx.blockNumber || 0,
          timestamp: new Date(tx.timestamp || tx.timeStamp || tx.date || Date.now()),
          type: this.determineTransactionType(tx),
          amount: tx.amount || tx.tokenAmount || '0',
          amountUsd: (parseFloat(tx.amount || tx.tokenAmount || '0') * tokenPrice) || 0,
          fromAddress: tx.from || tx.sender || '',
          toAddress: tx.to || tx.recipient || '',
          signerLabel: this.getWalletLabel(tx.from || tx.sender || ''),
          isSignificant: this.isSignificantTransaction(tx, tokenPrice)
        };
        
        transformedTransactions.push(txItem);
      } catch (error) {
        logger.error('Failed to transform transaction', { 
          tx: tx.txId || tx.hash, 
          error: error.message 
        });
      }
    }
    
    // Sort by timestamp (newest first)
    return transformedTransactions.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  /**
   * Determine transaction type based on transaction data
   * @param tx Raw transaction data
   * @returns Transaction type
   */
  private determineTransactionType(tx: any): 'buy' | 'sell' | 'transfer' | 'liquidity' | 'other' {
    // This is a simplified approach; actual implementation
    // would need to be customized for the specific provider
    
    // Check for known patterns in transaction data
    if (tx.type) {
      const type = tx.type.toLowerCase();
      
      if (type.includes('buy') || type.includes('swap_exact_tokens_for')) {
        return 'buy';
      } else if (type.includes('sell') || type.includes('swap_tokens_for_exact')) {
        return 'sell';
      } else if (type.includes('transfer')) {
        return 'transfer';
      } else if (type.includes('liquidity') || type.includes('add_liquidity') || type.includes('remove_liquidity')) {
        return 'liquidity';
      }
    }
    
    // If no explicit type, try to infer from other properties
    if (tx.method) {
      const method = tx.method.toLowerCase();
      
      if (method.includes('swap') && method.includes('exacttokensfor')) {
        return 'sell';
      } else if (method.includes('swap') && method.includes('fortokens')) {
        return 'buy';
      } else if (method.includes('transfer')) {
        return 'transfer';
      } else if (method.includes('liquidity')) {
        return 'liquidity';
      }
    }
    
    // Default to 'other' if type cannot be determined
    return 'other';
  }
  
  /**
   * Get label for known wallet addresses
   * @param address Wallet address
   * @returns Wallet label or undefined if not known
   */
  private getWalletLabel(address: string): string | undefined {
    return this.knownWallets[address];
  }
  
  /**
   * Determine if a transaction is significant (large volume)
   * @param tx Raw transaction data
   * @param tokenPrice Current token price
   * @returns True if significant, false otherwise
   */
  private isSignificantTransaction(tx: any, tokenPrice: number): boolean {
    // Calculate USD value
    const amount = parseFloat(tx.amount || tx.tokenAmount || '0');
    const valueUsd = amount * tokenPrice;
    
    // Consider it significant if value exceeds threshold ($1000 in this example)
    return valueUsd >= 1000;
  }
  
  /**
   * Create cache key for transaction feed
   * @param options Transaction feed options
   * @returns Cache key
   */
  private createTransactionCacheKey(options: TransactionFeedOptions): string {
    const parts = ['transactions'];
    
    // Add filters to key
    if (options.limit) parts.push(`limit:${options.limit}`);
    if (options.offset) parts.push(`offset:${options.offset}`);
    
    if (options.types && options.types.length) {
      parts.push(`types:${options.types.join(',')}`);
    }
    
    if (options.minAmount) parts.push(`min:${options.minAmount}`);
    if (options.significantOnly) parts.push('significant:true');
    
    if (options.fromTimestamp) {
      parts.push(`from:${options.fromTimestamp.toISOString()}`);
    }
    
    if (options.toTimestamp) {
      parts.push(`to:${options.toTimestamp.toISOString()}`);
    }
    
    return parts.join(':');
  }
  
  /**
   * Calculate transaction volume for a specific period
   * @param period Time period (e.g. '24h', '7d', '30d')
   * @returns Volume data
   */
  private async calculateTransactionVolume(period: string): Promise<any> {
    try {
      // Convert period to time range
      const now = new Date();
      let fromTimestamp: Date;
      
      switch (period) {
        case '24h':
          fromTimestamp = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromTimestamp = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromTimestamp = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromTimestamp = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      // Get transactions in time range
      const transactions = await this.getTransactions({
        fromTimestamp,
        limit: 1000 // Get a large number to calculate volume
      });
      
      // Calculate volume by type
      const volumeByType: Record<string, number> = {
        buy: 0,
        sell: 0,
        transfer: 0,
        liquidity: 0,
        total: 0
      };
      
      // Calculate total USD volume
      for (const tx of transactions.data) {
        volumeByType[tx.type] = (volumeByType[tx.type] || 0) + tx.amountUsd;
        volumeByType.total += tx.amountUsd;
      }
      
      // Calculate transaction count by type
      const countByType: Record<string, number> = {
        buy: 0,
        sell: 0,
        transfer: 0,
        liquidity: 0,
        total: 0
      };
      
      for (const tx of transactions.data) {
        countByType[tx.type] = (countByType[tx.type] || 0) + 1;
        countByType.total += 1;
      }
      
      return {
        period,
        volume: volumeByType,
        count: countByType,
        averageSize: volumeByType.total / (countByType.total || 1)
      };
    } catch (error) {
      logger.error('Failed to calculate transaction volume', { 
        period, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Set up scheduled transaction updates
   */
  private setupTransactionUpdateSchedule(): void {
    // Update transaction feed every 5 minutes
    setInterval(async () => {
      try {
        await this.refreshTransactionFeed();
      } catch (error) {
        logger.error('Scheduled transaction update failed', { error: error.message });
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}
