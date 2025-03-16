/**
 * Transaction Feed Service
 * 
 * Service for retrieving and monitoring blockchain transactions.
 */
import { logger } from '../../lib/logger';
import { marketDataCache } from '../common/cache-service';
import { EventEmitter } from 'events';
import { 
  TransactionFeedItem, 
  TransactionType, 
  TransactionFeedOptions,
  PaginatedTransactionResult 
} from '../../models/entities/market/transaction.model';
import { priceService } from '../price/service';
import { TokenPrice } from '../../models/entities/market/price.model';
import BigNumber from 'bignumber.js';

/**
 * Service for retrieving and monitoring blockchain transactions
 */
export class TransactionFeedService {
  // Transaction event emitter
  private readonly eventEmitter = new EventEmitter();
  
  // Cache TTLs for different data types (in seconds)
  private readonly TRANSACTIONS_CACHE_TTL = 30; // 30 seconds for transactions
  private readonly VOLUME_CACHE_TTL = 300; // 5 minutes for volume data
  
  // Update interval (in milliseconds)
  private readonly TRANSACTION_UPDATE_INTERVAL = 15000; // 15 seconds
  
  // Active update intervals
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Significant transaction threshold in USD
  private readonly SIGNIFICANT_THRESHOLD = 5000; // $5,000 USD
  
  // Known wallet labels
  private readonly knownWallets: Record<string, string> = {
    // Example: '0x123456789...': 'Treasury Wallet',
  };
  
  /**
   * Create a new transaction feed service
   */
  constructor() {
    // Set max listeners to prevent memory leak warnings
    this.eventEmitter.setMaxListeners(100);
  }
  
  /**
   * Get recent transactions
   * 
   * @param options Transaction feed options
   * @returns Paginated transaction result
   */
  async getTransactions(
    options: TransactionFeedOptions = {}
  ): Promise<PaginatedTransactionResult> {
    const {
      symbol = 'SKC',
      limit = 50,
      offset = 0,
      types,
      minAmount,
      fromTimestamp,
      toTimestamp,
      significantOnly = false
    } = options;
    
    // Build cache key based on parameters
    const cacheKey = `transactions:${symbol}:${limit}:${offset}:${types?.join(',') || 'all'}:${minAmount || 0}:${significantOnly ? 'sig' : 'all'}:${fromTimestamp?.toISOString() || ''}:${toTimestamp?.toISOString() || ''}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // In a real implementation, this would query a blockchain API or database
          // For now, generate some sample transactions
          const transactions = this.generatePlaceholderTransactions(symbol, options);
          
          // Get total count (would come from database in real implementation)
          const total = 1000; // Placeholder
          
          return {
            data: transactions,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + transactions.length < total
            }
          };
        },
        { ttl: this.TRANSACTIONS_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting transactions', { symbol, error });
      
      // Return empty result on error to prevent UI breakage
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      };
    }
  }
  
  /**
   * Generate placeholder transactions for testing
   * 
   * @param symbol Token symbol
   * @param options Transaction feed options
   * @returns Array of transaction feed items
   */
  private generatePlaceholderTransactions(
    symbol: string,
    options: TransactionFeedOptions
  ): TransactionFeedItem[] {
    const {
      limit = 50,
      types = Object.values(TransactionType),
      minAmount = 0,
      significantOnly = false,
      fromTimestamp,
      toTimestamp
    } = options;
    
    const now = new Date();
    const transactions: TransactionFeedItem[] = [];
    const transactionTypes = types as TransactionType[];
    
    // Generate some placeholder data
    for (let i = 0; i < limit; i++) {
      // Random timestamp within the last 24 hours
      const minutesAgo = Math.floor(Math.random() * 24 * 60);
      const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
      
      // Skip if outside requested time range
      if (fromTimestamp && timestamp < fromTimestamp) continue;
      if (toTimestamp && timestamp > toTimestamp) continue;
      
      // Random transaction type
      const type = transactionTypes[
        Math.floor(Math.random() * transactionTypes.length)
      ];
      
      // Random amount (weighted toward smaller amounts)
      let amount = new BigNumber(
        Math.floor(Math.random() * 100000) + 100
      ).toString();
      
      // Significant transactions (1 in 10 chance)
      const isSignificant = Math.random() < 0.1;
      
      if (isSignificant) {
        amount = new BigNumber(
          Math.floor(Math.random() * 1000000) + 100000
        ).toString();
      }
      
      // Skip if below minimum amount
      if (new BigNumber(amount).isLessThan(minAmount)) continue;
      
      // Skip if only want significant transactions
      if (significantOnly && !isSignificant) continue;
      
      // Random price between $0.001 and $0.01
      const price = 0.001 + (Math.random() * 0.009);
      const amountUsd = new BigNumber(amount).multipliedBy(price).toNumber();
      
      // Random addresses
      const fromAddress = this.generateRandomAddress();
      const toAddress = this.generateRandomAddress();
      
      // Add transaction
      transactions.push({
        txHash: this.generateRandomHash(),
        blockNumber: 123456789 - minutesAgo,
        timestamp,
        type,
        amount,
        amountUsd,
        fromAddress,
        toAddress,
        signerLabel: this.knownWallets[fromAddress],
        isSignificant: amountUsd >= this.SIGNIFICANT_THRESHOLD
      });
    }
    
    // Sort by timestamp (newest first)
    return transactions.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  /**
   * Generate random hash for testing
   * 
   * @returns Random hash string
   */
  private generateRandomHash(): string {
    let hash = '0x';
    const characters = '0123456789abcdef';
    
    for (let i = 0; i < 64; i++) {
      hash += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return hash;
  }
  
  /**
   * Generate random wallet address for testing
   * 
   * @returns Random address string
   */
  private generateRandomAddress(): string {
    let address = '0x';
    const characters = '0123456789abcdef';
    
    for (let i = 0; i < 40; i++) {
      address += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return address;
  }
  
  /**
   * Get significant transactions
   * 
   * @param symbol Token symbol
   * @param limit Maximum number of transactions
   * @returns Array of significant transactions
   */
  async getSignificantTransactions(
    symbol = 'SKC',
    limit = 10
  ): Promise<TransactionFeedItem[]> {
    try {
      // Use the main transaction method with significant flag
      const result = await this.getTransactions({
        symbol,
        limit,
        significantOnly: true
      });
      
      return result.data;
    } catch (error) {
      logger.error('Error getting significant transactions', { symbol, error });
      return [];
    }
  }
  
  /**
   * Get transaction volume data
   * 
   * @param symbol Token symbol
   * @param period Time period (1h, 1d, 1w, 1m, all)
   * @returns Volume data with buy/sell breakdown
   */
  async getTransactionVolume(
    symbol = 'SKC',
    period = '1d'
  ): Promise<{ total: number; buy: number; sell: number }> {
    const cacheKey = `transactions:${symbol}:volume:${period}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // In a real implementation, this would query transaction data
          // For now, return placeholder data
          
          // Get current price for conversion
          const priceData = await priceService.getCurrentPrice(symbol);
          
          // Generate random volume data
          const total = Math.floor(Math.random() * 1000000) + 100000;
          const buyPercent = 0.4 + (Math.random() * 0.3); // 40-70% buys
          
          const buy = Math.floor(total * buyPercent);
          const sell = total - buy;
          
          return { total, buy, sell };
        },
        { ttl: this.VOLUME_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting transaction volume', { symbol, period, error });
      return { total: 0, buy: 0, sell: 0 };
    }
  }
  
  /**
   * Start automatic transaction updates
   * 
   * @param symbol Token symbol
   */
  startTransactionUpdates(symbol = 'SKC'): void {
    // Check if already updating
    if (this.updateIntervals.has(symbol)) {
      return;
    }
    
    logger.info(`Starting transaction updates for ${symbol}`);
    
    // Create update interval
    const interval = setInterval(async () => {
      try {
        // Check for new transactions
        await this.checkNewTransactions(symbol);
      } catch (error) {
        logger.error(`Error checking for new transactions for ${symbol}`, { error });
      }
    }, this.TRANSACTION_UPDATE_INTERVAL);
    
    // Store interval for cleanup
    this.updateIntervals.set(symbol, interval);
  }
  
  /**
   * Stop automatic transaction updates
   * 
   * @param symbol Token symbol
   */
  stopTransactionUpdates(symbol = 'SKC'): void {
    const interval = this.updateIntervals.get(symbol);
    
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(symbol);
      logger.info(`Stopped transaction updates for ${symbol}`);
    }
  }
  
  /**
   * Check for new transactions
   * 
   * @param symbol Token symbol
   */
  private async checkNewTransactions(symbol: string): Promise<void> {
    try {
      // In a real implementation, this would query blockchain APIs for new transactions
      // For demonstration, we'll generate a random transaction
      if (Math.random() < 0.3) { // 30% chance of a new transaction
        // Get current price
        const priceData = await priceService.getCurrentPrice(symbol);
        
        // Create mock transaction
        const transaction = this.createMockTransaction(symbol, priceData);
        
        // Emit transaction event
        this.eventEmitter.emit('newTransaction', transaction);
        
        logger.debug('New transaction detected', { 
          symbol, 
          hash: transaction.txHash,
          type: transaction.type,
          amount: transaction.amount
        });
      }
    } catch (error) {
      logger.error('Error checking for new transactions', { symbol, error });
    }
  }
  
  /**
   * Create mock transaction for testing
   * 
   * @param symbol Token symbol
   * @param priceData Current price data
   * @returns Mock transaction
   */
  private createMockTransaction(
    symbol: string,
    priceData: TokenPrice
  ): TransactionFeedItem {
    // Random transaction type
    const types = Object.values(TransactionType);
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Random amount
    const amount = new BigNumber(
      Math.floor(Math.random() * 100000) + 100
    ).toString();
    
    // Calculate USD value
    const amountUsd = new BigNumber(amount)
      .multipliedBy(priceData.priceUsd)
      .toNumber();
    
    // Random addresses
    const fromAddress = this.generateRandomAddress();
    const toAddress = this.generateRandomAddress();
    
    return {
      txHash: this.generateRandomHash(),
      blockNumber: 123456789,
      timestamp: new Date(),
      type,
      amount,
      amountUsd,
      fromAddress,
      toAddress,
      signerLabel: this.knownWallets[fromAddress],
      isSignificant: amountUsd >= this.SIGNIFICANT_THRESHOLD
    };
  }
  
  /**
   * Subscribe to new transactions
   * 
   * @param callback Callback function for new transactions
   * @returns Unsubscribe function
   */
  subscribeToTransactions(
    callback: (transaction: TransactionFeedItem) => void
  ): () => void {
    this.eventEmitter.on('newTransaction', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('newTransaction', callback);
    };
  }
  
  /**
   * Refresh transaction feed
   * 
   * @param symbol Token symbol
   */
  async refreshTransactionFeed(symbol = 'SKC'): Promise<void> {
    try {
      // Invalidate transaction cache
      await marketDataCache.invalidatePattern(`transactions:${symbol}:*`);
      
      logger.info(`Transaction feed cache refreshed for ${symbol}`);
    } catch (error) {
      logger.error('Error refreshing transaction feed', { symbol, error });
    }
  }
  
  /**
   * Get a transaction by hash
   * 
   * @param txHash Transaction hash
   * @param symbol Token symbol
   * @returns Transaction or null if not found
   */
  async getTransaction(
    txHash: string,
    symbol = 'SKC'
  ): Promise<TransactionFeedItem | null> {
    try {
      // In a real implementation, this would query blockchain APIs or database
      // For now, return a mock transaction
      
      // 20% chance of not finding the transaction
      if (Math.random() < 0.2) {
        return null;
      }
      
      // Get current price
      const priceData = await priceService.getCurrentPrice(symbol);
      
      // Create mock transaction with specified hash
      const transaction = this.createMockTransaction(symbol, priceData);
      transaction.txHash = txHash;
      
      return transaction;
    } catch (error) {
      logger.error('Error getting transaction', { txHash, symbol, error });
      return null;
    }
  }
}

// Export singleton instance
export const transactionFeedService = new TransactionFeedService();
