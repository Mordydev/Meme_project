/**
 * Market cap service for token market cap data
 */
import { MarketCapData, MarketCapDataPoint, TimePeriod, DataResolution } from '../types';
import { IPriceService } from '../price/price-service';
import { ICacheService } from '../caching/cache-service';
import { logger } from '../../../lib/logger';
import { eventBus, EventType } from '../../../lib/event-bus';
import BigNumber from 'bignumber.js';

/**
 * Market cap service interface
 */
export interface IMarketCapService {
  getMarketCap(symbol: string): Promise<MarketCapData>;
  getHistoricalMarketCap(symbol: string, period: TimePeriod, resolution?: DataResolution): Promise<MarketCapDataPoint[]>;
  refreshMarketCap(symbol: string): Promise<MarketCapData>;
  getCirculatingSupply(symbol: string): Promise<string>;
  getTotalSupply(symbol: string): Promise<string>;
}

/**
 * Market cap service implementation
 */
export class MarketCapService implements IMarketCapService {
  // Token supply configuration
  private tokenSupply: Record<string, { total: string; circulating: string }> = {
    'SKC': {
      total: '7000000000', // 7 billion total supply
      circulating: '3500000000' // 3.5 billion circulating (50% of total)
    }
  };
  
  /**
   * Create a new market cap service
   * @param priceService Price service for token prices
   * @param cacheService Cache service for data caching
   */
  constructor(
    private priceService: IPriceService,
    private cacheService: ICacheService
  ) {
    // Set up scheduled market cap updates
    this.setupMarketCapUpdateSchedule();
  }
  
  /**
   * Get market cap for the specified token
   * @param symbol Token symbol
   * @returns Market cap data
   */
  async getMarketCap(symbol: string): Promise<MarketCapData> {
    const cacheKey = `marketcap:${symbol}:current`;
    
    return this.cacheService.getWithFetch<MarketCapData>(
      cacheKey,
      async () => this.calculateMarketCap(symbol),
      {
        ttl: 60, // Cache for 1 minute
        staleWhileRevalidate: true,
        staleTtl: 300 // Stale data valid for 5 minutes
      }
    );
  }
  
  /**
   * Get historical market cap for the specified token
   * @param symbol Token symbol
   * @param period Time period
   * @param resolution Data resolution (optional)
   * @returns Historical market cap data
   */
  async getHistoricalMarketCap(
    symbol: string,
    period: TimePeriod,
    resolution?: DataResolution
  ): Promise<MarketCapDataPoint[]> {
    // Determine appropriate resolution if not specified
    if (!resolution) {
      resolution = this.getResolutionForPeriod(period);
    }
    
    const cacheKey = `marketcap:${symbol}:history:${period}:${resolution}`;
    
    // Use a longer cache time for historical data
    const cacheTTL = this.getCacheTTLForPeriod(period);
    
    return this.cacheService.getWithFetch<MarketCapDataPoint[]>(
      cacheKey,
      async () => this.calculateHistoricalMarketCap(symbol, period),
      {
        ttl: cacheTTL,
        staleWhileRevalidate: true,
        staleTtl: cacheTTL * 2
      }
    );
  }
  
  /**
   * Force refresh of market cap data
   * @param symbol Token symbol
   * @returns Fresh market cap data
   */
  async refreshMarketCap(symbol: string): Promise<MarketCapData> {
    try {
      // Calculate fresh market cap
      const marketCap = await this.calculateMarketCap(symbol);
      
      // Update cache
      const cacheKey = `marketcap:${symbol}:current`;
      await this.cacheService.set(cacheKey, marketCap, {
        ttl: 60, // Cache for 1 minute
        staleWhileRevalidate: true,
        staleTtl: 300 // Stale data valid for 5 minutes
      });
      
      return marketCap;
    } catch (error) {
      logger.error('Error refreshing market cap', { symbol, error: error.message });
      throw error;
    }
  }
  
  /**
   * Get circulating supply for the specified token
   * @param symbol Token symbol
   * @returns Circulating supply
   */
  async getCirculatingSupply(symbol: string): Promise<string> {
    if (!this.tokenSupply[symbol]) {
      throw new Error(`Token supply not configured for ${symbol}`);
    }
    
    return this.tokenSupply[symbol].circulating;
  }
  
  /**
   * Get total supply for the specified token
   * @param symbol Token symbol
   * @returns Total supply
   */
  async getTotalSupply(symbol: string): Promise<string> {
    if (!this.tokenSupply[symbol]) {
      throw new Error(`Token supply not configured for ${symbol}`);
    }
    
    return this.tokenSupply[symbol].total;
  }
  
  /**
   * Calculate market cap for a token
   * @param symbol Token symbol
   * @returns Market cap data
   */
  private async calculateMarketCap(symbol: string): Promise<MarketCapData> {
    try {
      // Get token price
      const price = await this.priceService.getCurrentPrice(symbol);
      
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
      
      // Create market cap data
      const marketCapData: MarketCapData = {
        symbol,
        marketCap,
        fullyDilutedMarketCap,
        circulatingSupply,
        totalSupply,
        price: price.priceUsd,
        lastUpdated: new Date()
      };
      
      // Check for market cap milestones
      this.checkMarketCapMilestones(symbol, marketCapData);
      
      return marketCapData;
    } catch (error) {
      logger.error('Failed to calculate market cap', { symbol, error: error.message });
      throw error;
    }
  }
  
  /**
   * Calculate historical market cap data
   * @param symbol Token symbol
   * @param period Time period
   * @returns Historical market cap data
   */
  private async calculateHistoricalMarketCap(
    symbol: string,
    period: TimePeriod
  ): Promise<MarketCapDataPoint[]> {
    try {
      // Get historical price data
      const priceHistory = await this.priceService.getPriceHistory(symbol, period);
      
      // For historical data, we use the current circulating supply
      // In a real implementation, you would use historical supply data if available
      const circulatingSupply = await this.getCirculatingSupply(symbol);
      
      // Calculate market cap for each price point
      return priceHistory.map(point => ({
        timestamp: point.timestamp,
        marketCap: new BigNumber(point.price)
          .multipliedBy(circulatingSupply)
          .toString(),
        price: point.price
      }));
    } catch (error) {
      logger.error('Failed to calculate historical market cap', { 
        symbol, 
        period, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * Check for market cap milestones
   * @param symbol Token symbol
   * @param marketCapData Market cap data
   */
  private checkMarketCapMilestones(symbol: string, marketCapData: MarketCapData): void {
    // Define milestone thresholds (in USD)
    const milestones = [
      100000, // $100K
      500000, // $500K
      1000000, // $1M
      5000000, // $5M
      10000000, // $10M
      50000000, // $50M
      100000000, // $100M
    ];
    
    // Convert market cap to a number for comparison
    const marketCapValue = new BigNumber(marketCapData.marketCap);
    
    // Find the milestone that was just crossed (if any)
    for (const milestone of milestones) {
      const thresholdBN = new BigNumber(milestone);
      
      // Check if market cap is within 1% of the milestone
      const lowerBound = thresholdBN.multipliedBy(0.99);
      const upperBound = thresholdBN.multipliedBy(1.01);
      
      if (marketCapValue.isGreaterThanOrEqualTo(lowerBound) && 
          marketCapValue.isLessThanOrEqualTo(upperBound)) {
        // Get previously reached milestone from cache
        this.cacheService.get<number>(`milestone:${symbol}:reached`).then(lastMilestone => {
          // Only trigger if this is a new milestone or we don't have a last milestone
          if (!lastMilestone || milestone > lastMilestone) {
            logger.info(`Market cap milestone reached: $${milestone.toLocaleString()}`, {
              symbol,
              marketCap: marketCapData.marketCap,
              milestone
            });
            
            // Emit milestone event
            eventBus.publish(EventType.MILESTONE_REACHED, {
              symbol,
              milestone: `$${milestone.toLocaleString()}`,
              value: marketCapData.marketCap,
              timestamp: new Date()
            }).catch(err => {
              logger.error('Failed to publish milestone event', { error: err.message });
            });
            
            // Update last reached milestone
            this.cacheService.set(`milestone:${symbol}:reached`, milestone, {
              ttl: 86400 * 30 // Cache for 30 days
            }).catch(err => {
              logger.error('Failed to update milestone cache', { error: err.message });
            });
          }
        }).catch(err => {
          logger.error('Error checking milestone cache', { error: err.message });
        });
        
        break;
      }
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
   * Set up scheduled market cap updates
   */
  private setupMarketCapUpdateSchedule(): void {
    // Update SKC market cap every minute
    setInterval(async () => {
      try {
        const marketCap = await this.refreshMarketCap('SKC');
        
        // Emit market cap update event
        eventBus.publish(EventType.MARKET_CAP_UPDATED, { marketCap })
          .catch(err => logger.error('Failed to publish market cap update event', { error: err.message }));
        
        logger.debug('Scheduled market cap update completed', {
          symbol: 'SKC',
          marketCap: marketCap.marketCap,
          price: marketCap.price
        });
      } catch (error) {
        logger.error('Scheduled market cap update failed', { error: error.message });
      }
    }, 60 * 1000); // Every minute
  }
}
