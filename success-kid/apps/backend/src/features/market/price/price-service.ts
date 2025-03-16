/**
 * Price service for token price data
 */
import { TokenPrice, PriceDataPoint, TimePeriod, DataResolution } from '../types';
import { IProviderManager } from '../providers/provider-manager';
import { PriceProvider } from '../providers/provider-interface';
import { ICacheService } from '../caching/cache-service';
import { logger } from '../../../lib/logger';
import { eventBus, EventType } from '../../../lib/event-bus';

/**
 * Price service interface
 */
export interface IPriceService {
  getCurrentPrice(symbol: string): Promise<TokenPrice>;
  getPriceHistory(symbol: string, period: TimePeriod, resolution?: DataResolution): Promise<PriceDataPoint[]>;
  refreshPrice(symbol: string): Promise<TokenPrice>;
  subscribeToPrice(callback: (price: TokenPrice) => void): () => void;
  getMultiplePrices(symbols: string[]): Promise<Record<string, TokenPrice>>;
}

/**
 * Price service implementation
 */
export class PriceService implements IPriceService {
  /**
   * Create a new price service
   * @param providerManager Provider manager for data sources
   * @param cacheService Cache service for data caching
   */
  constructor(
    private providerManager: IProviderManager,
    private cacheService: ICacheService
  ) {
    // Set up scheduled price updates
    this.setupPriceUpdateSchedule();
  }
  
  /**
   * Get current price for the specified token
   * @param symbol Token symbol
   * @returns Current price data
   */
  async getCurrentPrice(symbol: string): Promise<TokenPrice> {
    const cacheKey = `price:${symbol}:current`;
    
    return this.cacheService.getWithFetch<TokenPrice>(
      cacheKey,
      async () => this.fetchCurrentPrice(symbol),
      {
        ttl: 60, // Cache for 1 minute
        staleWhileRevalidate: true,
        staleTtl: 300 // Stale data valid for 5 minutes
      }
    );
  }
  
  /**
   * Get price history for the specified token and time period
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Data resolution (optional)
   * @returns Price history data
   */
  async getPriceHistory(
    symbol: string,
    period: TimePeriod,
    resolution?: DataResolution
  ): Promise<PriceDataPoint[]> {
    // Determine appropriate resolution if not specified
    if (!resolution) {
      resolution = this.getResolutionForPeriod(period);
    }
    
    const cacheKey = `price:${symbol}:history:${period}:${resolution}`;
    
    // Use a longer cache time for historical data
    const cacheTTL = this.getCacheTTLForPeriod(period);
    
    return this.cacheService.getWithFetch<PriceDataPoint[]>(
      cacheKey,
      async () => this.fetchPriceHistory(symbol, period),
      {
        ttl: cacheTTL,
        staleWhileRevalidate: true,
        staleTtl: cacheTTL * 2
      }
    );
  }
  
  /**
   * Force refresh of token price
   * @param symbol Token symbol
   * @returns Fresh price data
   */
  async refreshPrice(symbol: string): Promise<TokenPrice> {
    try {
      // Fetch price directly from provider
      const price = await this.fetchCurrentPrice(symbol);
      
      // Update cache
      const cacheKey = `price:${symbol}:current`;
      await this.cacheService.set(cacheKey, price, {
        ttl: 60, // Cache for 1 minute
        staleWhileRevalidate: true,
        staleTtl: 300 // Stale data valid for 5 minutes
      });
      
      return price;
    } catch (error) {
      logger.error('Error refreshing price', { symbol, error: error.message });
      throw error;
    }
  }
  
  /**
   * Subscribe to price updates
   * @param callback Callback function for price updates
   * @returns Unsubscribe function
   */
  subscribeToPrice(callback: (price: TokenPrice) => void): () => void {
    // Create unique subscription ID
    const subscriptionId = `price-sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up event listener
    const unsubscribe = eventBus.subscribe(EventType.PRICE_UPDATED, (data: any) => {
      if (data && data.price) {
        callback(data.price);
      }
    });
    
    // Return unsubscribe function
    return () => {
      unsubscribe();
      logger.debug(`Price subscription ${subscriptionId} removed`);
    };
  }
  
  /**
   * Get prices for multiple tokens
   * @param symbols Token symbols
   * @returns Map of token prices
   */
  async getMultiplePrices(symbols: string[]): Promise<Record<string, TokenPrice>> {
    // Create promises for all price requests
    const pricePromises = symbols.map(symbol => this.getCurrentPrice(symbol)
      .catch(error => {
        logger.error(`Failed to get price for ${symbol}`, { error: error.message });
        return null;
      })
    );
    
    // Wait for all promises to resolve
    const prices = await Promise.all(pricePromises);
    
    // Create map of results
    const result: Record<string, TokenPrice> = {};
    for (let i = 0; i < symbols.length; i++) {
      if (prices[i]) {
        result[symbols[i]] = prices[i];
      }
    }
    
    return result;
  }
  
  /**
   * Fetch current price from providers
   * @param symbol Token symbol
   * @returns Current price data
   */
  private async fetchCurrentPrice(symbol: string): Promise<TokenPrice> {
    try {
      // Use provider manager to handle failover
      return await this.providerManager.executeWithFailover<TokenPrice>(
        'price',
        async (provider: PriceProvider) => provider.getCurrentPrice(symbol)
      );
    } catch (error) {
      logger.error('Failed to fetch price', { symbol, error: error.message });
      throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
    }
  }
  
  /**
   * Fetch price history from providers
   * @param symbol Token symbol
   * @param period Time period
   * @returns Price history data
   */
  private async fetchPriceHistory(symbol: string, period: TimePeriod): Promise<PriceDataPoint[]> {
    try {
      // Map period to timeframe for provider API
      const timeframe = this.periodToTimeframe(period);
      
      // Use provider manager to handle failover
      return await this.providerManager.executeWithFailover<PriceDataPoint[]>(
        'price',
        async (provider: PriceProvider) => provider.getHistoricalPrices(symbol, timeframe)
      );
    } catch (error) {
      logger.error('Failed to fetch price history', { 
        symbol, 
        period, 
        error: error.message 
      });
      throw new Error(`Failed to fetch price history for ${symbol}: ${error.message}`);
    }
  }
  
  /**
   * Map time period to provider timeframe
   * @param period Time period
   * @returns Timeframe string for provider API
   */
  private periodToTimeframe(period: TimePeriod): string {
    switch (period) {
      case '1h': return '1h';
      case '1d': return '24h';
      case '1w': return '7d';
      case '1m': return '30d';
      case 'all': return 'max';
      default: return '24h';
    }
  }
  
  /**
   * Get appropriate data resolution for a time period
   * @param period Time period
   * @returns Data resolution
   */
  private getResolutionForPeriod(period: TimePeriod): DataResolution {
    switch (period) {
      case '1h': return '1m';
      case '1d': return '15m';
      case '1w': return '1h';
      case '1m': return '4h';
      case 'all': return '1d';
      default: return '15m';
    }
  }
  
  /**
   * Get appropriate cache TTL for a time period
   * @param period Time period
   * @returns Cache TTL in seconds
   */
  private getCacheTTLForPeriod(period: TimePeriod): number {
    switch (period) {
      case '1h': return 60; // 1 minute
      case '1d': return 300; // 5 minutes
      case '1w': return 900; // 15 minutes
      case '1m': return 3600; // 1 hour
      case 'all': return 3600; // 1 hour
      default: return 300; // 5 minutes
    }
  }
  
  /**
   * Set up scheduled price updates
   */
  private setupPriceUpdateSchedule(): void {
    // Update SKC price every minute
    setInterval(async () => {
      try {
        const price = await this.refreshPrice('SKC');
        
        // Emit price update event
        eventBus.publish(EventType.PRICE_UPDATED, { price })
          .catch(err => logger.error('Failed to publish price update event', { error: err.message }));
        
        logger.debug('Scheduled price update completed', {
          symbol: 'SKC',
          price: price.priceUsd,
          change24h: price.priceChange24h
        });
      } catch (error) {
        logger.error('Scheduled price update failed', { error: error.message });
      }
    }, 60 * 1000); // Every minute
  }
}
