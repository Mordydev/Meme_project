/**
 * Birdeye Price Provider
 * 
 * Provider for fetching price data from Birdeye API.
 */
import axios from 'axios';
import { logger } from '../../../lib/logger';
import { PriceProvider, ProviderCapability, ProviderUnavailableError, ProviderRateLimitError } from '../../providers/types';
import { rateLimiter } from '../../providers/rate-limiter';
import { TokenPrice, PricePoint, TimePeriod } from '../../../models/entities/market/price.model';
import { env } from '../../../config';

/**
 * Birdeye API response for token info
 */
interface BirdeyeTokenResponse {
  success: boolean;
  data: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    price: number;
    price_24h_change: number;
    volume_24h: number;
    market_cap: string;
    fully_diluted_market_cap: string;
  };
}

/**
 * Birdeye API response for price history
 */
interface BirdeyePriceHistoryResponse {
  success: boolean;
  data: {
    items: Array<{
      time: number;
      value: number;
      volume?: number;
    }>;
  };
}

/**
 * Birdeye price provider implementation
 */
export class BirdeyeProvider implements PriceProvider {
  // API endpoints
  private readonly API_BASE_URL = 'https://public-api.birdeye.so';
  private readonly API_KEY: string;
  
  // Token address mapping (symbol -> contract address)
  private readonly tokenAddresses: Record<string, string> = {
    'SKC': '0xYourSuccessKidTokenAddress', // Replace with actual token address
  };
  
  /**
   * Create a new Birdeye provider instance
   * 
   * @param apiKey Birdeye API key
   */
  constructor(apiKey?: string) {
    this.API_KEY = apiKey || env.BIRDEYE_API_KEY || '';
    
    if (!this.API_KEY) {
      logger.warn('Birdeye API key not provided, API may be rate limited');
    }
  }
  
  /**
   * Get provider name
   * 
   * @returns Provider name
   */
  getName(): string {
    return 'Birdeye';
  }
  
  /**
   * Get provider capabilities
   * 
   * @returns Array of provider capabilities
   */
  getCapabilities(): ProviderCapability[] {
    return [
      ProviderCapability.CURRENT_PRICE,
      ProviderCapability.HISTORICAL_PRICE,
      ProviderCapability.MARKET_CAP,
      ProviderCapability.VOLUME_DATA,
      ProviderCapability.MULTIPLE_TOKENS
    ];
  }
  
  /**
   * Check if provider is available
   * 
   * @returns True if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check rate limit
      const rateLimitCheck = await rateLimiter.checkRateLimit('birdeye', 'health');
      
      if (!rateLimitCheck.allowed) {
        logger.warn('Birdeye rate limit exceeded during health check', {
          retryAfter: rateLimitCheck.retryAfter
        });
        return false;
      }
      
      // If API key is missing, assume unavailable
      if (!this.API_KEY) {
        return false;
      }
      
      // Make a simple API call to check if service is responding
      const response = await axios.get(`${this.API_BASE_URL}/public/tokenlist`, {
        params: { limit: 1 },
        headers: { 'X-API-KEY': this.API_KEY },
        timeout: 3000 // Short timeout for health check
      });
      
      return response.status === 200 && response.data.success === true;
    } catch (error) {
      logger.debug('Birdeye health check failed', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  
  /**
   * Get current price for a token
   * 
   * @param symbol Token symbol
   * @returns Token price data
   */
  async getCurrentPrice(symbol: string): Promise<TokenPrice> {
    // Check rate limit
    const rateLimit = await rateLimiter.checkRateLimit('birdeye', 'price');
    
    if (!rateLimit.allowed) {
      throw new ProviderRateLimitError(
        'Birdeye',
        'getCurrentPrice',
        rateLimit.retryAfter
      );
    }
    
    try {
      // Ensure we have a token address
      const tokenAddress = this.tokenAddresses[symbol];
      
      if (!tokenAddress) {
        throw new Error(`Token address not found for symbol: ${symbol}`);
      }
      
      // Fetch token information
      const response = await axios.get<BirdeyeTokenResponse>(
        `${this.API_BASE_URL}/public/token_info`, 
        {
          params: { address: tokenAddress },
          headers: { 'X-API-KEY': this.API_KEY },
          timeout: 5000
        }
      );
      
      // Validate response
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(`Invalid response from Birdeye API for ${symbol}`);
      }
      
      const tokenData = response.data.data;
      
      // Create token price object
      const result: TokenPrice = {
        symbol,
        priceUsd: tokenData.price,
        priceChange24h: tokenData.price_24h_change,
        volume24h: tokenData.volume_24h,
        lastUpdated: new Date(),
        source: this.getName()
      };
      
      return result;
    } catch (error) {
      // Handle specific error types
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 429) {
          throw new ProviderRateLimitError(
            'Birdeye',
            'getCurrentPrice',
            error.response.headers['retry-after'] ? 
              parseInt(error.response.headers['retry-after'], 10) : 
              60
          );
        }
        
        if (error.response.status >= 500) {
          throw new ProviderUnavailableError(
            'Birdeye',
            'getCurrentPrice',
            error
          );
        }
      }
      
      // Log and rethrow
      logger.error('Birdeye getCurrentPrice error', {
        symbol,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Get historical prices for a token
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @returns Array of price points
   */
  async getHistoricalPrices(symbol: string, period: TimePeriod): Promise<PricePoint[]> {
    // Check rate limit
    const rateLimit = await rateLimiter.checkRateLimit('birdeye', 'history');
    
    if (!rateLimit.allowed) {
      throw new ProviderRateLimitError(
        'Birdeye',
        'getHistoricalPrices',
        rateLimit.retryAfter
      );
    }
    
    try {
      // Ensure we have a token address
      const tokenAddress = this.tokenAddresses[symbol];
      
      if (!tokenAddress) {
        throw new Error(`Token address not found for symbol: ${symbol}`);
      }
      
      // Convert period to API param
      const resolution = this.getResolutionForPeriod(period);
      const { timeFrom, timeTo } = this.getTimeRangeForPeriod(period);
      
      // Fetch historical prices
      const response = await axios.get<BirdeyePriceHistoryResponse>(
        `${this.API_BASE_URL}/public/price_history`, 
        {
          params: {
            address: tokenAddress,
            type: 'price',
            timeFrom,
            timeTo,
            resolution
          },
          headers: { 'X-API-KEY': this.API_KEY },
          timeout: 5000
        }
      );
      
      // Validate response
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(`Invalid response from Birdeye API for ${symbol} history`);
      }
      
      // Convert to price points
      const pricePoints: PricePoint[] = response.data.data.items.map(item => ({
        timestamp: new Date(item.time * 1000),
        price: item.value,
        volume: item.volume
      }));
      
      return pricePoints;
    } catch (error) {
      // Handle specific error types
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 429) {
          throw new ProviderRateLimitError(
            'Birdeye',
            'getHistoricalPrices',
            error.response.headers['retry-after'] ? 
              parseInt(error.response.headers['retry-after'], 10) : 
              60
          );
        }
      }
      
      // Log error
      logger.error('Birdeye getHistoricalPrices error', {
        symbol,
        period,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return empty array on error
      return [];
    }
  }
  
  /**
   * Convert period to resolution parameter
   * 
   * @param period Time period
   * @returns Resolution for API
   */
  private getResolutionForPeriod(period: TimePeriod): string {
    switch (period) {
      case TimePeriod.HOUR_1:
        return '1';  // 1 minute resolution
      case TimePeriod.DAY_1:
        return '15'; // 15 minute resolution
      case TimePeriod.WEEK_1:
        return '60'; // 1 hour resolution
      case TimePeriod.MONTH_1:
        return '240'; // 4 hour resolution
      case TimePeriod.ALL:
        return '1D'; // 1 day resolution
      default:
        return '60'; // Default to 1 hour
    }
  }
  
  /**
   * Calculate time range for period
   * 
   * @param period Time period
   * @returns From and to timestamps
   */
  private getTimeRangeForPeriod(period: TimePeriod): { timeFrom: number; timeTo: number } {
    const now = Math.floor(Date.now() / 1000);
    let timeFrom: number;
    
    switch (period) {
      case TimePeriod.HOUR_1:
        timeFrom = now - 60 * 60;
        break;
      case TimePeriod.DAY_1:
        timeFrom = now - 24 * 60 * 60;
        break;
      case TimePeriod.WEEK_1:
        timeFrom = now - 7 * 24 * 60 * 60;
        break;
      case TimePeriod.MONTH_1:
        timeFrom = now - 30 * 24 * 60 * 60;
        break;
      case TimePeriod.ALL:
        timeFrom = now - 365 * 24 * 60 * 60; // 1 year as default for 'all'
        break;
      default:
        timeFrom = now - 24 * 60 * 60;
    }
    
    return { timeFrom, timeTo: now };
  }
}
