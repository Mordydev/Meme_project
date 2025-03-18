/**
 * Blockchain Provider Manager
 * 
 * This service manages multiple blockchain data providers with automatic failover,
 * health checking, and caching to ensure high availability of blockchain data.
 */
import { BaseBlockchainProvider } from './base';
import { getBlockchainProviderFactory } from './factory';
import { BlockchainCache } from '../utils/cache';
import { logger } from '../../lib/logger';
import { 
  BalanceData, 
  Transaction, 
  TransactionRequest, 
  TransactionResult,
  FeeEstimate,
  VerificationResult,
  TransactionOptions,
  PaginatedResult,
  ProviderHealth
} from '../types';

// Provider health check interval (in milliseconds)
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  BALANCE: 30000, // 30 seconds
  TRANSACTIONS: 60000, // 1 minute
  TRANSACTION: 60000, // 1 minute
  BLOCK: 10000, // 10 seconds
};

// Maximum retry attempts for operations
const MAX_RETRY_ATTEMPTS = 3;

// Backoff interval for retries (in milliseconds)
const RETRY_BACKOFF = 1000; // 1 second

/**
 * Provider health status record
 */
interface ProviderStatus {
  provider: BaseBlockchainProvider;
  isHealthy: boolean;
  lastChecked: Date;
  failureCount: number;
  responseTime: number;
}

/**
 * Blockchain Provider Manager
 * 
 * Manages multiple blockchain data providers with automatic failover, 
 * health checking, and caching for resilience.
 */
export class BlockchainProviderManager {
  private providers: Map<string, ProviderStatus> = new Map();
  private activeProviders: Map<string, BaseBlockchainProvider> = new Map();
  private cache: BlockchainCache;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  /**
   * Create a new blockchain provider manager
   * 
   * @param cache Optional cache instance (will create one if not provided)
   */
  constructor(cache?: BlockchainCache) {
    this.cache = cache || new BlockchainCache();
    this.initializeProviders();
    this.startHealthChecks();
  }
  
  /**
   * Initialize providers from factory
   */
  private initializeProviders(): void {
    const factory = getBlockchainProviderFactory();
    const providers = factory.getAllProviders();
    
    // Register all providers with initial health status
    Object.entries(providers).forEach(([chain, provider]) => {
      const status: ProviderStatus = {
        provider,
        isHealthy: true,
        lastChecked: new Date(),
        failureCount: 0,
        responseTime: 0
      };
      
      this.providers.set(chain, status);
      this.activeProviders.set(chain, provider);
    });
    
    logger.info('Initialized blockchain providers', {
      count: this.providers.size,
      chains: Array.from(this.providers.keys())
    });
  }
  
  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Set up new interval
    this.healthCheckInterval = setInterval(
      () => this.checkProvidersHealth(),
      HEALTH_CHECK_INTERVAL
    );
    
    logger.info('Started blockchain provider health checks', {
      interval: HEALTH_CHECK_INTERVAL
    });
  }
  
  /**
   * Stop health checks
   */
  public stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Stopped blockchain provider health checks');
    }
  }
  
  /**
   * Check health of all providers
   */
  private async checkProvidersHealth(): Promise<void> {
    logger.debug('Checking health of blockchain providers');
    
    for (const [chain, status] of this.providers.entries()) {
      try {
        const startTime = Date.now();
        
        // Perform health check by getting current block number
        await status.provider.getCurrentBlockNumber();
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Update status
        status.isHealthy = true;
        status.lastChecked = new Date();
        status.failureCount = 0;
        status.responseTime = responseTime;
        
        // Ensure this provider is active if it's healthy
        this.activeProviders.set(chain, status.provider);
        
        logger.debug('Provider health check passed', {
          chain,
          responseTime
        });
      } catch (error) {
        // Update failure status
        status.isHealthy = false;
        status.lastChecked = new Date();
        status.failureCount += 1;
        
        logger.warn('Provider health check failed', {
          chain,
          failureCount: status.failureCount,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // If this is the active provider, try to failover
        if (this.activeProviders.get(chain) === status.provider) {
          this.failoverProvider(chain);
        }
      }
    }
  }
  
  /**
   * Failover to another provider for the given chain
   * 
   * @param chain Blockchain chain identifier
   * @returns True if failover was successful
   */
  private failoverProvider(chain: string): boolean {
    // Find all providers for this chain
    const chainProviders = Array.from(this.providers.entries())
      .filter(([providerChain, _]) => providerChain.startsWith(chain))
      .sort((a, b) => {
        // Sort by health and response time
        if (a[1].isHealthy && !b[1].isHealthy) return -1;
        if (!a[1].isHealthy && b[1].isHealthy) return 1;
        return a[1].responseTime - b[1].responseTime;
      });
    
    // Find first healthy provider
    const healthyProvider = chainProviders.find(([_, status]) => status.isHealthy);
    
    if (healthyProvider) {
      const [healthyChain, status] = healthyProvider;
      this.activeProviders.set(chain, status.provider);
      
      logger.info('Failover to healthy provider successful', {
        chain,
        provider: healthyChain
      });
      
      return true;
    }
    
    // No healthy provider found, stick with the fastest unhealthy one
    if (chainProviders.length > 0) {
      const [unhealthyChain, status] = chainProviders[0];
      this.activeProviders.set(chain, status.provider);
      
      logger.warn('No healthy providers available, using best available provider', {
        chain,
        provider: unhealthyChain,
        failureCount: status.failureCount
      });
    }
    
    return false;
  }
  
  /**
   * Get provider health status
   * 
   * @returns Health status of all providers
   */
  public getProvidersHealth(): Map<string, ProviderHealth> {
    const result = new Map<string, ProviderHealth>();
    
    for (const [chain, status] of this.providers.entries()) {
      result.set(chain, {
        isHealthy: status.isHealthy,
        lastChecked: status.lastChecked.toISOString(),
        failureCount: status.failureCount,
        responseTime: status.responseTime,
        isActive: this.activeProviders.get(chain) === status.provider
      });
    }
    
    return result;
  }
  
  /**
   * Execute operation with failover
   * 
   * @param chain Blockchain chain
   * @param operation Operation to execute
   * @param cacheKey Optional cache key for the operation
   * @param cacheTtl Optional cache TTL in milliseconds
   * @returns Operation result
   */
  private async executeWithFailover<T>(
    chain: string,
    operation: (provider: BaseBlockchainProvider) => Promise<T>,
    cacheKey?: string,
    cacheTtl?: number
  ): Promise<T> {
    // Check cache first if a cache key is provided
    if (cacheKey) {
      const cachedResult = await this.cache.get<T>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    let lastError: Error | null = null;
    
    // Try with active provider first
    const activeProvider = this.activeProviders.get(chain);
    if (!activeProvider) {
      throw new Error(`No active provider available for chain: ${chain}`);
    }
    
    // Try up to MAX_RETRY_ATTEMPTS times with exponential backoff
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // If not first attempt, wait with exponential backoff
        if (attempt > 0) {
          const backoff = RETRY_BACKOFF * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
        
        const result = await operation(activeProvider);
        
        // Cache result if needed
        if (cacheKey && cacheTtl) {
          await this.cache.set(cacheKey, result, cacheTtl);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error 
          ? error 
          : new Error(String(error));
        
        logger.warn('Provider operation failed, will retry', {
          chain,
          provider: activeProvider.getName(),
          attempt: attempt + 1,
          maxAttempts: MAX_RETRY_ATTEMPTS,
          error: lastError.message
        });
        
        // Mark provider as unhealthy and try to failover
        const status = Array.from(this.providers.values())
          .find(s => s.provider === activeProvider);
        
        if (status) {
          status.isHealthy = false;
          status.failureCount += 1;
        }
        
        // Try failover if we have more attempts remaining
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          this.failoverProvider(chain);
        }
      }
    }
    
    // All attempts failed
    throw lastError || new Error(`Failed to execute operation after ${MAX_RETRY_ATTEMPTS} attempts`);
  }
  
  /**
   * Get token balance for address
   * 
   * @param address Wallet address
   * @param token Optional token address (defaults to native token)
   * @param chain Blockchain chain
   * @returns Balance data
   */
  public async getBalance(
    address: string, 
    token?: string, 
    chain: string = 'solana'
  ): Promise<BalanceData> {
    const cacheKey = `balance:${chain}:${address}:${token || 'native'}`;
    
    return this.executeWithFailover<BalanceData>(
      chain,
      provider => provider.getBalance(address, token),
      cacheKey,
      CACHE_TTL.BALANCE
    );
  }
  
  /**
   * Get transaction history for an address
   * 
   * @param address Wallet address
   * @param options Transaction query options
   * @param chain Blockchain chain
   * @returns Transaction list
   */
  public async getTransactions(
    address: string, 
    options?: TransactionOptions,
    chain: string = 'solana'
  ): Promise<PaginatedResult<Transaction>> {
    // Create cache key based on address and options
    const optionsKey = options 
      ? `${options.limit || 20}:${options.offset || 0}:${options.type || 'all'}`
      : 'default';
    
    const cacheKey = `transactions:${chain}:${address}:${optionsKey}`;
    
    return this.executeWithFailover<PaginatedResult<Transaction>>(
      chain,
      provider => provider.getTransactions(address, options),
      cacheKey,
      CACHE_TTL.TRANSACTIONS
    );
  }
  
  /**
   * Get transaction by hash
   * 
   * @param transactionHash Transaction hash
   * @param chain Blockchain chain
   * @returns Transaction details
   */
  public async getTransaction(
    transactionHash: string,
    chain: string = 'solana'
  ): Promise<Transaction | null> {
    const cacheKey = `transaction:${chain}:${transactionHash}`;
    
    return this.executeWithFailover<Transaction | null>(
      chain,
      provider => provider.getTransaction(transactionHash),
      cacheKey,
      CACHE_TTL.TRANSACTION
    );
  }
  
  /**
   * Send a transaction
   * 
   * @param tx Transaction request
   * @param chain Blockchain chain
   * @returns Transaction result
   */
  public async sendTransaction(
    tx: TransactionRequest,
    chain: string = 'solana'
  ): Promise<TransactionResult> {
    // Transactions are not cached
    return this.executeWithFailover<TransactionResult>(
      chain,
      provider => provider.sendTransaction(tx)
    );
  }
  
  /**
   * Estimate transaction fee
   * 
   * @param tx Transaction request
   * @param chain Blockchain chain
   * @returns Fee estimate
   */
  public async estimateFee(
    tx: TransactionRequest,
    chain: string = 'solana'
  ): Promise<FeeEstimate> {
    // Fee estimates are not cached as they fluctuate
    return this.executeWithFailover<FeeEstimate>(
      chain,
      provider => provider.estimateFee(tx)
    );
  }
  
  /**
   * Verify a signed message
   * 
   * @param address Wallet address
   * @param message Message that was signed
   * @param signature Signature to verify
   * @param chain Blockchain chain
   * @returns Verification result
   */
  public async verifyMessage(
    address: string, 
    message: string, 
    signature: string,
    chain: string = 'solana'
  ): Promise<VerificationResult> {
    // Verifications are not cached for security
    return this.executeWithFailover<VerificationResult>(
      chain,
      provider => provider.verifyMessage(address, message, signature)
    );
  }
  
  /**
   * Get current block number
   * 
   * @param chain Blockchain chain
   * @returns Current block number
   */
  public async getCurrentBlockNumber(chain: string = 'solana'): Promise<number> {
    const cacheKey = `block:${chain}:current`;
    
    return this.executeWithFailover<number>(
      chain,
      provider => provider.getCurrentBlockNumber(),
      cacheKey,
      CACHE_TTL.BLOCK
    );
  }
  
  /**
   * Validate wallet address format
   * 
   * @param address Wallet address
   * @param chain Blockchain chain
   * @returns True if the address is valid
   */
  public isAddressValid(
    address: string,
    chain: string = 'solana'
  ): boolean {
    const provider = this.activeProviders.get(chain);
    if (!provider) {
      throw new Error(`No provider available for chain: ${chain}`);
    }
    
    return provider.isAddressValid(address);
  }
}

// Singleton instance
let providerManagerInstance: BlockchainProviderManager | null = null;

/**
 * Get blockchain provider manager instance
 * 
 * @returns Provider manager instance
 */
export function getBlockchainProviderManager(): BlockchainProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new BlockchainProviderManager();
  }
  return providerManagerInstance;
}
