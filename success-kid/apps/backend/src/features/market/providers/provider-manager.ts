/**
 * Provider manager for market data sources
 * Handles provider selection, failover, and health checks
 */
import { PriceProvider, TransactionProvider, WalletProvider } from './provider-interface';
import { ProviderConfig, ProviderHealth } from '../types';
import { logger } from '../../../lib/logger';
import { Redis } from 'ioredis';

// Type for provider operations
export type ProviderOperation<T> = (provider: any) => Promise<T>;

/**
 * Interface for the provider manager
 */
export interface IProviderManager {
  getProvider<T extends PriceProvider | TransactionProvider | WalletProvider>(type: string): Promise<T>;
  executeWithFailover<T>(type: string, operation: ProviderOperation<T>): Promise<T>;
  registerProvider(type: string, provider: PriceProvider | TransactionProvider | WalletProvider, config: ProviderConfig): void;
  checkProviderHealth(provider: PriceProvider | TransactionProvider | WalletProvider): Promise<ProviderHealth>;
  updateProviderStatus(providerId: string, isHealthy: boolean): void;
}

/**
 * Provider manager implementation
 */
export class ProviderManager implements IProviderManager {
  private providers: Map<string, { id: string, instance: any, config: ProviderConfig }[]> = new Map();
  private providerHealth: Map<string, ProviderHealth> = new Map();
  private redis: Redis;
  
  /**
   * Create a new provider manager
   * @param redis Redis client for distributed health state
   */
  constructor(redis: Redis) {
    this.redis = redis;
    this.setupHealthChecks();
  }
  
  /**
   * Register a provider with the manager
   * @param type Provider type (e.g. 'price', 'transaction')
   * @param provider Provider instance
   * @param config Provider configuration
   */
  registerProvider(
    type: string, 
    provider: PriceProvider | TransactionProvider | WalletProvider, 
    config: ProviderConfig
  ): void {
    // Initialize type if not exists
    if (!this.providers.has(type)) {
      this.providers.set(type, []);
    }
    
    const providerId = `${type}.${provider.getName()}`;
    
    // Add provider to list
    this.providers.get(type)!.push({
      id: providerId,
      instance: provider,
      config
    });
    
    // Sort providers by priority
    this.providers.get(type)!.sort((a, b) => a.config.priority - b.config.priority);
    
    // Initialize health
    this.providerHealth.set(providerId, {
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0,
      avgResponseTime: 0
    });
    
    logger.info(`Registered provider ${providerId} with priority ${config.priority}`);
  }
  
  /**
   * Get a provider for the specified type
   * @param type Provider type
   * @returns Provider instance
   */
  async getProvider<T extends PriceProvider | TransactionProvider | WalletProvider>(type: string): Promise<T> {
    // Get providers for type
    const providers = this.providers.get(type);
    if (!providers || providers.length === 0) {
      throw new Error(`No providers registered for type ${type}`);
    }
    
    // Find first healthy provider
    for (const provider of providers) {
      const health = await this.getProviderHealth(provider.id);
      if (health.isHealthy) {
        return provider.instance as T;
      }
    }
    
    // No healthy providers, return first provider and log warning
    logger.warn(`No healthy providers for ${type}, using first available`);
    return providers[0].instance as T;
  }
  
  /**
   * Execute an operation with failover
   * @param type Provider type
   * @param operation Operation to execute
   * @returns Operation result
   */
  async executeWithFailover<T>(type: string, operation: ProviderOperation<T>): Promise<T> {
    // Get providers for this type
    const providers = this.providers.get(type);
    if (!providers || providers.length === 0) {
      throw new Error(`No providers registered for type ${type}`);
    }
    
    // Try each provider until successful
    for (const provider of providers) {
      const health = await this.getProviderHealth(provider.id);
      if (!health.isHealthy) {
        logger.debug(`Skipping unhealthy provider ${provider.id}`);
        continue;
      }
      
      try {
        const startTime = Date.now();
        
        // Execute with timeout
        const result = await Promise.race([
          operation(provider.instance),
          this.createTimeout(provider.config.timeout)
        ]);
        
        // Record success
        this.recordProviderSuccess(provider.id, Date.now() - startTime);
        
        return result;
      } catch (error) {
        // Record failure
        this.recordProviderFailure(provider.id, error);
        
        logger.warn(`Provider ${provider.id} failed`, { 
          error: error.message, 
          type 
        });
        
        // Continue to next provider
      }
    }
    
    // All providers failed
    throw new Error(`All providers for ${type} failed`);
  }
  
  /**
   * Check provider health
   * @param provider Provider to check
   * @returns Health status
   */
  async checkProviderHealth(
    provider: PriceProvider | TransactionProvider | WalletProvider
  ): Promise<ProviderHealth> {
    try {
      const startTime = Date.now();
      const isAvailable = await provider.isAvailable();
      const responseTime = Date.now() - startTime;
      
      const providerId = this.getProviderIdByInstance(provider);
      if (!providerId) {
        logger.warn(`Provider ${provider.getName()} not found in registry`);
        return {
          isHealthy: isAvailable,
          lastCheck: new Date(),
          errorCount: 0,
          avgResponseTime: responseTime
        };
      }
      
      // Update health status
      if (isAvailable) {
        this.recordProviderSuccess(providerId, responseTime);
      } else {
        this.recordProviderFailure(providerId, new Error('Provider not available'));
      }
      
      return this.providerHealth.get(providerId)!;
    } catch (error) {
      logger.error('Provider health check failed', { 
        provider: provider.getName(), 
        error: error.message 
      });
      
      const providerId = this.getProviderIdByInstance(provider);
      if (providerId) {
        this.recordProviderFailure(providerId, error);
      }
      
      return {
        isHealthy: false,
        lastCheck: new Date(),
        errorCount: 1,
        avgResponseTime: 0
      };
    }
  }
  
  /**
   * Update provider status
   * @param providerId Provider ID
   * @param isHealthy Health status
   */
  async updateProviderStatus(providerId: string, isHealthy: boolean): Promise<void> {
    // Store in Redis for distributed state
    await this.redis.set(`provider:${providerId}:health`, isHealthy ? '1' : '0', 'EX', 300);
    
    // Update local cache
    const health = this.providerHealth.get(providerId);
    if (health) {
      health.isHealthy = isHealthy;
      health.lastCheck = new Date();
      this.providerHealth.set(providerId, health);
    }
    
    if (!isHealthy) {
      logger.warn(`Provider ${providerId} marked as unhealthy`);
    } else {
      logger.info(`Provider ${providerId} marked as healthy`);
    }
  }
  
  /**
   * Get provider health
   * @param providerId Provider ID
   * @returns Health status
   */
  private async getProviderHealth(providerId: string): Promise<ProviderHealth> {
    // Try to get from Redis first for distributed state
    const redisHealth = await this.redis.get(`provider:${providerId}:health`);
    if (redisHealth !== null) {
      const health = this.providerHealth.get(providerId) || {
        isHealthy: redisHealth === '1',
        lastCheck: new Date(),
        errorCount: 0,
        avgResponseTime: 0
      };
      
      health.isHealthy = redisHealth === '1';
      return health;
    }
    
    // Fall back to local cache
    return this.providerHealth.get(providerId) || {
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0,
      avgResponseTime: 0
    };
  }
  
  /**
   * Record successful provider operation
   * @param providerId Provider ID
   * @param responseTime Response time in ms
   */
  private recordProviderSuccess(providerId: string, responseTime: number): void {
    const health = this.providerHealth.get(providerId);
    if (!health) return;
    
    // Update response time as exponential moving average
    health.avgResponseTime = health.avgResponseTime === 0
      ? responseTime
      : health.avgResponseTime * 0.8 + responseTime * 0.2;
    
    // Reset error count on success
    health.errorCount = 0;
    health.isHealthy = true;
    health.lastCheck = new Date();
    
    this.providerHealth.set(providerId, health);
    
    // Update Redis
    this.redis.set(`provider:${providerId}:health`, '1', 'EX', 300).catch(err => {
      logger.error('Failed to update provider health in Redis', { 
        providerId, 
        error: err.message 
      });
    });
  }
  
  /**
   * Record provider failure
   * @param providerId Provider ID
   * @param error Error
   */
  private recordProviderFailure(providerId: string, error: Error): void {
    const health = this.providerHealth.get(providerId);
    if (!health) return;
    
    // Increment error count
    health.errorCount += 1;
    health.lastCheck = new Date();
    
    // Mark as unhealthy if error count exceeds threshold
    if (health.errorCount >= 3) {
      health.isHealthy = false;
      
      // Update Redis
      this.redis.set(`provider:${providerId}:health`, '0', 'EX', 300).catch(err => {
        logger.error('Failed to update provider health in Redis', { 
          providerId, 
          error: err.message 
        });
      });
      
      logger.warn(`Provider ${providerId} marked unhealthy after ${health.errorCount} errors`);
    }
    
    this.providerHealth.set(providerId, health);
  }
  
  /**
   * Create a timeout promise
   * @param timeout Timeout in ms
   */
  private createTimeout(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
  }
  
  /**
   * Get provider ID by instance
   * @param instance Provider instance
   * @returns Provider ID or null if not found
   */
  private getProviderIdByInstance(
    instance: PriceProvider | TransactionProvider | WalletProvider
  ): string | null {
    for (const [type, providers] of this.providers.entries()) {
      for (const provider of providers) {
        if (provider.instance === instance) {
          return provider.id;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Set up periodic health checks
   */
  private setupHealthChecks(): void {
    // Check health every 5 minutes
    setInterval(() => {
      this.runHealthChecks().catch(err => {
        logger.error('Health check failure', { error: err.message });
      });
    }, 5 * 60 * 1000);
  }
  
  /**
   * Run health checks for all providers
   */
  private async runHealthChecks(): Promise<void> {
    logger.debug('Running provider health checks');
    
    for (const [type, providers] of this.providers.entries()) {
      for (const provider of providers) {
        try {
          const health = await this.checkProviderHealth(provider.instance);
          logger.debug(`Health check for ${provider.id}: ${health.isHealthy ? 'healthy' : 'unhealthy'}`);
        } catch (error) {
          logger.error(`Health check failed for ${provider.id}`, { error: error.message });
        }
      }
    }
  }
  
  /**
   * Get all registered providers
   * @returns Map of providers by type
   */
  getProvidersForType(type: string): { id: string; instance: any; config: ProviderConfig }[] {
    return this.providers.get(type) || [];
  }
  
  /**
   * Get health status for all providers
   * @returns Provider health status
   */
  getProviderStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [providerId, health] of this.providerHealth.entries()) {
      stats[providerId] = {
        healthy: health.isHealthy,
        lastCheck: health.lastCheck.toISOString(),
        errorCount: health.errorCount,
        avgResponseTime: Math.round(health.avgResponseTime)
      };
    }
    
    return stats;
  }
}
