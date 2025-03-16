/**
 * Error serialization utilities
 * 
 * These functions standardize how errors are formatted for API responses.
 */
import { AppError } from './base-error';

/**
 * Standard error response interface
 * This matches the format defined in the Backend Implementation Guide
 */
export interface ErrorResponse {
  data: null;
  meta: {
    timestamp: string;
    requestId: string;
  };
  errors: Array<{
    code: string;
    message: string;
    details?: any;
  }>;
}

/**
 * Serialize an AppError to the standard error response format
 * 
 * @param error The AppError to serialize
 * @param requestId The unique identifier for the request
 * @returns A standardized error response object
 */
export function serializeError(error: AppError, requestId: string): ErrorResponse {
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId
    },
    errors: [
      {
        code: error.code,
        message: error.message,
        details: error.details
      }
    ]
  };
}

/**
 * Create a standardized error response for multiple errors
 * 
 * @param errors Array of AppErrors to include
 * @param requestId The unique identifier for the request
 * @returns A standardized error response object
 */
export function serializeMultipleErrors(errors: AppError[], requestId: string): ErrorResponse {
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId
    },
    errors: errors.map(error => ({
      code: error.code,
      message: error.message,
      details: error.details
    }))
  };
}

/**
 * Comprehensive error code enum - shared with frontend
 * This provides a centralized list of all possible error codes
 */
export enum ErrorCode {
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  CONFLICT = 'CONFLICT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Points-specific errors
  POINTS_LIMIT_EXCEEDED = 'POINTS_LIMIT_EXCEEDED',
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  POINTS_TRANSFER_FAILED = 'POINTS_TRANSFER_FAILED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  REDEMPTION_FAILED = 'REDEMPTION_FAILED',
  
  // Wallet-specific errors
  WALLET_CONNECTION_ERROR = 'WALLET_CONNECTION_ERROR',
  WALLET_VERIFICATION_FAILED = 'WALLET_VERIFICATION_FAILED',
  WALLET_ALREADY_CONNECTED = 'WALLET_ALREADY_CONNECTED',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // Content-specific errors
  CONTENT_CREATION_FAILED = 'CONTENT_CREATION_FAILED',
  CONTENT_MODERATION_REQUIRED = 'CONTENT_MODERATION_REQUIRED',
  CONTENT_TYPE_UNSUPPORTED = 'CONTENT_TYPE_UNSUPPORTED',
  
  // User-specific errors
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  ACHIEVEMENT_CRITERIA_UNMET = 'ACHIEVEMENT_CRITERIA_UNMET'
}
