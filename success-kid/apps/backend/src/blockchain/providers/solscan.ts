/**
 * Solscan Provider Implementation
 * 
 * Provides blockchain data from Solscan API.
 */
import { BlockchainProvider, ProviderOptions, SolanaNetwork } from '../types';
import { logger } from '../../lib/logger';
import axios from 'axios';

/**
 * Solscan API Provider Implementation
 */
export class SolscanProvider implements BlockchainProvider {
  private readonly id = 'solscan';
  private readonly name = 'Solscan';
  private readonly baseUrl = 'https://api.solscan.io';
  private readonly priority: number;
  private readonly networks: SolanaNetwork[];
  private readonly capabilities = [
    'account.info',
    'account.tokens',
    'account.transactions',
    'transaction.info',
    'token.info',
    'token.holders',
    'token.metadata',
    'token.supply'
  ];
  private readonly apiKey: string;
  private readonly httpClient: any;
  
  /**
   * Create a new Solscan provider
   * 
   * @param options Provider options
   */
  constructor(options: ProviderOptions) {
    this.priority = options.priority;
    this.networks = options.networks;
    this.apiKey = process.env.SOLSCAN_API_KEY || '';
    
    // Configure HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        ...(this.apiKey ? { 'token': this.apiKey } : {})
      }
    });
    
    // Configure error handling
    this.httpClient.interceptors.response.use(
      response => response,
      error => {
        logger.error('Solscan API error', { 
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
      // Use block height endpoint to check health
      const response = await this.httpClient.get('/block/last');
      return response.status === 200 && !!response.data;
    } catch (error) {
      logger.error('Solscan health check failed', { error });
      return false;
    }
  }
  
  /**
   * Get account information
   * 
   * @param address Account address
   * @param network Solana network
   * @returns Account information
   */
  async getAccountInfo(address: string, network: SolanaNetwork = SolanaNetwork.MAINNET): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get(`/account/${address}`, {
      params: {
        cluster: network === SolanaNetwork.MAINNET ? 'mainnet-beta' : 'devnet'
      }
    });
    
    return response.data;
  }
  
  /**
   * Get account transactions
   * 
   * @param address Account address
   * @param options Query options
   * @param network Solana network
   * @returns Account transactions
   */
  async getAccountTransactions(
    address: string, 
    options: { limit?: number; before?: string; } = {},
    network: SolanaNetwork = SolanaNetwork.MAINNET
  ): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const { limit = 10, before } = options;
    
    const params: any = {
      account: address,
      limit,
      cluster: network === SolanaNetwork.MAINNET ? 'mainnet-beta' : 'devnet'
    };
    
    if (before) {
      params.beforeHash = before;
    }
    
    const response = await this.httpClient.get('/account/transactions', { params });
    
    return response.data;
  }
  
  /**
   * Get account tokens
   * 
   * @param address Account address
   * @param network Solana network
   * @returns Account tokens
   */
  async getAccountTokens(address: string, network: SolanaNetwork = SolanaNetwork.MAINNET): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get(`/account/tokens`, {
      params: {
        account: address,
        cluster: network === SolanaNetwork.MAINNET ? 'mainnet-beta' : 'devnet'
      }
    });
    
    return response.data;
  }
  
  /**
   * Get transaction information
   * 
   * @param signature Transaction signature
   * @param network Solana network
   * @returns Transaction information
   */
  async getTransaction(signature: string, network: SolanaNetwork = SolanaNetwork.MAINNET): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get(`/transaction/${signature}`, {
      params: {
        cluster: network === SolanaNetwork.MAINNET ? 'mainnet-beta' : 'devnet'
      }
    });
    
    return response.data;
  }
  
  /**
   * Get token information
   * 
   * @param address Token address
   * @param network Solana network
   * @returns Token information
   */
  async getTokenInfo(address: string, network: SolanaNetwork = SolanaNetwork.MAINNET): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get(`/token/meta`, {
      params: {
        tokenAddress: address,
        cluster: network === SolanaNetwork.MAINNET ? 'mainnet-beta' : 'devnet'
      }
    });
    
    return response.data;
  }
  
  /**
   * Get token holders
   * 
   * @param address Token address
   * @param options Query options
   * @param network Solana network
   * @returns Token holders
   */
  async getTokenHolders(
    address: string,
    options: { limit?: number; offset?: number; } = {},
    network: SolanaNetwork = SolanaNetwork.MAINNET
  ): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const { limit = 10, offset = 0 } = options;
    
    const response = await this.httpClient.get(`/token/holders`, {
      params: {
        tokenAddress: address,
        limit,
        offset,
        cluster: network === SolanaNetwork.MAINNET ? 'mainnet-beta' : 'devnet'
      }
    });
    
    return response.data;
  }
  
  /**
   * Get token supply information
   * 
   * @param address Token address
   * @param network Solana network
   * @returns Token supply information
   */
  async getTokenSupply(address: string, network: SolanaNetwork = SolanaNetwork.MAINNET): Promise<any> {
    if (!this.supportsNetwork(network)) {
      throw new Error(`Network not supported: ${network}`);
    }
    
    const response = await this.httpClient.get(`/token/meta`, {
      params: {
        tokenAddress: address,
        cluster: network === SolanaNetwork.MAINNET ? 'mainnet-beta' : 'devnet'
      }
    });
    
    // Extract supply information
    const { supply, decimals } = response.data;
    return { supply, decimals };
  }
}
