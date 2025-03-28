/**
 * Birdeye Provider Implementation
 * 
 * Provides market data from Birdeye API.
 */
import { BlockchainProvider, ProviderOptions, SolanaNetwork } from '../types';
import { logger } from '../../lib/logger';
import axios from 'axios';

/**
 * Birdeye API Provider Implementation
 */
export class BirdeyeProvider implements BlockchainProvider {
  private readonly id = 'birdeye';
  private readonly name = 'Birdeye';
  private readonly baseUrl = 'https://public-api.birdeye.so';
  private readonly priority: number;
  private readonly networks: SolanaNetwork[];
  private readonly capabilities = [
    'market.price',
    'market.volume',
    'market.liquidity',
    'market.marketcap',
    'market.chart',
    'token.holders'
  ];
  private readonly apiKey: string;
  private readonly httpClient: any;
  
  /**
   * Create a new Birdeye provider
   * 
   * @param options Provider options
   */
  constructor(options: ProviderOptions) {
    this.priority = options.priority;
    this.networks = options.networks;
    this.apiKey = process.env.BIRDEYE_API_KEY || '';
    
    // Configure HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': this.apiKey || 'tQGYj9sP2Gvfs4eWMbDxMuGbj4mE6E5E65s60Xhf' // Public API key
      }
    });
    
    // Configure error handling
    this.httpClient.interceptors.response.use(
      response => response,
      error => {
        logger.error('Birdeye API error', { 
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
      // Use a simple endpoint to test health (SOL token price)
      const response = await this.httpClient.get('/public/price', {
        params: {
          address: 'So11111111111111111111111111111111111111112' // SOL
        }
      });
      
      return response.status === 200 && !!response.data;
    } catch (error) {
      logger.error('Birdeye health check failed', { error });
      return false;
    }
  }
  
  /**
   * Get token price
   * 
   * @param tokenAddress Token contract address
   * @param network Solana network
   * @returns Token price data
   */
  async getTokenPrice(tokenAddress: string, network: SolanaNetwork): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get('/public/price', {
      params: {
        address: tokenAddress
      }
    });
    
    if (!response.data || !response.data.data || !response.data.data.value) {
      throw new Error(`Token price not found: ${tokenAddress}`);
    }
    
    return response.data.data;
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
    
    // Make multiple requests in parallel
    const [priceResponse, volumeResponse, tokenInfoResponse] = await Promise.all([
      this.httpClient.get('/public/price', {
        params: { address: tokenAddress }
      }),
      this.httpClient.get('/public/token_volume_24h', {
        params: { address: tokenAddress }
      }),
      this.httpClient.get('/public/token_list', {
        params: { 
          chain: 'solana',
          offset: 0,
          limit: 1,
          search_key: 'address',
          search_value: tokenAddress
        }
      })
    ]);
    
    // Check if we have valid data
    if (!priceResponse.data || !priceResponse.data.data) {
      throw new Error(`Token price not found: ${tokenAddress}`);
    }
    
    // Process data
    const priceData = priceResponse.data.data;
    const volumeData = volumeResponse.data.data || { value: 0 };
    
    let tokenInfo = null;
    if (tokenInfoResponse.data && tokenInfoResponse.data.data && tokenInfoResponse.data.data.length > 0) {
      tokenInfo = tokenInfoResponse.data.data[0];
    }
    
    // Calculate market cap if we have supply data
    let marketCap = 0;
    let fdv = 0;
    
    if (tokenInfo && tokenInfo.totalSupply && priceData.value) {
      marketCap = tokenInfo.circulatingSupply * priceData.value;
      fdv = tokenInfo.totalSupply * priceData.value;
    }
    
    // Return aggregated data
    return {
      price: priceData.value || 0,
      priceChange: {
        h1: priceData.h1Change || 0,
        h24: priceData.h24Change || 0,
        d7: priceData.d7Change || 0
      },
      volume24h: volumeData.value || 0,
      marketCap,
      fdv,
      tokenInfo
    };
  }
  
  /**
   * Get token price chart data
   * 
   * @param tokenAddress Token contract address
   * @param timeframe Timeframe for chart data
   * @param network Solana network
   * @returns Token price chart data
   */
  async getTokenPriceChart(
    tokenAddress: string,
    timeframe: 'h1' | 'h6' | 'h12' | 'd1' | 'd7' | '1m' = 'd1',
    network: SolanaNetwork = SolanaNetwork.MAINNET
  ): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get('/public/historical_price', {
      params: {
        address: tokenAddress,
        type: timeframe
      }
    });
    
    if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
      throw new Error(`Token price chart data not found: ${tokenAddress}`);
    }
    
    return response.data.data;
  }
  
  /**
   * Get token holders
   * 
   * @param tokenAddress Token contract address
   * @param options Query options
   * @param network Solana network
   * @returns Token holders
   */
  async getTokenHolders(
    tokenAddress: string,
    options: { limit?: number; offset?: number; } = {},
    network: SolanaNetwork = SolanaNetwork.MAINNET
  ): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const { limit = 10, offset = 0 } = options;
    
    const response = await this.httpClient.get('/public/token_holders', {
      params: {
        address: tokenAddress,
        limit,
        offset
      }
    });
    
    if (!response.data || !response.data.data || !Array.isArray(response.data.data.items)) {
      throw new Error(`Token holders not found: ${tokenAddress}`);
    }
    
    return {
      items: response.data.data.items,
      total: response.data.data.total
    };
  }
}
