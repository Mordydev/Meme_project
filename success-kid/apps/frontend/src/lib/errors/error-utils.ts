/**
 * Error Utilities
 * 
 * Helper functions for error handling, formatting, and processing
 */
import { v4 as uuidv4 } from 'uuid';
import { ErrorCode, ErrorMessages, ErrorActions, ErrorRecoverable } from './error-codes';
import { ErrorWithCode, ApiErrorResponse, ErrorEvent, ErrorSeverity, ErrorContext } from './error-types';

/**
 * Parse API error response
 * @param response API error response object
 * @returns Processed error with code and details
 */
export function parseApiError(response: ApiErrorResponse): ErrorWithCode {
  const firstError = response.errors?.[0];
  if (!firstError) {
    return createError('Unknown API error', ErrorCode.SERVER_ERROR);
  }
  
  const error = createError(
    firstError.message || ErrorMessages[firstError.code as ErrorCode] || 'API Error',
    firstError.code as ErrorCode
  );
  
  error.data = firstError.details;
  error.requestId = response.meta?.requestId;
  
  return error;
}

/**
 * Create an error with code and additional information
 * @param message Error message
 * @param code Error code
 * @param status HTTP status code
 * @returns Error with additional properties
 */
export function createError(
  message: string,
  code: ErrorCode = ErrorCode.CLIENT_ERROR,
  status?: number
): ErrorWithCode {
  const error = new Error(message) as ErrorWithCode;
  error.code = code;
  error.status = status;
  error.isOperational = true;
  error.recoverAction = ErrorActions[code];
  return error;
}

/**
 * Create a network error
 * @param message Error message
 * @param isTimeout Whether it's a timeout error
 * @param isOffline Whether the user is offline
 * @returns Network error
 */
export function createNetworkError(
  message: string = 'Network request failed',
  isTimeout: boolean = false,
  isOffline: boolean = false
): ErrorWithCode {
  const code = isOffline 
    ? ErrorCode.OFFLINE_ERROR 
    : isTimeout 
      ? ErrorCode.TIMEOUT_ERROR 
      : ErrorCode.NETWORK_ERROR;
      
  const error = createError(message, code);
  error.isNetworkError = true;
  error.isTimeoutError = isTimeout;
  error.isOfflineError = isOffline;
  
  return error;
}

/**
 * Normalize error to have consistent structure
 * @param error Error or error-like object
 * @returns Normalized error with code
 */
export function normalizeError(error: any): ErrorWithCode {
  // Already a normalized error
  if (error && error.code && Object.values(ErrorCode).includes(error.code)) {
    return error as ErrorWithCode;
  }
  
  // Error from API
  if (error && error.errors && Array.isArray(error.errors)) {
    return parseApiError(error as ApiErrorResponse);
  }
  
  // Standard Error object
  if (error instanceof Error) {
    const normalizedError = error as ErrorWithCode;
    normalizedError.code = normalizedError.code || ErrorCode.CLIENT_ERROR;
    return normalizedError;
  }
  
  // String error
  if (typeof error === 'string') {
    return createError(error);
  }
  
  // Unknown error
  return createError(
    typeof error === 'object' 
      ? JSON.stringify(error) 
      : 'An unknown error occurred',
    ErrorCode.CLIENT_ERROR
  );
}

/**
 * Get recommended recovery action for an error
 * @param error Error to get recovery action for
 * @returns Recovery action message or undefined
 */
export function getRecoveryAction(error: ErrorWithCode): string | undefined {
  if (error.recoverAction) {
    return error.recoverAction;
  }
  
  if (error.code && ErrorActions[error.code]) {
    return ErrorActions[error.code];
  }
  
  if (error.isNetworkError) {
    return 'Check your internet connection and try again';
  }
  
  if (error.isTimeoutError) {
    return 'The request took too long. Please try again later';
  }
  
  return undefined;
}

/**
 * Check if error is recoverable
 * @param error Error to check
 * @returns Whether the error is recoverable
 */
export function isErrorRecoverable(error: ErrorWithCode): boolean {
  if (error.code && error.code in ErrorRecoverable) {
    return ErrorRecoverable[error.code];
  }
  
  // Consider network errors recoverable by default
  if (error.isNetworkError) {
    return true;
  }
  
  // Consider client errors recoverable and server errors non-recoverable by default
  return !error.status || error.status < 500;
}

/**
 * Determine error severity level for logging and monitoring
 * @param error Error to classify
 * @returns Error severity level
 */
export function getErrorSeverity(error: ErrorWithCode): ErrorSeverity {
  // Critical errors
  if (
    error.code === ErrorCode.SERVER_ERROR ||
    error.code === ErrorCode.SERVICE_UNAVAILABLE ||
    error.code === ErrorCode.BLOCKCHAIN_ERROR ||
    error.status === 500 ||
    error.status === 503
  ) {
    return ErrorSeverity.CRITICAL;
  }
  
  // General errors
  if (
    error.code === ErrorCode.NETWORK_ERROR ||
    error.code === ErrorCode.TRANSACTION_FAILED ||
    error.code === ErrorCode.POINTS_TRANSFER_FAILED ||
    error.code === ErrorCode.REDEMPTION_FAILED ||
    error.code === ErrorCode.WALLET_CONNECTION_ERROR ||
    (error.status && error.status >= 400 && error.status !== 404 && error.status !== 422)
  ) {
    return ErrorSeverity.ERROR;
  }
  
  // Warnings
  if (
    error.code === ErrorCode.TIMEOUT_ERROR ||
    error.code === ErrorCode.CONTENT_CREATION_FAILED ||
    error.code === ErrorCode.PROFILE_UPDATE_FAILED ||
    error.code === ErrorCode.WEBSOCKET_ERROR
  ) {
    return ErrorSeverity.WARNING;
  }
  
  // Info (expected errors)
  return ErrorSeverity.INFO;
}

/**
 * Create error event for logging/tracking
 * @param error Error that occurred
 * @param context Additional context information
 * @returns Formatted error event
 */
export function createErrorEvent(
  error: ErrorWithCode,
  context: Partial<ErrorContext> = {}
): ErrorEvent {
  const normalizedError = normalizeError(error);
  const severity = getErrorSeverity(normalizedError);
  
  return {
    id: uuidv4(),
    message: normalizedError.message,
    code: normalizedError.code || ErrorCode.CLIENT_ERROR,
    severity,
    stack: process.env.NODE_ENV !== 'production' ? normalizedError.stack : undefined,
    status: normalizedError.status,
    timestamp: Date.now(),
    context: {
      ...context,
      data: {
        ...(context.data || {}),
        requestId: normalizedError.requestId,
        path: normalizedError.path,
        method: normalizedError.method
      }
    },
    isClientError: true,
    recoveryAction: getRecoveryAction(normalizedError),
    isRecoverable: isErrorRecoverable(normalizedError)
  };
}

/**
 * Extract error message in user-friendly format
 * @param error Error object
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const normalizedError = normalizeError(error);
  
  // Use message if it's not a generic one
  if (
    normalizedError.message && 
    normalizedError.message !== 'Error' && 
    !normalizedError.message.includes('Internal Server Error')
  ) {
    return normalizedError.message;
  }
  
  // Use code-based message as fallback
  if (normalizedError.code && ErrorMessages[normalizedError.code]) {
    return ErrorMessages[normalizedError.code];
  }
  
  // Generic message based on status code
  if (normalizedError.status) {
    if (normalizedError.status === 404) {
      return 'The requested resource could not be found';
    }
    if (normalizedError.status === 401) {
      return 'Authentication is required to access this resource';
    }
    if (normalizedError.status === 403) {
      return 'You do not have permission to access this resource';
    }
    if (normalizedError.status === 429) {
      return 'Too many requests, please try again later';
    }
    if (normalizedError.status >= 500) {
      return 'Something went wrong on our end, please try again later';
    }
  }
  
  // Network error handling
  if (normalizedError.isOfflineError) {
    return 'You appear to be offline. Please check your internet connection';
  }
  if (normalizedError.isTimeoutError) {
    return 'The request timed out. Please try again later';
  }
  if (normalizedError.isNetworkError) {
    return 'A network error occurred. Please check your connection and try again';
  }
  
  // Default message
  return 'An unexpected error occurred';
}

/**
 * Group similar errors to prevent duplication
 * @param error Error to check
 * @param recentErrors Recent errors to compare against
 * @returns Whether the error is a duplicate of a recent error
 */
export function isDuplicateError(
  error: ErrorWithCode,
  recentErrors: ErrorWithCode[]
): boolean {
  if (!recentErrors.length) {
    return false;
  }
  
  // Check for identical errors
  return recentErrors.some(recentError => 
    recentError.code === error.code &&
    recentError.message === error.message &&
    recentError.status === error.status &&
    // Only consider duplicates if they occurred within the last minute
    recentError.timestamp && 
    (Date.now() - recentError.timestamp) < 60000
  );
}

/**
 * Enrich error with additional context
 * @param error Error to enrich
 * @param context Additional context to add
 * @returns Enriched error
 */
export function enrichError(
  error: ErrorWithCode,
  context: Partial<{
    path: string;
    method: string;
    requestId: string;
    data: any;
    timestamp: number;
  }>
): ErrorWithCode {
  return {
    ...error,
    path: context.path || error.path,
    method: context.method || error.method,
    requestId: context.requestId || error.requestId,
    data: context.data || error.data,
    timestamp: context.timestamp || error.timestamp || Date.now()
  };
}