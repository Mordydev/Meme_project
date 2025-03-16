/**
 * Solscan Price Provider
 * 
 * Provider for fetching price data from Solscan API.
 */
import axios from 'axios';
import { logger } from '../../../lib/logger';
import { PriceProvider, ProviderCapability, ProviderUnavailableError, ProviderRateLimitError } from '../../providers/types';
import { rateLimiter } from '../../providers/rate-limiter';
import { TokenPrice, PricePoint, TimePeriod } from '../../../models/entities/market/price.model';
import { env } from '../../../config';

/**
 * Solscan API response for token info
 */
interface SolscanTokenResponse {
  success: boolean;
  data: {
    symbol: string;
    name: string;
    price: number;
    priceChange: number;
    volume24h: number;
    marketCap: number;
    supply: {
      circulating: string;
      total: string;
    };
    holders: number;
  };
}

/**
 * Solscan price provider implementation
 */
export class SolscanProvider implements PriceProvider {
  // API endpoints
  private readonly API_BASE_URL = 'https://api.solscan.io';
  private readonly API_KEY: string;
  
  // Token address mapping (symbol -> contract address)
  private readonly tokenAddresses: Record<string, string> = {
    'SKC': '0xYourSuccessKidTokenAddress', // Replace with actual token address
  };
  
  /**
   * Create a new Solscan provider instance
   * 
   * @param apiKey Solscan API key
   */
  constructor(apiKey?: string) {
    this.API_KEY = apiKey || env.SOLSCAN_API_KEY || '';
    
    if (!this.API_KEY) {
      logger.warn('Solscan API key not provided, API may be rate limited');
    }
  }
  
  /**
   * Get provider name
   * 
   * @returns Provider name
   */
  getName(): string {
    return 'Solscan';
  }
  
  /**
   * Get provider capabilities
   * 
   * @returns Array of provider capabilities
   */
  getCapabilities(): ProviderCapability[] {
    return [
      ProviderCapability.CURRENT_PRICE,
      ProviderCapability.MARKET_CAP,
      ProviderCapability.SUPPLY_DATA
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
      const rateLimitCheck = await rateLimiter.checkRateLimit('solscan', 'health');
      
      if (!rateLimitCheck.allowed) {
        logger.warn('Solscan rate limit exceeded during health check', {
          retryAfter: rateLimitCheck.retryAfter
        });
        return false;
      }
      
      // Make a simple API call to check if service is responding
      const response = await axios.get(`${this.API_BASE_URL}/v1/chain/stats`, {
        headers: this.API_KEY ? { 'Authorization': `Bearer ${this.API_KEY}` } : {},
        timeout: 3000 // Short timeout for health check
      });
      
      return response.status === 200;
    } catch (error) {
      logger.debug('Solscan health check failed', { 
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
    const rateLimit = await rateLimiter.checkRateLimit('solscan', 'price');
    
    if (!rateLimit.allowed) {
      throw new ProviderRateLimitError(
        'Solscan',
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
      const response = await axios.get<SolscanTokenResponse>(
        `${this.API_BASE_URL}/v1/token/meta`, 
        {
          params: { address: tokenAddress },
          headers: this.API_KEY ? { 'Authorization': `Bearer ${this.API_KEY}` } : {},
          timeout: 5000
        }
      );
      
      // Validate response
      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(`Invalid response from Solscan API for ${symbol}`);
      }
      
      const tokenData = response.data.data;
      
      // Create token price object
      const result: TokenPrice = {
        symbol,
        priceUsd: tokenData.price,
        priceChange24h: tokenData.priceChange,
        volume24h: tokenData.volume24h,
        lastUpdated: new Date(),
        source: this.getName()
      };
      
      return result;
    } catch (error) {
      // Handle specific error types
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 429) {
          throw new ProviderRateLimitError(
            'Solscan',
            'getCurrentPrice',
            error.response.headers['retry-after'] ? 
              parseInt(error.response.headers['retry-after'], 10) : 
              60
          );
        }
        
        if (error.response.status >= 500) {
          throw new ProviderUnavailableError(
            'Solscan',
            'getCurrentPrice',
            error
          );
        }
      }
      
      // Log and rethrow
      logger.error('Solscan getCurrentPrice error', {
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
    const rateLimit = await rateLimiter.checkRateLimit('solscan', 'history');
    
    if (!rateLimit.allowed) {
      throw new ProviderRateLimitError(
        'Solscan',
        'getHistoricalPrices',
        rateLimit.retryAfter
      );
    }
    
    try {
      // Solscan does not provide historical price API in their public API
      // This would require either a premium API subscription or using a different provider
      
      logger.warn('Solscan historical price API not available, returning empty array');
      
      // Return empty array for now
      return [];
    } catch (error) {
      logger.error('Solscan getHistoricalPrices error', {
        symbol,
        period,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return empty array on error
      return [];
    }
  }
}
