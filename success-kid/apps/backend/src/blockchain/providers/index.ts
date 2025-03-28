/**
 * Blockchain Data Provider System
 * 
 * A robust failover system for blockchain data providers that ensures
 * high availability by seamlessly switching between multiple providers.
 */
import { logger } from '../../lib/logger';
import { BlockchainProvider, ProviderStatus, ProviderPriority } from '../types';
import { SolanaNetwork } from '../types';
import { DexscreenerProvider } from './dexscreener';
import { SolscanProvider } from './solscan';
import { BirdeyeProvider } from './birdeye';
import EventEmitter from 'events';
import { cache } from '../../lib/cache';

/**
 * Provider Manager for blockchain data
 * 
 * Manages multiple blockchain data providers with intelligent failover
 */
export class ProviderManager {
  private providers: Map<string, BlockchainProvider> = new Map();
  private statusCache: Map<string, ProviderStatus> = new Map();
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private readonly events = new EventEmitter();
  
  // Provider check interval (ms)
  private readonly CHECK_INTERVAL = 60000; // 1 minute
  
  // Provider health check timeout (ms)
  private readonly HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
  
  // Status cache TTL (ms)
  private readonly STATUS_CACHE_TTL = 30000; // 30 seconds
  
  // Circuit breaker thresholds
  private readonly ERROR_THRESHOLD = 5; // Number of errors before circuit opens
  private readonly RESET_TIMEOUT = 300000; // 5 minutes until circuit resets
  
  constructor() {
    // Initialize with default providers
    this.registerDefaultProviders();
    
    // Set max listeners to prevent warning
    this.events.setMaxListeners(50);
  }
  
  /**
   * Register default blockchain data providers
   */
  private registerDefaultProviders(): void {
    // Register Dexscreener (primary market data)
    this.registerProvider(new DexscreenerProvider({
      priority: ProviderPriority.HIGH,
      networks: [SolanaNetwork.MAINNET]
    }));
    
    // Register Solscan (blockchain data)
    this.registerProvider(new SolscanProvider({
      priority: ProviderPriority.MEDIUM,
      networks: [SolanaNetwork.MAINNET, SolanaNetwork.DEVNET]
    }));
    
    // Register Birdeye (backup market data)
    this.registerProvider(new BirdeyeProvider({
      priority: ProviderPriority.LOW,
      networks: [SolanaNetwork.MAINNET]
    }));
  }
  
  /**
   * Register a blockchain data provider
   * 
   * @param provider Provider to register
   */
  public registerProvider(provider: BlockchainProvider): void {
    this.providers.set(provider.getId(), provider);
    this.statusCache.set(provider.getId(), {
      id: provider.getId(),
      name: provider.getName(),
      isAvailable: true,
      lastChecked: new Date(),
      latency: 0,
      errorCount: 0,
      circuitOpen: false,
      circuitResetTime: null
    });
    
    logger.info(`Registered blockchain provider: ${provider.getName()}`);
  }
  
  /**
   * Get all registered providers
   * 
   * @returns Map of all providers
   */
  public getProviders(): Map<string, BlockchainProvider> {
    return this.providers;
  }
  
  /**
   * Get provider by ID
   * 
   * @param providerId Provider ID
   * @returns Provider or undefined if not found
   */
  public getProvider(providerId: string): BlockchainProvider | undefined {
    return this.providers.get(providerId);
  }
  
  /**
   * Get best available provider for a specific capability
   * 
   * @param capability Capability to find provider for
   * @param network Network to find provider for
   * @returns Best available provider or null if none available
   */
  public getBestProvider(
    capability: string,
    network: SolanaNetwork = SolanaNetwork.MAINNET
  ): BlockchainProvider | null {
    // Get all providers supporting the capability and network
    const candidates = Array.from(this.providers.values())
      .filter(provider => 
        provider.hasCapability(capability) && 
        provider.supportsNetwork(network)
      );
    
    if (candidates.length === 0) {
      logger.warn(`No providers available for capability: ${capability} on ${network}`);
      return null;
    }
    
    // Filter available providers (not circuit open)
    const availableProviders = candidates.filter(provider => {
      const status = this.getProviderStatus(provider.getId());
      return status.isAvailable && !status.circuitOpen;
    });
    
    // If no providers are available, return the first candidate anyway
    // This will force a health check and potentially reset the circuit
    if (availableProviders.length === 0) {
      logger.warn(`No available providers for ${capability}, using first candidate`);
      return candidates[0];
    }
    
    // Sort by priority (high to low) and then by latency (low to high)
    return availableProviders.sort((a, b) => {
      // First compare by priority (higher priority first)
      const priorityDiff = b.getPriority() - a.getPriority();
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then compare by latency (lower latency first)
      const statusA = this.getProviderStatus(a.getId());
      const statusB = this.getProviderStatus(b.getId());
      return statusA.latency - statusB.latency;
    })[0];
  }
  
  /**
   * Get provider status
   * 
   * @param providerId Provider ID
   * @returns Provider status
   */
  public getProviderStatus(providerId: string): ProviderStatus {
    const status = this.statusCache.get(providerId);
    
    if (!status) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    
    return status;
  }
  
  /**
   * Get all provider statuses
   * 
   * @returns Array of provider statuses
   */
  public getAllProviderStatuses(): ProviderStatus[] {
    return Array.from(this.statusCache.values());
  }
  
  /**
   * Update provider status
   * 
   * @param providerId Provider ID
   * @param updates Status updates
   */
  private updateProviderStatus(
    providerId: string,
    updates: Partial<ProviderStatus>
  ): void {
    const currentStatus = this.statusCache.get(providerId);
    
    if (!currentStatus) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    
    const newStatus = {
      ...currentStatus,
      ...updates,
      lastChecked: new Date()
    };
    
    this.statusCache.set(providerId, newStatus);
    
    // Emit status change event
    this.events.emit('providerStatusChange', newStatus);
  }
  
  /**
   * Check health of a provider
   * 
   * @param providerId Provider ID
   * @returns Provider status after health check
   */
  public async checkProviderHealth(providerId: string): Promise<ProviderStatus> {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    
    const currentStatus = this.statusCache.get(providerId);
    
    if (!currentStatus) {
      throw new Error(`Provider status not found: ${providerId}`);
    }
    
    // If circuit is open, check if it's time to reset
    if (currentStatus.circuitOpen) {
      const now = new Date();
      const resetTime = currentStatus.circuitResetTime;
      
      if (resetTime && now > resetTime) {
        // Reset circuit
        this.updateProviderStatus(providerId, {
          circuitOpen: false,
          circuitResetTime: null,
          errorCount: 0
        });
        
        logger.info(`Circuit reset for provider: ${provider.getName()}`);
      } else {
        // Circuit still open, skip health check
        return currentStatus;
      }
    }
    
    try {
      // Start timing
      const startTime = Date.now();
      
      // Perform health check with timeout
      const isHealthy = await Promise.race([
        provider.checkHealth(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.HEALTH_CHECK_TIMEOUT)
        )
      ]);
      
      // Calculate latency
      const latency = Date.now() - startTime;
      
      if (isHealthy) {
        // Provider is healthy
        this.updateProviderStatus(providerId, {
          isAvailable: true,
          latency,
          errorCount: 0
        });
        
        logger.debug(`Provider healthy: ${provider.getName()} (${latency}ms)`);
      } else {
        // Provider is unhealthy
        const newErrorCount = currentStatus.errorCount + 1;
        const circuitShouldOpen = newErrorCount >= this.ERROR_THRESHOLD;
        
        this.updateProviderStatus(providerId, {
          isAvailable: !circuitShouldOpen,
          errorCount: newErrorCount,
          circuitOpen: circuitShouldOpen,
          circuitResetTime: circuitShouldOpen ? 
            new Date(Date.now() + this.RESET_TIMEOUT) : null
        });
        
        if (circuitShouldOpen) {
          logger.warn(`Circuit opened for provider: ${provider.getName()} (errors: ${newErrorCount})`);
        } else {
          logger.warn(`Provider unhealthy: ${provider.getName()} (errors: ${newErrorCount})`);
        }
      }
    } catch (error) {
      // Health check failed
      const newErrorCount = currentStatus.errorCount + 1;
      const circuitShouldOpen = newErrorCount >= this.ERROR_THRESHOLD;
      
      this.updateProviderStatus(providerId, {
        isAvailable: !circuitShouldOpen,
        errorCount: newErrorCount,
        circuitOpen: circuitShouldOpen,
        circuitResetTime: circuitShouldOpen ? 
          new Date(Date.now() + this.RESET_TIMEOUT) : null
      });
      
      if (circuitShouldOpen) {
        logger.warn(`Circuit opened for provider: ${provider.getName()} (errors: ${newErrorCount})`);
      } else {
        logger.warn(`Provider health check failed: ${provider.getName()}`, { error });
      }
    }
    
    return this.statusCache.get(providerId)!;
  }
  
  /**
   * Check health of all providers
   * 
   * @returns Map of provider IDs to health status
   */
  public async checkAllProviders(): Promise<Map<string, ProviderStatus>> {
    const providers = Array.from(this.providers.keys());
    
    // Check providers in parallel
    await Promise.all(
      providers.map(providerId => this.checkProviderHealth(providerId))
    );
    
    return this.statusCache;
  }
  
  /**
   * Start automatic provider health checks
   */
  public startHealthChecks(): void {
    if (this.statusCheckInterval) {
      // Already running
      return;
    }
    
    // Do an initial check
    this.checkAllProviders().catch(error => {
      logger.error('Error in initial provider health check', { error });
    });
    
    // Set up interval for regular checks
    this.statusCheckInterval = setInterval(() => {
      this.checkAllProviders().catch(error => {
        logger.error('Error in provider health check interval', { error });
      });
    }, this.CHECK_INTERVAL);
    
    logger.info('Started blockchain provider health checks');
  }
  
  /**
   * Stop automatic provider health checks
   */
  public stopHealthChecks(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
      logger.info('Stopped blockchain provider health checks');
    }
  }
  
  /**
   * Execute a function with provider failover
   * 
   * @param capability Required provider capability
   * @param operation Function to execute with provider
   * @param network Blockchain network
   * @param options Execution options
   * @returns Result of the operation
   */
  public async executeWithFailover<T>(
    capability: string,
    operation: (provider: BlockchainProvider) => Promise<T>,
    network: SolanaNetwork = SolanaNetwork.MAINNET,
    options: {
      maxRetries?: number;
      cacheKey?: string;
      cacheTtl?: number;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      cacheKey,
      cacheTtl = 60000 // 1 minute
    } = options;
    
    // Try to get from cache if cache key provided
    if (cacheKey) {
      const cachedResult = await cache.get<T>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    // Keep track of tried providers to avoid retrying the same one
    const triedProviders = new Set<string>();
    
    // Track the last error for rethrowing if all providers fail
    let lastError: Error | null = null;
    
    // Try up to maxRetries times
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Get best provider that hasn't been tried yet
      const availableProviders = Array.from(this.providers.values())
        .filter(provider => 
          provider.hasCapability(capability) && 
          provider.supportsNetwork(network) &&
          !triedProviders.has(provider.getId())
        );
      
      // Sort by priority (high to low) and then by latency (low to high)
      const sortedProviders = availableProviders.sort((a, b) => {
        // First compare by priority (higher priority first)
        const priorityDiff = b.getPriority() - a.getPriority();
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then compare by latency (lower latency first)
        const statusA = this.getProviderStatus(a.getId());
        const statusB = this.getProviderStatus(b.getId());
        return statusA.latency - statusB.latency;
      });
      
      if (sortedProviders.length === 0) {
        // No more providers to try
        logger.error(`No more providers available for capability: ${capability}`);
        break;
      }
      
      const provider = sortedProviders[0];
      triedProviders.add(provider.getId());
      
      try {
        logger.debug(`Trying provider ${provider.getName()} for ${capability}`);
        
        // Execute the operation
        const result = await operation(provider);
        
        // Update provider status on success
        this.updateProviderStatus(provider.getId(), {
          isAvailable: true,
          errorCount: 0
        });
        
        // Cache result if cache key provided
        if (cacheKey) {
          await cache.set(cacheKey, result, cacheTtl);
        }
        
        return result;
      } catch (error) {
        // Log error
        logger.warn(`Provider ${provider.getName()} failed for ${capability}`, { error });
        
        // Update provider status
        const status = this.getProviderStatus(provider.getId());
        const newErrorCount = status.errorCount + 1;
        const circuitShouldOpen = newErrorCount >= this.ERROR_THRESHOLD;
        
        this.updateProviderStatus(provider.getId(), {
          errorCount: newErrorCount,
          circuitOpen: circuitShouldOpen,
          circuitResetTime: circuitShouldOpen ? 
            new Date(Date.now() + this.RESET_TIMEOUT) : null
        });
        
        // Store error for potential rethrowing
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Continue to next provider
      }
    }
    
    // All providers failed
    throw lastError || new Error(`All providers failed for capability: ${capability}`);
  }
  
  /**
   * Subscribe to provider status changes
   * 
   * @param listener Callback function for status changes
   * @returns Unsubscribe function
   */
  public onStatusChange(
    listener: (status: ProviderStatus) => void
  ): () => void {
    this.events.on('providerStatusChange', listener);
    
    // Return unsubscribe function
    return () => {
      this.events.off('providerStatusChange', listener);
    };
  }
}

// Export singleton instance
export const providerManager = new ProviderManager();
