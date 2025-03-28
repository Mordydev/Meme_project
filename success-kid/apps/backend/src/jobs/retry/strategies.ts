/**
 * Retry Strategies
 * 
 * Defines retry strategies for different job types.
 */
import { Job } from 'bull';
import { FailureAnalysis } from './analyzer';

/**
 * Retry decision returned by the retry strategy
 */
export interface RetryDecision {
  /** Whether the job should be retried */
  shouldRetry: boolean;
  /** Delay before the next attempt (if retrying) */
  delay?: number;
  /** The current attempt number */
  attempt: number;
  /** Reason for the decision */
  reason: string;
}

/**
 * Retry strategy interface
 */
export interface RetryStrategy {
  /** Strategy type identifier */
  type: 'fixed' | 'exponential' | 'linear' | 'custom';
  
  /** Base delay in milliseconds */
  baseDelay: number;
  
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  
  /** 
   * Calculate delay for next attempt
   * 
   * @param attempt Attempt number (0-based)
   * @param baseDelay Base delay in milliseconds
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number, baseDelay: number): number;
  
  /**
   * Determine if job should be retried based on error
   * 
   * @param job Failed job
   * @param error Error that caused the failure
   * @param analysis Failure analysis
   * @returns true if job should be retried, false otherwise
   */
  shouldRetry(job: Job, error: Error, analysis: FailureAnalysis): boolean;
}

/**
 * Fixed delay retry strategy
 */
export const fixedDelayStrategy: RetryStrategy = {
  type: 'fixed',
  baseDelay: 1000, // 1 second
  maxAttempts: 3,
  
  calculateDelay(attempt: number, baseDelay: number): number {
    return baseDelay;
  },
  
  shouldRetry(job: Job, error: Error, analysis: FailureAnalysis): boolean {
    // Don't retry if the failure is permanent
    if (analysis.isPermanentFailure) {
      return false;
    }
    
    return true;
  }
};

/**
 * Exponential backoff retry strategy
 */
export const exponentialBackoffStrategy: RetryStrategy = {
  type: 'exponential',
  baseDelay: 1000, // 1 second
  maxAttempts: 5,
  maxDelay: 60000, // 1 minute
  
  calculateDelay(attempt: number, baseDelay: number): number {
    // Calculate exponential delay: baseDelay * 2^attempt
    const delay = baseDelay * Math.pow(2, attempt);
    
    // Add some jitter to prevent multiple retries at the same time
    const jitter = Math.random() * 0.2 + 0.9; // Random factor between 0.9 and 1.1
    
    // Apply max delay if set
    return Math.min(delay * jitter, this.maxDelay || Number.MAX_SAFE_INTEGER);
  },
  
  shouldRetry(job: Job, error: Error, analysis: FailureAnalysis): boolean {
    // Don't retry if the failure is permanent
    if (analysis.isPermanentFailure) {
      return false;
    }
    
    return true;
  }
};

/**
 * Linear backoff retry strategy
 */
export const linearBackoffStrategy: RetryStrategy = {
  type: 'linear',
  baseDelay: 1000, // 1 second
  maxAttempts: 5,
  maxDelay: 60000, // 1 minute
  
  calculateDelay(attempt: number, baseDelay: number): number {
    // Calculate linear delay: baseDelay * attempt
    const delay = baseDelay * (attempt + 1);
    
    // Apply max delay if set
    return Math.min(delay, this.maxDelay || Number.MAX_SAFE_INTEGER);
  },
  
  shouldRetry(job: Job, error: Error, analysis: FailureAnalysis): boolean {
    // Don't retry if the failure is permanent
    if (analysis.isPermanentFailure) {
      return false;
    }
    
    return true;
  }
};

/**
 * Get the default retry strategy
 * 
 * @returns Default retry strategy
 */
export function getDefaultStrategy(): RetryStrategy {
  return exponentialBackoffStrategy;
}

/**
 * Create a custom retry strategy
 * 
 * @param options Strategy options
 * @returns Custom retry strategy
 */
export function createCustomStrategy(options: {
  type: 'fixed' | 'exponential' | 'linear' | 'custom';
  baseDelay: number;
  maxAttempts: number;
  maxDelay?: number;
  calculateDelay?: RetryStrategy['calculateDelay'];
  shouldRetry?: RetryStrategy['shouldRetry'];
}): RetryStrategy {
  // Start with the appropriate base strategy
  let baseStrategy: RetryStrategy;
  
  switch (options.type) {
    case 'fixed':
      baseStrategy = { ...fixedDelayStrategy };
      break;
    case 'linear':
      baseStrategy = { ...linearBackoffStrategy };
      break;
    case 'exponential':
    default:
      baseStrategy = { ...exponentialBackoffStrategy };
      break;
  }
  
  // Override with custom options
  return {
    ...baseStrategy,
    ...options,
    // Use custom calculateDelay if provided, otherwise keep the base strategy's implementation
    calculateDelay: options.calculateDelay || baseStrategy.calculateDelay,
    // Use custom shouldRetry if provided, otherwise keep the base strategy's implementation
    shouldRetry: options.shouldRetry || baseStrategy.shouldRetry
  };
}
