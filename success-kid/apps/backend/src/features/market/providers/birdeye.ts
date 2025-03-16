/**
 * Birdeye API integration for Solana token data
 */
import { PriceProvider, TransactionProvider } from './provider-interface';
import { TokenPrice, PriceDataPoint } from '../types';
import { logger } from '../../../lib/logger';
import axios from 'axios';

export class BirdeyeProvider implements PriceProvider, TransactionProvider {
  private baseUrl: string;
  private apiKey: string;
  private tokenAddress: Record<string, string>;
  
  constructor(options: {
    baseUrl?: string;
    apiKey?: string;
    tokenAddress?: Record<string, string>;
  } = {}) {
    this.baseUrl = options.baseUrl || 'https://public-api.birdeye.so';
    this.apiKey = options.apiKey || process.env.BIRDEYE_API_KEY || '';
    this.tokenAddress = options.tokenAddress || {
      'SKC': process.env.SKC_TOKEN_ADDRESS || ''
    };
  }
  
  /**
   * Get provider name
   */
  getName(): string {
    return 'Birdeye';
  }
  
  /**
   * Get HTTP headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'X-API-KEY': this.apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
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
      const response = await axios.get(
        `${this.baseUrl}/public/price?address=${tokenAddress}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.data || !response.data.data || !response.data.data[tokenAddress]) {
        throw new Error(`No price data found for ${tokenSymbol}`);
      }
      
      const priceData = response.data.data[tokenAddress];
      
      // Now get 24h value change
      const valueChangeResponse = await axios.get(
        `${this.baseUrl}/public/token_price_change?time_from=1d&address=${tokenAddress}`,
        { headers: this.getHeaders() }
      );
      
      let priceChange24h = 0;
      if (
        valueChangeResponse.data && 
        valueChangeResponse.data.data && 
        valueChangeResponse.data.data[tokenAddress]
      ) {
        priceChange24h = valueChangeResponse.data.data[tokenAddress].priceChange || 0;
      }
      
      // Get price change 7d
      const valueChange7dResponse = await axios.get(
        `${this.baseUrl}/public/token_price_change?time_from=7d&address=${tokenAddress}`,
        { headers: this.getHeaders() }
      );
      
      let priceChange7d = 0;
      if (
        valueChange7dResponse.data && 
        valueChange7dResponse.data.data && 
        valueChange7dResponse.data.data[tokenAddress]
      ) {
        priceChange7d = valueChange7dResponse.data.data[tokenAddress].priceChange || 0;
      }
      
      // Get 24h volume
      const volumeResponse = await axios.get(
        `${this.baseUrl}/public/token_volume_all?address=${tokenAddress}`,
        { headers: this.getHeaders() }
      );
      
      let volume24h = 0;
      if (
        volumeResponse.data && 
        volumeResponse.data.data && 
        volumeResponse.data.data[tokenAddress]
      ) {
        volume24h = volumeResponse.data.data[tokenAddress].volume24h || 0;
      }
      
      return {
        symbol: tokenSymbol,
        priceUsd: priceData.value,
        priceChange24h,
        priceChange7d,
        volume24h,
        lastUpdated: new Date(),
        source: this.getName()
      };
    } catch (error) {
      logger.error('Birdeye API error', { error: error.message, tokenSymbol });
      throw new Error(`Failed to get price from Birdeye: ${error.message}`);
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
    
    // Map timeframe to Birdeye resolution
    let resolution = '15m';
    let interval = '1d';
    
    switch (timeframe) {
      case '1d':
        resolution = '15m';
        interval = '1d';
        break;
      case '7d':
        resolution = '1h';
        interval = '7d';
        break;
      case '30d':
        resolution = '4h';
        interval = '30d';
        break;
      default:
        resolution = '15m';
        interval = '1d';
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/public/price_history?address=${tokenAddress}&type=token&resolution=${resolution}&time_from=${interval}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        throw new Error(`No historical data found for ${tokenSymbol}`);
      }
      
      // Transform data to our format
      return response.data.data.map((point: any) => ({
        timestamp: new Date(point.unixTime * 1000),
        price: point.value,
        volume: point.volume || 0
      }));
    } catch (error) {
      logger.error('Failed to get historical prices from Birdeye', { 
        error: error.message, 
        tokenSymbol, 
        timeframe 
      });
      throw new Error(`Failed to get historical prices: ${error.message}`);
    }
  }
  
  /**
   * Get recent transactions for the specified token
   * @param tokenAddress The token address to get transactions for
   * @param limit Maximum number of transactions to return
   */
  async getRecentTransactions(tokenAddress: string, limit = 20): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/public/token_tx?address=${tokenAddress}&offset=0&limit=${limit}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.data || !response.data.data || !Array.isArray(response.data.data.items)) {
        throw new Error(`No transaction data found for token ${tokenAddress}`);
      }
      
      return response.data.data.items;
    } catch (error) {
      logger.error('Failed to get transactions from Birdeye', {
        error: error.message,
        tokenAddress,
        limit
      });
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }
  
  /**
   * Get transaction details
   * @param txHash The transaction hash
   */
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/public/tx?tx_id=${txHash}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.data || !response.data.data) {
        throw new Error(`No details found for transaction ${txHash}`);
      }
      
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get transaction details from Birdeye', {
        error: error.message,
        txHash
      });
      throw new Error(`Failed to get transaction details: ${error.message}`);
    }
  }
  
  /**
   * Check if the provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to get SOL price as a basic availability check
      const response = await axios.get(
        `${this.baseUrl}/public/price?address=So11111111111111111111111111111111111111112`,
        {
          headers: this.getHeaders(),
          timeout: 5000
        }
      );
      
      return Boolean(response.data && response.data.success);
    } catch (error) {
      logger.error('Birdeye availability check failed', { error: error.message });
      return false;
    }
  }
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): string[] {
    return ['currentPrice', 'historicalPrices', 'transactions', 'tokenInfo', 'priceChange'];
  }
}
