/**
 * Retry Strategies
 * 
 * Defines retry strategies for handling failed jobs
 */
import { Job } from 'bull';
import { logger } from '../../lib/logger';

/**
 * Retry strategy types
 */
export enum RetryStrategyType {
  FIXED = 'fixed',
  EXPONENTIAL = 'exponential',
  CUSTOM = 'custom'
}

/**
 * Retry strategy interface
 */
export interface RetryStrategy {
  type: RetryStrategyType;
  calculateDelay(attempt: number, baseDelay: number): number;
  shouldRetry(job: Job, error: Error): boolean;
  maxAttempts: number;
  description: string;
}

/**
 * Fixed delay retry strategy
 */
export class FixedDelayStrategy implements RetryStrategy {
  type = RetryStrategyType.FIXED;
  
  constructor(
    public maxAttempts: number = 3,
    public baseDelay: number = 5000,
    public description: string = 'Fixed delay between retry attempts'
  ) {}
  
  calculateDelay(attempt: number, baseDelay: number): number {
    return baseDelay || this.baseDelay;
  }
  
  shouldRetry(job: Job, error: Error): boolean {
    // Retry for all errors except those explicitly marked as non-retryable
    return !(error as any).noRetry;
  }
}

/**
 * Exponential backoff retry strategy
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
  type = RetryStrategyType.EXPONENTIAL;
  
  constructor(
    public maxAttempts: number = 5,
    public baseDelay: number = 1000,
    public factor: number = 2,
    public maxDelay: number = 60000,
    public description: string = 'Exponentially increasing delay between retry attempts'
  ) {}
  
  calculateDelay(attempt: number, baseDelay: number): number {
    const delay = (baseDelay || this.baseDelay) * Math.pow(this.factor, attempt - 1);
    
    // Add jitter to prevent thundering herd problem
    const jitter = 0.2 * delay * (Math.random() - 0.5);
    
    // Apply max delay and jitter
    return Math.min(delay + jitter, this.maxDelay);
  }
  
  shouldRetry(job: Job, error: Error): boolean {
    // Retry for all errors except those explicitly marked as non-retryable
    return !(error as any).noRetry;
  }
}

/**
 * Custom retry strategy
 */
export class CustomRetryStrategy implements RetryStrategy {
  type = RetryStrategyType.CUSTOM;
  
  constructor(
    public calculateDelayFn: (attempt: number, baseDelay: number) => number,
    public shouldRetryFn: (job: Job, error: Error) => boolean,
    public maxAttempts: number = 3,
    public description: string = 'Custom retry strategy'
  ) {}
  
  calculateDelay(attempt: number, baseDelay: number): number {
    return this.calculateDelayFn(attempt, baseDelay);
  }
  
  shouldRetry(job: Job, error: Error): boolean {
    return this.shouldRetryFn(job, error);
  }
}

/**
 * Create a non-retryable error
 * 
 * @param message Error message
 * @returns Error marked as non-retryable
 */
export function createNonRetryableError(message: string): Error {
  const error = new Error(message);
  (error as any).noRetry = true;
  return error;
}

/**
 * Check if an error is retryable
 * 
 * @param error The error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: Error): boolean {
  return !(error as any).noRetry;
}

/**
 * Default retry strategies
 */
export const defaultRetryStrategies = {
  fixed: new FixedDelayStrategy(),
  exponential: new ExponentialBackoffStrategy(),
  limited: new ExponentialBackoffStrategy(3, 1000, 2, 10000, 'Limited retries with exponential backoff'),
  aggressive: new ExponentialBackoffStrategy(10, 500, 1.5, 30000, 'Aggressive retries with moderate backoff'),
  gentle: new FixedDelayStrategy(5, 10000, 'Gentle retries with consistent delay')
};
