/**
 * Failure Analyzer
 * 
 * Analyzes job failures to determine retry behavior.
 */
import { logger } from '../../lib/logger';

/**
 * Types of failures that can occur
 */
export enum FailureType {
  /** Temporary failure that should be retried */
  TEMPORARY = 'temporary',
  /** Permanent failure that should not be retried */
  PERMANENT = 'permanent',
  /** Network-related failure */
  NETWORK = 'network',
  /** Database-related failure */
  DATABASE = 'database',
  /** Timeout failure */
  TIMEOUT = 'timeout',
  /** External service failure */
  EXTERNAL_SERVICE = 'external_service',
  /** Resource exhaustion */
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  /** Rate limiting */
  RATE_LIMIT = 'rate_limit',
  /** Invalid input */
  INVALID_INPUT = 'invalid_input',
  /** Authorization failure */
  AUTHORIZATION = 'authorization',
  /** Unknown failure */
  UNKNOWN = 'unknown'
}

/**
 * Failure analysis result
 */
export interface FailureAnalysis {
  /** Type of failure */
  type: FailureType;
  /** Whether this is a permanent failure that should not be retried */
  isPermanentFailure: boolean;
  /** Reason to retry (if retryable) */
  retryReason?: string;
  /** Reason not to retry (if not retryable) */
  nonRetryReason?: string;
  /** Suggested delay before retry (in milliseconds) */
  suggestedDelayMs?: number;
}

/**
 * Analyze a failure to determine if it's retryable
 * 
 * @param error Error that caused the failure
 * @returns Failure analysis
 */
export function analyzeFaulure(error: Error): FailureAnalysis {
  // If we have a more specific error type,
  // we would look for properties like error.code
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';
  
  try {
    // Check for timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorStack.includes('timeout')
    ) {
      return {
        type: FailureType.TIMEOUT,
        isPermanentFailure: false,
        retryReason: 'Operation timed out, will retry',
        suggestedDelayMs: 5000 // 5 seconds
      };
    }
    
    // Check for network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('connect') ||
      errorMessage.includes('socket') ||
      errorStack.includes('econnrefused') ||
      errorStack.includes('econnreset') ||
      errorStack.includes('etimedout')
    ) {
      return {
        type: FailureType.NETWORK,
        isPermanentFailure: false,
        retryReason: 'Network error, will retry',
        suggestedDelayMs: 3000 // 3 seconds
      };
    }
    
    // Check for database errors
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('db') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('query') ||
      errorStack.includes('database') ||
      errorStack.includes('pg') ||
      errorStack.includes('sequelize')
    ) {
      // Check for constraint violations (permanent errors)
      if (
        errorMessage.includes('constraint') ||
        errorMessage.includes('unique') ||
        errorMessage.includes('duplicate') ||
        errorStack.includes('constraint')
      ) {
        return {
          type: FailureType.DATABASE,
          isPermanentFailure: true,
          nonRetryReason: 'Database constraint violation, not retrying'
        };
      }
      
      // Other database errors are retryable
      return {
        type: FailureType.DATABASE,
        isPermanentFailure: false,
        retryReason: 'Database error, will retry',
        suggestedDelayMs: 2000 // 2 seconds
      };
    }
    
    // Check for rate limiting
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('ratelimit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429')
    ) {
      return {
        type: FailureType.RATE_LIMIT,
        isPermanentFailure: false,
        retryReason: 'Rate limited, will retry after delay',
        suggestedDelayMs: 60000 // 1 minute
      };
    }
    
    // Check for resource exhaustion
    if (
      errorMessage.includes('memory') ||
      errorMessage.includes('cpu') ||
      errorMessage.includes('resource') ||
      errorMessage.includes('capacity') ||
      errorMessage.includes('disk space') ||
      errorStack.includes('heap')
    ) {
      return {
        type: FailureType.RESOURCE_EXHAUSTION,
        isPermanentFailure: false,
        retryReason: 'Resource exhaustion, will retry after delay',
        suggestedDelayMs: 30000 // 30 seconds
      };
    }
    
    // Check for authorization errors (permanent)
    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403')
    ) {
      return {
        type: FailureType.AUTHORIZATION,
        isPermanentFailure: true,
        nonRetryReason: 'Authorization failure, not retrying'
      };
    }
    
    // Check for invalid input (permanent)
    if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('bad request') ||
      errorMessage.includes('400')
    ) {
      return {
        type: FailureType.INVALID_INPUT,
        isPermanentFailure: true,
        nonRetryReason: 'Invalid input, not retrying'
      };
    }
    
    // Check for external service errors
    if (
      errorMessage.includes('service') ||
      errorMessage.includes('api') ||
      errorMessage.includes('remote') ||
      errorMessage.includes('external')
    ) {
      return {
        type: FailureType.EXTERNAL_SERVICE,
        isPermanentFailure: false,
        retryReason: 'External service error, will retry',
        suggestedDelayMs: 5000 // 5 seconds
      };
    }
    
    // Unknown error - assume it's retryable
    return {
      type: FailureType.UNKNOWN,
      isPermanentFailure: false,
      retryReason: 'Unknown error, will retry',
      suggestedDelayMs: 3000 // 3 seconds
    };
  } catch (analysisError) {
    logger.error('Error analyzing failure', { originalError: error, analysisError });
    
    // If analysis fails, assume it's a temporary error
    return {
      type: FailureType.UNKNOWN,
      isPermanentFailure: false,
      retryReason: 'Analysis error, assuming retryable',
      suggestedDelayMs: 3000 // 3 seconds
    };
  }
}
