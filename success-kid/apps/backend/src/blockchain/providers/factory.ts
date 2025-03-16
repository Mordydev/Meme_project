/**
 * Blockchain Provider Factory
 * 
 * This factory creates and manages blockchain providers.
 */
import { BaseBlockchainProvider } from './base';
import { SolanaProvider, SolanaConfig } from './solana';
import { logger } from '../../lib/logger';

/**
 * Provider factory interface
 */
export interface BlockchainProviderFactory {
  getProvider(chain: string): BaseBlockchainProvider;
  getAllProviders(): Record<string, BaseBlockchainProvider>;
  getProviderForAddress(address: string): BaseBlockchainProvider;
  registerProvider(chain: string, provider: BaseBlockchainProvider): void;
}

/**
 * Blockchain provider factory implementation
 */
export class BlockchainProviderFactoryImpl implements BlockchainProviderFactory {
  private providers: Map<string, BaseBlockchainProvider> = new Map();
  
  /**
   * Create blockchain provider factory
   */
  constructor() {
    // Register default providers
    this.initializeDefaultProviders();
  }
  
  /**
   * Initialize default blockchain providers
   */
  private initializeDefaultProviders(): void {
    // Solana provider
    const solanaConfig: SolanaConfig = {
      network: process.env.SOLANA_NETWORK || 'devnet',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      apiKey: process.env.SOLANA_API_KEY,
      tokenAddress: process.env.SOLANA_TOKEN_ADDRESS,
    };
    
    this.registerProvider('solana', new SolanaProvider(solanaConfig));
    
    // More providers can be added here
    
    logger.info('Initialized default blockchain providers');
  }
  
  /**
   * Register a new provider
   * 
   * @param chain Chain identifier
   * @param provider Provider instance
   */
  registerProvider(chain: string, provider: BaseBlockchainProvider): void {
    this.providers.set(chain.toLowerCase(), provider);
    logger.info(`Registered blockchain provider for ${chain}`);
  }
  
  /**
   * Get provider by chain
   * 
   * @param chain Chain identifier
   * @returns Blockchain provider
   */
  getProvider(chain: string): BaseBlockchainProvider {
    const provider = this.providers.get(chain.toLowerCase());
    if (!provider) {
      throw new Error(`Provider not found for chain: ${chain}`);
    }
    return provider;
  }
  
  /**
   * Get all registered providers
   * 
   * @returns Map of all providers
   */
  getAllProviders(): Record<string, BaseBlockchainProvider> {
    const result: Record<string, BaseBlockchainProvider> = {};
    this.providers.forEach((provider, chain) => {
      result[chain] = provider;
    });
    return result;
  }
  
  /**
   * Get provider for wallet address
   * 
   * @param address Wallet address
   * @returns Appropriate blockchain provider for the address
   */
  getProviderForAddress(address: string): BaseBlockchainProvider {
    // For now, we only support Solana, so always return the Solana provider
    // In a multi-chain implementation, we would detect the address format
    return this.getProvider('solana');
  }
}

// Singleton instance
let providerFactoryInstance: BlockchainProviderFactory | null = null;

/**
 * Get blockchain provider factory instance
 * 
 * @returns Provider factory instance
 */
export function getBlockchainProviderFactory(): BlockchainProviderFactory {
  if (!providerFactoryInstance) {
    providerFactoryInstance = new BlockchainProviderFactoryImpl();
  }
  return providerFactoryInstance;
}
