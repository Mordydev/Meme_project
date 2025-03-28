/**
 * Provider Manager
 * 
 * This service manages market data providers, handling selection, 
 * failover, and health monitoring.
 */
import { logger } from '../../lib/logger';
import { 
  ProviderConfig, 
  ProviderHealth, 
  ProviderOperation, 
  ProviderError,
  AllProvidersFailedError,
  ProviderRateLimitError,
  ProviderUnavailableError,
  ProviderCapability
} from './types';

/**
 * Provider registration
 */
interface ProviderRegistration<T> {
  id: string;
  instance: T;
  config: ProviderConfig;
  health: ProviderHealth;
}

/**
 * Provider manager implementation
 */
export class ProviderManager {
  // Provider registrations
  private providers: Map<string, Map<string, ProviderRegistration<any>>> = new Map();
  
  // Circuit breaker settings
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3; // consecutive failures
  private readonly CIRCUIT_BREAKER_RESET_TIMEOUT = 60 * 1000; // 1 minute
  
  /**
   * Register a provider
   * 
   * @param type Provider type
   * @param provider Provider instance
   * @param config Provider configuration
   */
  registerProvider<T>(type: string, provider: T, config: ProviderConfig): void {
    // Create provider type map if it doesn't exist
    if (!this.providers.has(type)) {
      this.providers.set(type, new Map());
    }
    
    const providerId = config.name.toLowerCase();
    
    // Initialize provider registration
    const registration: ProviderRegistration<T> = {
      id: providerId,
      instance: provider,
      config,
      health: {
        name: config.name,
        isHealthy: true,
        latency: 0,
        lastCheck: new Date(),
        errorCount: 0,
        consecutiveFailures: 0,
        isCircuitBroken: false
      }
    };
    
    // Add to provider type map
    this.providers.get(type)!.set(providerId, registration);
    
    logger.info(`Registered provider ${config.name} for ${type}`);
  }
  
  /**
   * Get a provider of the specified type
   * 
   * @param type Provider type
   * @returns Provider instance or null if not found
   */
  async getProvider<T>(type: string): Promise<T | null> {
    const providers = this.getProvidersForType<T>(type);
    
    if (providers.length === 0) {
      return null;
    }
    
    // Return first healthy provider
    for (const provider of providers) {
      if (this.isProviderHealthy(provider.id)) {
        return provider.instance;
      }
    }
    
    // If all providers are unhealthy, return the first one
    // (will attempt to use it and potentially heal the circuit)
    return providers[0].instance;
  }
  
  /**
   * Execute an operation with provider failover
   * 
   * @param type Provider type
   * @param operation Function to execute with provider
   * @returns Operation result
   */
  async executeWithFailover<T>(
    type: string, 
    operation: ProviderOperation<T>
  ): Promise<T> {
    // Get providers for this type in priority order
    const providers = this.getProvidersForType(type);
    
    if (providers.length === 0) {
      throw new Error(`No providers available for type ${type}`);
    }
    
    const errors: ProviderError[] = [];
    
    // Try each provider until successful
    for (const provider of providers) {
      // Skip unhealthy providers with circuit breaker tripped
      if (provider.health.isCircuitBroken) {
        // Check if it's time to reset the circuit breaker
        if (provider.health.nextRetryAt && new Date() >= provider.health.nextRetryAt) {
          logger.info(`Resetting circuit breaker for provider ${provider.id}`);
          provider.health.isCircuitBroken = false;
          provider.health.consecutiveFailures = 0;
        } else {
          logger.debug(`Skipping provider ${provider.id} due to open circuit breaker`);
          continue;
        }
      }
      
      try {
        // Execute with timeout
        const startTime = Date.now();
        
        const result = await Promise.race([
          operation(provider.instance),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new ProviderUnavailableError(
                provider.id,
                type,
                new Error(`Timeout after ${provider.config.timeout}ms`)
              ));
            }, provider.config.timeout);
          })
        ]);
        
        // Record success
        this.recordProviderSuccess(provider.id, Date.now() - startTime);
        
        return result;
      } catch (error) {
        // Handle and record failure
        const providerError = this.handleProviderError(provider, type, error);
        errors.push(providerError);
        
        // If rate limited, skip to next provider immediately
        if (providerError instanceof ProviderRateLimitError) {
          logger.warn(`Provider ${provider.id} rate limited, trying next provider`);
          continue;
        }
        
        // If not retryable, skip to next provider immediately
        if (!providerError.isRetryable) {
          logger.warn(`Provider ${provider.id} encountered non-retryable error, trying next provider`);
          continue;
        }
        
        // Continue to next provider
      }
    }
    
    // All providers failed
    throw new AllProvidersFailedError(type, errors);
  }
  
  /**
   * Check provider health
   * 
   * @param providerType Provider type
   * @param providerId Provider ID
   * @returns Provider health status
   */
  async checkProviderHealth(providerType: string, providerId: string): Promise<ProviderHealth> {
    const provider = this.getProvider(providerType, providerId);
    
    if (!provider) {
      throw new Error(`Provider ${providerId} not found for type ${providerType}`);
    }
    
    // Call isAvailable() if it exists, otherwise assume healthy
    try {
      const startTime = Date.now();
      
      if (typeof provider.instance.isAvailable === 'function') {
        const isAvailable = await provider.instance.isAvailable();
        const latency = Date.now() - startTime;
        
        this.updateProviderStatus(providerId, isAvailable, latency);
      } else {
        // Assume healthy if no health check method
        this.updateProviderStatus(providerId, true, 0);
      }
    } catch (error) {
      logger.error(`Health check failed for provider ${providerId}`, { error });
      this.updateProviderStatus(providerId, false, 0);
    }
    
    return provider.health;
  }
  
  /**
   * Update provider status
   * 
   * @param providerId Provider ID
   * @param isHealthy Whether the provider is healthy
   * @param latency Provider response latency
   */
  updateProviderStatus(providerId: string, isHealthy: boolean, latency?: number): void {
    // Find provider across all types
    for (const typeProviders of this.providers.values()) {
      const provider = typeProviders.get(providerId);
      
      if (provider) {
        // Update health
        provider.health.isHealthy = isHealthy;
        provider.health.lastCheck = new Date();
        
        if (latency !== undefined) {
          provider.health.latency = latency;
        }
        
        // Update failure tracking
        if (isHealthy) {
          provider.health.consecutiveFailures = 0;
          
          // Clear circuit broken status if needed
          if (provider.health.isCircuitBroken) {
            provider.health.isCircuitBroken = false;
            provider.health.nextRetryAt = undefined;
          }
        } else {
          provider.health.errorCount++;
          provider.health.consecutiveFailures++;
          
          // Check circuit breaker threshold
          if (
            provider.health.consecutiveFailures >= this.CIRCUIT_BREAKER_THRESHOLD &&
            !provider.health.isCircuitBroken
          ) {
            provider.health.isCircuitBroken = true;
            provider.health.nextRetryAt = new Date(
              Date.now() + this.CIRCUIT_BREAKER_RESET_TIMEOUT
            );
            
            logger.warn(`Circuit breaker tripped for provider ${providerId}`);
          }
        }
        
        break;
      }
    }
  }
  
  /**
   * Get all providers for a specific type
   * 
   * @param type Provider type
   * @returns Provider registrations sorted by priority
   */
  private getProvidersForType<T>(type: string): ProviderRegistration<T>[] {
    const typeProviders = this.providers.get(type);
    
    if (!typeProviders) {
      return [];
    }
    
    // Convert to array and sort by priority
    return Array.from(typeProviders.values())
      .sort((a, b) => a.config.priority - b.config.priority);
  }
  
  /**
   * Get a specific provider instance
   * 
   * @param type Provider type
   * @param providerId Provider ID
   * @returns Provider registration or undefined if not found
   */
  private getProvider<T>(type: string, providerId: string): ProviderRegistration<T> | undefined {
    const typeProviders = this.providers.get(type);
    
    if (!typeProviders) {
      return undefined;
    }
    
    return typeProviders.get(providerId) as ProviderRegistration<T> | undefined;
  }
  
  /**
   * Check if a provider is healthy
   * 
   * @param providerId Provider ID
   * @returns True if the provider is healthy and not circuit broken
   */
  private isProviderHealthy(providerId: string): boolean {
    // Check all provider types
    for (const typeProviders of this.providers.values()) {
      const provider = typeProviders.get(providerId);
      
      if (provider) {
        return provider.health.isHealthy && !provider.health.isCircuitBroken;
      }
    }
    
    return false;
  }
  
  /**
   * Record a successful provider operation
   * 
   * @param providerId Provider ID
   * @param latency Operation latency in ms
   */
  private recordProviderSuccess(providerId: string, latency: number): void {
    // Update health status
    this.updateProviderStatus(providerId, true, latency);
  }
  
  /**
   * Record a failed provider operation
   * 
   * @param providerId Provider ID
   * @param error Error encountered
   */
  private recordProviderFailure(providerId: string, error: ProviderError): void {
    // Update health status
    this.updateProviderStatus(providerId, false);
    
    // Log failure
    logger.warn(`Provider ${providerId} failed: ${error.message}`);
  }
  
  /**
   * Handle provider error
   * 
   * @param provider Provider registration
   * @param operation Operation being performed
   * @param error Error encountered
   * @returns Provider error
   */
  private handleProviderError(
    provider: ProviderRegistration<any>,
    operation: string,
    error: any
  ): ProviderError {
    // Create provider error instance
    let providerError: ProviderError;
    
    if (error instanceof ProviderError) {
      providerError = error;
    } else {
      providerError = new ProviderError(
        error.message || 'Unknown provider error',
        provider.id,
        operation,
        true,
        error
      );
    }
    
    // Record failure
    this.recordProviderFailure(provider.id, providerError);
    
    return providerError;
  }
  
  /**
   * Get all providers that support a specific capability
   * 
   * @param capability Provider capability
   * @returns Array of provider IDs
   */
  getProvidersWithCapability(capability: ProviderCapability): string[] {
    const result: string[] = [];
    
    // Check all provider types
    for (const typeProviders of this.providers.values()) {
      for (const [id, provider] of typeProviders.entries()) {
        if (provider.config.capabilities.includes(capability)) {
          result.push(id);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get all registered providers
   * 
   * @returns Map of provider types to provider IDs
   */
  getAllProviders(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    
    for (const [type, providers] of this.providers.entries()) {
      result.set(type, Array.from(providers.keys()));
    }
    
    return result;
  }
  
  /**
   * Get health status for all registered providers
   * 
   * @returns Map of provider IDs to health status
   */
  getProvidersHealth(): Map<string, ProviderHealth> {
    const result = new Map<string, ProviderHealth>();
    
    for (const typeProviders of this.providers.values()) {
      for (const [id, provider] of typeProviders.entries()) {
        result.set(id, { ...provider.health });
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const providerManager = new ProviderManager();
