/**
 * Error Types
 * 
 * Type definitions for error handling
 */
import { ErrorCode } from './error-codes';

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  data: null;
  meta: {
    timestamp: string;
    requestId?: string;
  };
  errors: Array<{
    code: ErrorCode;
    message: string;
    details?: any;
  }>;
}

/**
 * Error with extended information
 */
export interface ErrorWithCode extends Error {
  code?: ErrorCode;
  status?: number;
  data?: any;
  isOperational?: boolean;
  isNetworkError?: boolean;
  isOfflineError?: boolean;
  isTimeoutError?: boolean;
  isCancelled?: boolean;
  requestId?: string;
  path?: string;
  method?: string;
  recoverAction?: string;
}

/**
 * Error classification for analytics
 */
export enum ErrorSeverity {
  /**
   * Critical errors that require immediate attention
   */
  CRITICAL = 'critical',
  
  /**
   * Errors that indicate major functionality is impacted
   */
  ERROR = 'error',
  
  /**
   * Issues that cause degraded performance but not complete failure
   */
  WARNING = 'warning',
  
  /**
   * Minor issues or expected errors (e.g. validation errors)
   */
  INFO = 'info'
}

/**
 * Context information for error logging
 */
export interface ErrorContext {
  /**
   * Component or module where the error occurred
   */
  component?: string;
  
  /**
   * Route or page where the error occurred
   */
  route?: string;
  
  /**
   * User action that triggered the error
   */
  action?: string;
  
  /**
   * Additional data about the error
   */
  data?: Record<string, any>;
  
  /**
   * User information (without PII)
   */
  user?: {
    /**
     * User ID (can be anonymized)
     */
    id?: string;
    
    /**
     * User experience level
     */
    level?: number;
    
    /**
     * Is the user authenticated
     */
    isAuthenticated?: boolean;
  };
  
  /**
   * Device and environment information
   */
  environment?: {
    /**
     * Browser and version
     */
    browser?: string;
    
    /**
     * Device type (mobile, tablet, desktop)
     */
    deviceType?: string;
    
    /**
     * App version or build
     */
    appVersion?: string;
    
    /**
     * Connection type if available
     */
    connectionType?: string;
  };
}

/**
 * Global error event
 */
export interface ErrorEvent {
  /**
   * Unique error ID
   */
  id: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code
   */
  code: ErrorCode;
  
  /**
   * Error severity level
   */
  severity: ErrorSeverity;
  
  /**
   * Stack trace (redacted in production)
   */
  stack?: string;
  
  /**
   * HTTP status code if applicable
   */
  status?: number;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: number;
  
  /**
   * Context information about the error
   */
  context: ErrorContext;
  
  /**
   * Whether this is a duplicate error
   */
  isDuplicate?: boolean;
  
  /**
   * Count of duplicates of this error
   */
  duplicateCount?: number;
  
  /**
   * Whether this is a client-side error
   */
  isClientError: boolean;
  
  /**
   * Optional recovery action to recommend
   */
  recoveryAction?: string;
  
  /**
   * Whether this error can be recovered from
   */
  isRecoverable: boolean;
}