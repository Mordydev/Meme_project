/**
 * Market Data Provider Types
 * 
 * This module defines common interfaces and types for market data providers.
 */
import { PricePoint, TokenPrice } from '../../models/entities/market/price.model';
import { TimePeriod } from '../../models/entities/market/price.model';

/**
 * Provider configuration model
 */
export interface ProviderConfig {
  name: string;
  priority: number;
  capabilities: ProviderCapability[];
  rateLimit: {
    requests: number;
    period: number;  // in seconds
  };
  timeout: number;   // in milliseconds
  baseUrl: string;
  apiKey?: string;
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  name: string;
  isHealthy: boolean;
  latency: number;
  lastCheck: Date;
  errorCount: number;
  consecutiveFailures: number;
  isCircuitBroken: boolean;
  nextRetryAt?: Date;
}

/**
 * Provider capability enum
 */
export enum ProviderCapability {
  CURRENT_PRICE = 'current_price',
  HISTORICAL_PRICE = 'historical_price',
  MARKET_CAP = 'market_cap',
  SUPPLY_DATA = 'supply_data',
  TRANSACTIONS = 'transactions',
  VOLUME_DATA = 'volume_data',
  MULTIPLE_TOKENS = 'multiple_tokens',
}

/**
 * Provider operation function type
 */
export type ProviderOperation<T> = (provider: any) => Promise<T>;

/**
 * Price data provider interface
 */
export interface PriceProvider {
  /**
   * Get provider name
   */
  getName(): string;
  
  /**
   * Get current price for a token
   * 
   * @param symbol Token symbol
   * @returns Token price data
   */
  getCurrentPrice(symbol: string): Promise<TokenPrice>;
  
  /**
   * Get historical prices for a token
   * 
   * @param symbol Token symbol
   * @param period Time period
   * @returns Array of price points
   */
  getHistoricalPrices(symbol: string, period: TimePeriod): Promise<PricePoint[]>;
  
  /**
   * Check if provider is available
   * 
   * @returns True if provider is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get provider capabilities
   * 
   * @returns Array of provider capabilities
   */
  getCapabilities(): ProviderCapability[];
}

/**
 * Provider error
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly operation: string,
    public readonly isRetryable: boolean = true,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Provider unavailable error
 */
export class ProviderUnavailableError extends ProviderError {
  constructor(provider: string, operation: string, originalError?: Error) {
    super(
      `Provider ${provider} is unavailable`,
      provider,
      operation,
      true,
      originalError
    );
    this.name = 'ProviderUnavailableError';
  }
}

/**
 * Provider rate limit error
 */
export class ProviderRateLimitError extends ProviderError {
  constructor(
    provider: string,
    operation: string,
    public readonly retryAfter?: number,
    originalError?: Error
  ) {
    super(
      `Rate limit exceeded for provider ${provider}`,
      provider,
      operation,
      true,
      originalError
    );
    this.name = 'ProviderRateLimitError';
  }
}

/**
 * All providers failed error
 */
export class AllProvidersFailedError extends Error {
  constructor(operation: string, public readonly errors: ProviderError[] = []) {
    super(`All providers failed for operation: ${operation}`);
    this.name = 'AllProvidersFailedError';
  }
}
