/**
 * Market Cap Service
 * 
 * Service for calculating and tracking token market capitalization.
 */
import { logger } from '../../lib/logger';
import { marketDataCache } from '../common/cache-service';
import { priceService } from '../price/service';
import { wallet } from '../../blockchain/wallet';
import { EventEmitter } from 'events';
import { MarketCapData, MarketCapDataPoint } from '../../models/entities/market/marketcap.model';
import { TimePeriod, DataResolution } from '../../models/entities/market/price.model';
import BigNumber from 'bignumber.js';

/**
 * Service for calculating and tracking token market capitalization
 */
export class MarketCapService {
  // Market cap update event emitter
  private readonly eventEmitter = new EventEmitter();
  
  // Cache TTLs for different data types (in seconds)
  private readonly MARKET_CAP_CACHE_TTL = 300; // 5 minutes for market cap
  private readonly SUPPLY_CACHE_TTL = 3600; // 1 hour for supply data
  private readonly HISTORY_CACHE_TTL = 3600; // 1 hour for historical data
  
  // Token supply configuration
  private readonly tokenSupply: Record<string, { total: string; circulating: string }> = {
    'SKC': {
      total: '7000000000', // 7 billion total supply per the whitepaper
      circulating: '3500000000' // 50% in circulation initially (example)
    }
  };
  
  /**
   * Create a new market cap service
   */
  constructor() {
    // Set max listeners to prevent memory leak warnings
    this.eventEmitter.setMaxListeners(100);
    
    // Initialize BigNumber configuration for financial calculations
    BigNumber.config({
      EXPONENTIAL_AT: [-20, 20],
      DECIMAL_PLACES: 18,
      ROUNDING_MODE: BigNumber.ROUND_HALF_UP
    });
  }
  
  /**
   * Get market cap data for a token
   * 
   * @param symbol Token symbol
   * @param forceRefresh Force refresh from sources
   * @returns Market cap data
   */
  async getMarketCap(symbol: string, forceRefresh = false): Promise<MarketCapData> {
    const cacheKey = `marketcap:${symbol}`;
    
    // If force refresh, skip cache
    if (forceRefresh) {
      return this.calculateMarketCap(symbol);
    }
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        () => this.calculateMarketCap(symbol),
        { ttl: this.MARKET_CAP_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting market cap', { symbol, error });
      throw error;
    }
  }
  
  /**
   * Calculate market cap for a token
   * 
   * @param symbol Token symbol
   * @returns Market cap data
   */
  private async calculateMarketCap(symbol: string): Promise<MarketCapData> {
    logger.debug('Calculating market cap', { symbol });
    
    try {
      // Get current price
      const price = await priceService.getCurrentPrice(symbol);
      
      // Get supply data
      const circulatingSupply = await this.getCirculatingSupply(symbol);
      const totalSupply = await this.getTotalSupply(symbol);
      
      // Calculate market caps using BigNumber for precision
      const marketCap = new BigNumber(price.priceUsd)
        .multipliedBy(circulatingSupply)
        .toString();
        
      const fullyDilutedMarketCap = new BigNumber(price.priceUsd)
        .multipliedBy(totalSupply)
        .toString();
      
      const marketCapData: MarketCapData = {
        symbol,
        marketCap,
        fullyDilutedMarketCap,
        circulatingSupply,
        totalSupply,
        price: price.priceUsd,
        lastUpdated: new Date()
      };
      
      // Record data point in history
      await this.recordMarketCapDataPoint(marketCapData);
      
      return marketCapData;
    } catch (error) {
      logger.error('Error calculating market cap', { symbol, error });
      throw error;
    }
  }
  
  /**
   * Get circulating supply for a token
   * 
   * @param symbol Token symbol
   * @returns Circulating supply as string
   */
  async getCirculatingSupply(symbol: string): Promise<string> {
    const cacheKey = `supply:${symbol}:circulating`;
    
    try {
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Check if we have a hard-coded value
          if (this.tokenSupply[symbol]) {
            return this.tokenSupply[symbol].circulating;
          }
          
          // For other tokens, query the blockchain
          // This is a placeholder for actual blockchain integration
          try {
            // In a real implementation, this would query the blockchain
            // For example: return wallet.getCirculatingSupply(symbol);
            logger.warn('Using placeholder circulating supply', { symbol });
            return '100000000'; // Placeholder value
          } catch (blockchainError) {
            logger.error('Blockchain query error for circulating supply', { 
              symbol, 
              error: blockchainError 
            });
            throw blockchainError;
          }
        },
        { ttl: this.SUPPLY_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting circulating supply', { symbol, error });
      throw error;
    }
  }
  
  /**
   * Get total supply for a token
   * 
   * @param symbol Token symbol
   * @returns Total supply as string
   */
  async getTotalSupply(symbol: string): Promise<string> {
    const cacheKey = `supply:${symbol}:total`;
    
    try {
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // Check if we have a hard-coded value
          if (this.tokenSupply[symbol]) {
            return this.tokenSupply[symbol].total;
          }
          
          // For other tokens, query the blockchain
          // This is a placeholder for actual blockchain integration
          try {
            // In a real implementation, this would query the blockchain
            // For example: return wallet.getTotalSupply(symbol);
            logger.warn('Using placeholder total supply', { symbol });
            return '1000000000'; // Placeholder value
          } catch (blockchainError) {
            logger.error('Blockchain query error for total supply', { 
              symbol, 
              error: blockchainError 
            });
            throw blockchainError;
          }
        },
        { ttl: this.SUPPLY_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting total supply', { symbol, error });
      throw error;
    }
  }
  
  /**
   * Record a market cap data point in history
   * 
   * @param data Market cap data
   */
  private async recordMarketCapDataPoint(data: MarketCapData): Promise<void> {
    // This is a placeholder for where historical data would be stored
    // In a real implementation, this would write to a database
    
    // For now, just log that we would record this
    logger.debug('Recording market cap data point in history', { 
      symbol: data.symbol, 
      marketCap: data.marketCap,
      timestamp: data.lastUpdated 
    });
    
    // TODO: Implement historical data storage
  }
  
  /**
   * Get historical market cap data
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Optional data resolution
   * @returns Array of market cap data points
   */
  async getHistoricalMarketCap(
    symbol: string,
    period: TimePeriod,
    resolution?: DataResolution
  ): Promise<MarketCapDataPoint[]> {
    const cacheKey = `marketcap:${symbol}:history:${period}${resolution ? `:${resolution}` : ''}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        async () => {
          // This is a placeholder for where historical data would be retrieved
          // In a real implementation, this would query a database
          
          logger.debug('Fetching historical market cap data', { 
            symbol, 
            period,
            resolution 
          });
          
          // For now, return generated data for testing
          return this.generatePlaceholderMarketCapData(symbol, period, resolution);
        },
        { ttl: this.HISTORY_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting historical market cap data', { 
        symbol, 
        period, 
        error 
      });
      return []; // Return empty array on error to prevent UI breakage
    }
  }
  
  /**
   * Generate placeholder market cap data for testing
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Optional data resolution
   * @returns Array of market cap data points
   */
  private generatePlaceholderMarketCapData(
    symbol: string,
    period: TimePeriod,
    resolution?: DataResolution
  ): MarketCapDataPoint[] {
    // Generate some placeholder data based on the requested period
    const now = new Date();
    const dataPoints: MarketCapDataPoint[] = [];
    
    // Determine number of points and interval based on period and resolution
    let numPoints = 30;
    let intervalMs = 24 * 60 * 60 * 1000; // Default to daily
    
    switch (period) {
      case TimePeriod.HOUR_1:
        numPoints = 60;
        intervalMs = 60 * 1000; // 1 minute
        break;
      case TimePeriod.DAY_1:
        numPoints = 24;
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case TimePeriod.WEEK_1:
        numPoints = 7;
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case TimePeriod.MONTH_1:
        numPoints = 30;
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case TimePeriod.ALL:
        numPoints = 60;
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
    }
    
    // Generate the data points
    const baseMarketCap = new BigNumber(1000000); // Base value for generation
    const volatility = 0.05; // Volatility factor
    
    let currentMarketCap = baseMarketCap;
    
    for (let i = numPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * intervalMs));
      
      // Generate a random change with slight upward bias
      const change = (Math.random() * 2 - 0.9) * volatility;
      currentMarketCap = currentMarketCap.multipliedBy(1 + change);
      
      dataPoints.push({
        timestamp,
        marketCap: currentMarketCap.toString(),
        price: currentMarketCap.dividedBy(this.tokenSupply[symbol]?.circulating || '100000000').toNumber()
      });
    }
    
    return dataPoints;
  }
  
  /**
   * Refresh market cap data for a token
   * 
   * @param symbol Token symbol
   * @returns Fresh market cap data
   */
  async refreshMarketCap(symbol: string): Promise<MarketCapData> {
    return this.getMarketCap(symbol, true);
  }
  
  /**
   * Get market cap for multiple tokens
   * 
   * @param symbols Array of token symbols
   * @returns Record of symbol to market cap data
   */
  async getMultipleMarketCaps(symbols: string[]): Promise<Record<string, MarketCapData>> {
    const result: Record<string, MarketCapData> = {};
    
    // Fetch all market caps in parallel
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          result[symbol] = await this.getMarketCap(symbol);
        } catch (error) {
          logger.error('Error getting market cap for symbol', { symbol, error });
          // Leave this symbol out of the results
        }
      })
    );
    
    return result;
  }
  
  /**
   * Subscribe to market cap updates
   * 
   * @param callback Callback function for market cap updates
   * @returns Unsubscribe function
   */
  subscribeToMarketCapUpdates(callback: (data: MarketCapData) => void): () => void {
    this.eventEmitter.on('marketCapUpdate', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('marketCapUpdate', callback);
    };
  }
  
  /**
   * Get market cap change over period
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @returns Market cap change percentage
   */
  async getMarketCapChange(symbol: string, period: TimePeriod): Promise<number> {
    try {
      // Get historical data
      const data = await this.getHistoricalMarketCap(symbol, period);
      
      if (data.length < 2) {
        return 0;
      }
      
      // Calculate change
      const startMarketCap = new BigNumber(data[0].marketCap);
      const endMarketCap = new BigNumber(data[data.length - 1].marketCap);
      
      // Calculate percentage change
      return endMarketCap
        .minus(startMarketCap)
        .dividedBy(startMarketCap)
        .multipliedBy(100)
        .toNumber();
    } catch (error) {
      logger.error('Error calculating market cap change', { symbol, period, error });
      return 0;
    }
  }
}

// Export singleton instance
export const marketCapService = new MarketCapService();
