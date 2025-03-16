/**
 * Price Service
 * 
 * Service for retrieving and managing token price data from multiple providers.
 */
import { logger } from '../../lib/logger';
import { providerManager } from '../providers/manager';
import { marketDataCache } from '../common/cache-service';
import { PriceProvider, ProviderCapability } from '../providers/types';
import { TokenPrice, PricePoint, TimePeriod, DataResolution, PriceUpdateEvent } from '../../models/entities/market/price.model';
import { EventEmitter } from 'events';

/**
 * Service for retrieving and managing token price data
 */
export class PriceService {
  // Price update event emitter
  private readonly eventEmitter = new EventEmitter();
  
  // Cache TTLs for different data types (in seconds)
  private readonly PRICE_CACHE_TTL = 60; // 1 minute for current price
  private readonly HISTORY_CACHE_TTL = 300; // 5 minutes for historical data
  
  // Update intervals (in milliseconds)
  private readonly PRICE_UPDATE_INTERVAL = 60000; // 1 minute
  
  // Active update intervals
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Create a new price service
   */
  constructor() {
    // Set max listeners to prevent memory leak warnings
    this.eventEmitter.setMaxListeners(100);
  }
  
  /**
   * Get current price for a token
   * 
   * @param symbol Token symbol
   * @param forceRefresh Force refresh from provider
   * @returns Current token price
   */
  async getCurrentPrice(symbol: string, forceRefresh = false): Promise<TokenPrice> {
    const cacheKey = `price:${symbol}:current`;
    
    // If force refresh, skip cache
    if (forceRefresh) {
      return this.fetchPrice(symbol);
    }
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        () => this.fetchPrice(symbol),
        { ttl: this.PRICE_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting current price', { symbol, error });
      throw error;
    }
  }
  
  /**
   * Fetch price from providers
   * 
   * @param symbol Token symbol
   * @returns Token price
   */
  private async fetchPrice(symbol: string): Promise<TokenPrice> {
    logger.debug('Fetching price from providers', { symbol });
    
    try {
      // Get price from provider manager (with failover)
      const price = await providerManager.executeWithFailover<TokenPrice>(
        'price',
        (provider: PriceProvider) => provider.getCurrentPrice(symbol)
      );
      
      // Record data point in price history
      await this.recordPricePoint(symbol, price);
      
      return price;
    } catch (error) {
      logger.error('All price providers failed', { symbol, error });
      throw error;
    }
  }
  
  /**
   * Record a price point in history
   * 
   * @param symbol Token symbol
   * @param price Price data
   */
  private async recordPricePoint(symbol: string, price: TokenPrice): Promise<void> {
    // This is a placeholder for where historical data would be stored
    // In a real implementation, this would write to a database
    
    // For now, just log that we would record this
    logger.debug('Recording price point in history', { 
      symbol, 
      price: price.priceUsd,
      timestamp: new Date() 
    });
    
    // TODO: Implement historical data storage
  }
  
  /**
   * Get historical prices for a token
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Optional data resolution
   * @returns Array of price points
   */
  async getHistoricalPrices(
    symbol: string,
    period: TimePeriod,
    resolution?: DataResolution
  ): Promise<PricePoint[]> {
    const cacheKey = `price:${symbol}:history:${period}${resolution ? `:${resolution}` : ''}`;
    
    try {
      // Get from cache with automatic fetch
      return await marketDataCache.getWithFetch(
        cacheKey,
        () => this.fetchHistoricalPrices(symbol, period, resolution),
        { ttl: this.HISTORY_CACHE_TTL }
      );
    } catch (error) {
      logger.error('Error getting historical prices', { symbol, period, error });
      return []; // Return empty array on error to prevent UI breakage
    }
  }
  
  /**
   * Fetch historical prices from providers
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Optional data resolution
   * @returns Array of price points
   */
  private async fetchHistoricalPrices(
    symbol: string,
    period: TimePeriod,
    resolution?: DataResolution
  ): Promise<PricePoint[]> {
    logger.debug('Fetching historical prices from providers', { 
      symbol, 
      period,
      resolution 
    });
    
    try {
      // Find providers with historical data capability
      const providers = providerManager.getProvidersWithCapability(
        ProviderCapability.HISTORICAL_PRICE
      );
      
      if (providers.length === 0) {
        logger.warn('No providers with historical price capability');
        return [];
      }
      
      // Get historical data from provider manager (with failover)
      const history = await providerManager.executeWithFailover<PricePoint[]>(
        'price',
        (provider: PriceProvider) => provider.getHistoricalPrices(symbol, period)
      );
      
      // Apply resolution if specified
      return resolution ? 
        this.applyResolution(history, resolution) : 
        history;
    } catch (error) {
      logger.error('All historical price providers failed', { 
        symbol, 
        period,
        error 
      });
      return [];
    }
  }
  
  /**
   * Apply resolution to historical data
   * 
   * @param data Historical data points
   * @param resolution Target resolution
   * @returns Resampled data points
   */
  private applyResolution(data: PricePoint[], resolution: DataResolution): PricePoint[] {
    if (data.length === 0) {
      return [];
    }
    
    // For now, just return the original data
    // In a real implementation, this would resample the data to the target resolution
    logger.debug('Applying resolution to historical data', { 
      dataPoints: data.length,
      resolution 
    });
    
    // TODO: Implement data resampling
    return data;
  }
  
  /**
   * Get multiple token prices
   * 
   * @param symbols Array of token symbols
   * @returns Map of symbol to price
   */
  async getMultiplePrices(symbols: string[]): Promise<Record<string, TokenPrice>> {
    const result: Record<string, TokenPrice> = {};
    
    // Fetch all prices in parallel
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          result[symbol] = await this.getCurrentPrice(symbol);
        } catch (error) {
          logger.error('Error getting price for symbol', { symbol, error });
          // Leave this symbol out of the results
        }
      })
    );
    
    return result;
  }
  
  /**
   * Start automatic price updates for a token
   * 
   * @param symbol Token symbol
   */
  startPriceUpdates(symbol: string): void {
    // Check if already updating
    if (this.updateIntervals.has(symbol)) {
      return;
    }
    
    logger.info(`Starting price updates for ${symbol}`);
    
    // Create update interval
    const interval = setInterval(async () => {
      try {
        // Get fresh price data
        const oldPrice = await this.getCurrentPrice(symbol);
        const newPrice = await this.getCurrentPrice(symbol, true);
        
        // Calculate change
        const changePercent = ((newPrice.priceUsd - oldPrice.priceUsd) / oldPrice.priceUsd) * 100;
        
        // Emit price update event
        const updateEvent: PriceUpdateEvent = {
          symbol,
          newPrice: newPrice.priceUsd,
          oldPrice: oldPrice.priceUsd,
          changePercent,
          timestamp: new Date()
        };
        
        this.eventEmitter.emit('priceUpdate', updateEvent);
        
        logger.debug(`Price updated for ${symbol}`, {
          price: newPrice.priceUsd,
          change: changePercent.toFixed(2) + '%'
        });
      } catch (error) {
        logger.error(`Error updating price for ${symbol}`, { error });
      }
    }, this.PRICE_UPDATE_INTERVAL);
    
    // Store interval for cleanup
    this.updateIntervals.set(symbol, interval);
  }
  
  /**
   * Stop automatic price updates for a token
   * 
   * @param symbol Token symbol
   */
  stopPriceUpdates(symbol: string): void {
    const interval = this.updateIntervals.get(symbol);
    
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(symbol);
      logger.info(`Stopped price updates for ${symbol}`);
    }
  }
  
  /**
   * Subscribe to price updates
   * 
   * @param callback Callback function for price updates
   * @returns Unsubscribe function
   */
  subscribeToPriceUpdates(callback: (event: PriceUpdateEvent) => void): () => void {
    this.eventEmitter.on('priceUpdate', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('priceUpdate', callback);
    };
  }
  
  /**
   * Refresh price data for a token
   * 
   * @param symbol Token symbol
   * @returns Fresh price data
   */
  async refreshPrice(symbol: string): Promise<TokenPrice> {
    return this.getCurrentPrice(symbol, true);
  }
  
  /**
   * Get price comparison between tokens
   * 
   * @param baseSymbol Base token symbol
   * @param quoteSymbols Quote token symbols
   * @returns Price ratios
   */
  async getPriceComparison(
    baseSymbol: string, 
    quoteSymbols: string[]
  ): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    
    try {
      // Get base price
      const basePrice = await this.getCurrentPrice(baseSymbol);
      
      // Get all quote prices
      const quotePrices = await this.getMultiplePrices(quoteSymbols);
      
      // Calculate ratios
      for (const symbol of quoteSymbols) {
        if (quotePrices[symbol]) {
          result[symbol] = basePrice.priceUsd / quotePrices[symbol].priceUsd;
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting price comparison', { 
        baseSymbol, 
        quoteSymbols, 
        error 
      });
      return {};
    }
  }
}

// Export singleton instance
export const priceService = new PriceService();
