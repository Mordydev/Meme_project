/**
 * Dexscreener Provider Implementation
 * 
 * Provides market data from Dexscreener API.
 */
import { BlockchainProvider, ProviderOptions, SolanaNetwork } from '../types';
import { logger } from '../../lib/logger';
import axios from 'axios';

/**
 * Dexscreener API Provider Implementation
 */
export class DexscreenerProvider implements BlockchainProvider {
  private readonly id = 'dexscreener';
  private readonly name = 'Dexscreener';
  private readonly baseUrl = 'https://api.dexscreener.com/latest/dex';
  private readonly priority: number;
  private readonly networks: SolanaNetwork[];
  private readonly capabilities = [
    'market.price',
    'market.volume',
    'market.liquidity',
    'market.marketcap',
    'market.pairs'
  ];
  private readonly httpClient = axios.create({
    baseURL: this.baseUrl,
    timeout: 10000,
    headers: {
      'Accept': 'application/json'
    }
  });
  
  /**
   * Create a new Dexscreener provider
   * 
   * @param options Provider options
   */
  constructor(options: ProviderOptions) {
    this.priority = options.priority;
    this.networks = options.networks;
    
    // Configure HTTP client
    this.httpClient.interceptors.response.use(
      response => response,
      error => {
        logger.error('Dexscreener API error', { 
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        throw error;
      }
    );
  }
  
  /**
   * Get provider ID
   * 
   * @returns Provider ID
   */
  getId(): string {
    return this.id;
  }
  
  /**
   * Get provider name
   * 
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Get provider priority
   * 
   * @returns Provider priority
   */
  getPriority(): number {
    return this.priority;
  }
  
  /**
   * Check if provider supports a network
   * 
   * @param network Network to check
   * @returns True if network is supported
   */
  supportsNetwork(network: SolanaNetwork): boolean {
    return this.networks.includes(network);
  }
  
  /**
   * Check if provider has a capability
   * 
   * @param capability Capability to check
   * @returns True if capability is supported
   */
  hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }
  
  /**
   * Check provider health
   * 
   * @returns True if provider is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Use a simple endpoint to test health
      const response = await this.httpClient.get('/search', {
        params: {
          q: 'SOL'
        }
      });
      
      return response.status === 200 && !!response.data;
    } catch (error) {
      logger.error('Dexscreener health check failed', { error });
      return false;
    }
  }
  
  /**
   * Get token price data
   * 
   * @param tokenAddress Token contract address
   * @param network Solana network
   * @returns Token price data
   */
  async getTokenPrice(tokenAddress: string, network: SolanaNetwork): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get('/tokens', {
      params: {
        tokenAddresses: tokenAddress
      }
    });
    
    const pairsData = response.data?.pairs;
    
    if (!pairsData || !Array.isArray(pairsData) || pairsData.length === 0) {
      throw new Error(`Token not found: ${tokenAddress}`);
    }
    
    // Return the first pair data with USDC or USDT as quote
    const usdPair = pairsData.find(pair => 
      pair.quoteToken?.symbol === 'USDC' || 
      pair.quoteToken?.symbol === 'USDT'
    );
    
    return usdPair || pairsData[0];
  }
  
  /**
   * Get token market data
   * 
   * @param tokenAddress Token contract address
   * @param network Solana network
   * @returns Token market data
   */
  async getTokenMarketData(tokenAddress: string, network: SolanaNetwork): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get('/tokens', {
      params: {
        tokenAddresses: tokenAddress
      }
    });
    
    const pairsData = response.data?.pairs;
    
    if (!pairsData || !Array.isArray(pairsData) || pairsData.length === 0) {
      throw new Error(`Token not found: ${tokenAddress}`);
    }
    
    // Aggregate data from all pairs
    const marketData = {
      price: 0,
      volume24h: 0,
      liquidity: 0,
      fdv: 0,
      marketCap: 0,
      priceChange: {
        h1: 0,
        h24: 0,
        d7: 0
      },
      pairs: pairsData.length
    };
    
    // Find main pair (highest liquidity with USD)
    const mainPair = pairsData.sort((a: any, b: any) => {
      // Prioritize USDC/USDT pairs
      const aIsUsd = a.quoteToken?.symbol === 'USDC' || a.quoteToken?.symbol === 'USDT';
      const bIsUsd = b.quoteToken?.symbol === 'USDC' || b.quoteToken?.symbol === 'USDT';
      
      if (aIsUsd && !bIsUsd) return -1;
      if (!aIsUsd && bIsUsd) return 1;
      
      // Then sort by liquidity
      return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
    })[0];
    
    if (mainPair) {
      marketData.price = parseFloat(mainPair.priceUsd || '0');
      marketData.volume24h = parseFloat(mainPair.volume?.h24 || '0');
      marketData.liquidity = parseFloat(mainPair.liquidity?.usd || '0');
      marketData.fdv = parseFloat(mainPair.fdv || '0');
      marketData.marketCap = parseFloat(mainPair.marketCap || '0');
      marketData.priceChange = {
        h1: parseFloat(mainPair.priceChange?.h1 || '0'),
        h24: parseFloat(mainPair.priceChange?.h24 || '0'),
        d7: parseFloat(mainPair.priceChange?.d7 || '0')
      };
    }
    
    return {
      ...marketData,
      pairsData,
      mainPair
    };
  }
}
