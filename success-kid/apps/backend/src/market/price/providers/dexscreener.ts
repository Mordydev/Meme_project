/**
 * DexScreener Price Provider
 * 
 * Provider for fetching price data from DexScreener API.
 */
import axios from 'axios';
import { logger } from '../../../lib/logger';
import { PriceProvider, ProviderCapability, ProviderUnavailableError, ProviderRateLimitError } from '../../providers/types';
import { rateLimiter } from '../../providers/rate-limiter';
import { TokenPrice, PricePoint, TimePeriod } from '../../../models/entities/market/price.model';

/**
 * DexScreener price provider implementation
 */
export class DexScreenerProvider implements PriceProvider {
  // API endpoints
  private readonly API_BASE_URL = 'https://api.dexscreener.com/latest/dex';
  
  // Token address mapping (symbol -> contract address)
  private readonly tokenAddresses: Record<string, string> = {
    'SKC': '0xYourSuccessKidTokenAddress', // Replace with actual token address
  };
  
  // Default pair address (if known)
  private readonly defaultPairAddress?: string;
  
  /**
   * Create a new DexScreener provider instance
   * 
   * @param config Optional configuration
   */
  constructor(private readonly config: { 
    pairAddress?: string,
    defaultChain?: string 
  } = {}) {
    this.defaultPairAddress = config.pairAddress;
  }
  
  /**
   * Get provider name
   * 
   * @returns Provider name
   */
  getName(): string {
    return 'DexScreener';
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
      ProviderCapability.VOLUME_DATA
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
      const rateLimitCheck = await rateLimiter.checkRateLimit('dexscreener', 'health');
      
      if (!rateLimitCheck.allowed) {
        logger.warn('DexScreener rate limit exceeded during health check', {
          retryAfter: rateLimitCheck.retryAfter
        });
        return false;
      }
      
      // Make a simple API call to check if service is responding
      const response = await axios.get(`${this.API_BASE_URL}/search`, {
        params: { limit: 1 },
        timeout: 3000 // Short timeout for health check
      });
      
      return response.status === 200;
    } catch (error) {
      logger.debug('DexScreener health check failed', { 
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
    const rateLimit = await rateLimiter.checkRateLimit('dexscreener', 'price');
    
    if (!rateLimit.allowed) {
      throw new ProviderRateLimitError(
        'DexScreener',
        'getCurrentPrice',
        rateLimit.retryAfter
      );
    }
    
    try {
      // Determine how to query the API
      let response;
      
      if (this.defaultPairAddress) {
        // If we have a specific pair address, query directly
        response = await axios.get(`${this.API_BASE_URL}/pairs`, {
          params: { 
            pairAddress: this.defaultPairAddress 
          },
          timeout: 5000
        });
      } else if (this.tokenAddresses[symbol]) {
        // Query by token address
        response = await axios.get(`${this.API_BASE_URL}/tokens`, {
          params: { 
            address: this.tokenAddresses[symbol] 
          },
          timeout: 5000
        });
      } else {
        // Query by symbol (less reliable)
        response = await axios.get(`${this.API_BASE_URL}/search`, {
          params: { 
            query: symbol 
          },
          timeout: 5000
        });
      }
      
      // Parse the response
      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        throw new Error(`No pairs found for ${symbol}`);
      }
      
      // Find the most relevant pair (usually the one with highest liquidity)
      const pairs = response.data.pairs;
      
      // Sort by liquidity (descending)
      const sortedPairs = [...pairs].sort((a, b) => {
        const liquidityA = parseFloat(a.liquidity?.usd || '0');
        const liquidityB = parseFloat(b.liquidity?.usd || '0');
        return liquidityB - liquidityA;
      });
      
      const pair = sortedPairs[0];
      
      // Extract price data
      const priceUsd = parseFloat(pair.priceUsd || '0');
      const priceChange24h = parseFloat(pair.priceChange?.h24 || '0');
      const volume24h = parseFloat(pair.volume?.h24 || '0');
      
      const result: TokenPrice = {
        symbol,
        priceUsd,
        priceChange24h,
        volume24h,
        lastUpdated: new Date(),
        source: this.getName()
      };
      
      return result;
    } catch (error) {
      // Handle specific error types
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 429) {
          throw new ProviderRateLimitError(
            'DexScreener',
            'getCurrentPrice',
            error.response.headers['retry-after'] ? 
              parseInt(error.response.headers['retry-after'], 10) : 
              60
          );
        }
        
        if (error.response.status >= 500) {
          throw new ProviderUnavailableError(
            'DexScreener',
            'getCurrentPrice',
            error
          );
        }
      }
      
      // Log and rethrow
      logger.error('DexScreener getCurrentPrice error', {
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
    const rateLimit = await rateLimiter.checkRateLimit('dexscreener', 'history');
    
    if (!rateLimit.allowed) {
      throw new ProviderRateLimitError(
        'DexScreener',
        'getHistoricalPrices',
        rateLimit.retryAfter
      );
    }
    
    try {
      // DexScreener doesn't provide historical price API directly
      // This is a placeholder implementation
      // In a real implementation, you would need to:
      // 1. Use a different provider for historical data
      // 2. Or implement websocket subscription to collect data over time
      // 3. Or scrape the DexScreener UI which contains charts
      
      logger.warn('DexScreener historical price API not implemented, returning empty array');
      
      // Return empty array for now
      return [];
    } catch (error) {
      logger.error('DexScreener getHistoricalPrices error', {
        symbol,
        period,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return empty array on error
      return [];
    }
  }
}
