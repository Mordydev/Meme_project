/**
 * DexScreener API integration for token price data
 */
import { PriceProvider } from './provider-interface';
import { TokenPrice, PriceDataPoint } from '../types';
import { logger } from '../../../lib/logger';
import axios from 'axios';

export class DexScreenerProvider implements PriceProvider {
  private baseUrl: string;
  private chainId: string;
  private tokenAddress: Record<string, string>;
  
  constructor(options: {
    baseUrl?: string;
    chainId?: string;
    tokenAddress?: Record<string, string>;
  } = {}) {
    this.baseUrl = options.baseUrl || 'https://api.dexscreener.com/latest/dex';
    this.chainId = options.chainId || 'solana';
    this.tokenAddress = options.tokenAddress || {
      'SKC': process.env.SKC_TOKEN_ADDRESS || ''
    };
  }
  
  /**
   * Get provider name
   */
  getName(): string {
    return 'DexScreener';
  }
  
  /**
   * Get current price for the specified token
   * @param tokenSymbol The token symbol to get price for
   */
  async getCurrentPrice(tokenSymbol: string): Promise<TokenPrice> {
    const tokenAddress = this.tokenAddress[tokenSymbol];
    if (!tokenAddress) {
      throw new Error(`Token address not configured for ${tokenSymbol}`);
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/tokens/${this.chainId}/${tokenAddress}`);
      
      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        throw new Error(`No pairs found for ${tokenSymbol}`);
      }
      
      // Use the first pair (usually the most liquid one)
      const pair = response.data.pairs[0];
      
      return {
        symbol: tokenSymbol,
        priceUsd: parseFloat(pair.priceUsd),
        priceChange24h: parseFloat(pair.priceChange.h24),
        priceChange7d: parseFloat(pair.priceChange.h24), // DexScreener doesn't provide 7d change, use 24h as fallback
        volume24h: parseFloat(pair.volume.h24),
        lastUpdated: new Date(),
        source: this.getName()
      };
    } catch (error) {
      logger.error('DexScreener API error', { error: error.message, tokenSymbol });
      throw new Error(`Failed to get price from DexScreener: ${error.message}`);
    }
  }
  
  /**
   * Get historical prices for the specified token and timeframe
   * @param tokenSymbol The token symbol to get prices for
   * @param timeframe The timeframe to get prices for (e.g. '1d', '7d', '30d')
   */
  async getHistoricalPrices(tokenSymbol: string, timeframe: string): Promise<PriceDataPoint[]> {
    const tokenAddress = this.tokenAddress[tokenSymbol];
    if (!tokenAddress) {
      throw new Error(`Token address not configured for ${tokenSymbol}`);
    }
    
    try {
      // DexScreener doesn't have a direct historical price endpoint in free tier
      // We'll implement a workaround by getting the current price and calculating
      // historical prices based on 24h change
      
      const currentPrice = await this.getCurrentPrice(tokenSymbol);
      
      // Create some simulated historical data points based on current price
      // This is a placeholder - in a real implementation, you would use historical data
      const dataPoints: PriceDataPoint[] = [];
      const now = new Date();
      
      // Get number of data points based on timeframe
      let dataPointCount = 24; // Default to 24 hours
      let intervalHours = 1;
      
      switch (timeframe) {
        case '1d':
          dataPointCount = 24;
          intervalHours = 1;
          break;
        case '7d':
          dataPointCount = 7 * 24;
          intervalHours = 1;
          break;
        case '30d':
          dataPointCount = 30;
          intervalHours = 24;
          break;
        default:
          dataPointCount = 24;
          intervalHours = 1;
      }
      
      // Generate data points
      for (let i = 0; i < dataPointCount; i++) {
        const timestamp = new Date(now.getTime() - i * intervalHours * 60 * 60 * 1000);
        
        // Simulate price based on current price and 24h change
        // This is simplified and not accurate - replace with real historical data
        const changePercent = currentPrice.priceChange24h / 100;
        const hourlyChangePercent = changePercent / 24;
        const adjustedPrice = currentPrice.priceUsd * (1 - i * hourlyChangePercent);
        
        dataPoints.push({
          timestamp,
          price: adjustedPrice,
          volume: currentPrice.volume24h / dataPointCount
        });
      }
      
      // Reverse to get chronological order
      return dataPoints.reverse();
    } catch (error) {
      logger.error('Failed to get historical prices from DexScreener', { 
        error: error.message, 
        tokenSymbol, 
        timeframe 
      });
      throw new Error(`Failed to get historical prices: ${error.message}`);
    }
  }
  
  /**
   * Check if the provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/search?q=bitcoin`, {
        timeout: 5000
      });
      return Boolean(response.data);
    } catch (error) {
      logger.error('DexScreener availability check failed', { error: error.message });
      return false;
    }
  }
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): string[] {
    return ['currentPrice', 'priceChange', 'volume'];
  }
}
