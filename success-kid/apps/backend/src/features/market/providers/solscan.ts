/**
 * Solscan API integration for token data
 */
import { PriceProvider, TransactionProvider } from './provider-interface';
import { TokenPrice, PriceDataPoint } from '../types';
import { logger } from '../../../lib/logger';
import axios from 'axios';

export class SolscanProvider implements PriceProvider, TransactionProvider {
  private baseUrl: string;
  private apiKey: string | null;
  private tokenAddress: Record<string, string>;
  
  constructor(options: {
    baseUrl?: string;
    apiKey?: string;
    tokenAddress?: Record<string, string>;
  } = {}) {
    this.baseUrl = options.baseUrl || 'https://api.solscan.io';
    this.apiKey = options.apiKey || process.env.SOLSCAN_API_KEY || null;
    this.tokenAddress = options.tokenAddress || {
      'SKC': process.env.SKC_TOKEN_ADDRESS || ''
    };
  }
  
  /**
   * Get provider name
   */
  getName(): string {
    return 'Solscan';
  }
  
  /**
   * Get HTTP headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['token'] = this.apiKey;
    }
    
    return headers;
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
      const response = await axios.get(`${this.baseUrl}/public/token/${tokenAddress}`, {
        headers: this.getHeaders()
      });
      
      if (!response.data || !response.data.priceUsdt) {
        throw new Error(`No price data found for ${tokenSymbol}`);
      }
      
      // Extract market data
      const tokenData = response.data;
      
      return {
        symbol: tokenSymbol,
        priceUsd: parseFloat(tokenData.priceUsdt),
        priceChange24h: tokenData.priceChange24h || 0,
        priceChange7d: tokenData.priceChange7d || 0,
        volume24h: tokenData.volume24h || 0,
        lastUpdated: new Date(),
        source: this.getName()
      };
    } catch (error) {
      logger.error('Solscan API error', { error: error.message, tokenSymbol });
      throw new Error(`Failed to get price from Solscan: ${error.message}`);
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
      // Map timeframe to Solscan time parameter
      let time = '24h';
      switch (timeframe) {
        case '1d': time = '24h'; break;
        case '7d': time = '7d'; break;
        case '30d': time = '30d'; break;
        default: time = '24h';
      }
      
      const response = await axios.get(`${this.baseUrl}/public/market/token/${tokenAddress}?time=${time}`, {
        headers: this.getHeaders()
      });
      
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error(`No historical data found for ${tokenSymbol}`);
      }
      
      // Transform data to our format
      return response.data.data.map((point: any) => ({
        timestamp: new Date(point.time),
        price: parseFloat(point.price),
        volume: point.volume || 0
      }));
    } catch (error) {
      logger.error('Failed to get historical prices from Solscan', { 
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
        `${this.baseUrl}/public/token/txs/${tokenAddress}?limit=${limit}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error(`No transaction data found for token ${tokenAddress}`);
      }
      
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get transactions from Solscan', {
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
        `${this.baseUrl}/public/transaction/${txHash}`,
        { headers: this.getHeaders() }
      );
      
      if (!response.data) {
        throw new Error(`No details found for transaction ${txHash}`);
      }
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get transaction details from Solscan', {
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
      const response = await axios.get(`${this.baseUrl}/public/ping`, {
        headers: this.getHeaders(),
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Solscan availability check failed', { error: error.message });
      return false;
    }
  }
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): string[] {
    return ['currentPrice', 'historicalPrices', 'transactions', 'tokenInfo'];
  }
}
