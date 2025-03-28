/**
 * Error serializers for converting application errors to API response format
 */
import { ApiError, ApiResponse, ErrorCode } from '@success-kid/api-types';
import { AppError } from './base-error';

/**
 * Serialize an AppError into a standardized API response format
 * 
 * @param error The application error to serialize
 * @param requestId The request ID for tracking
 * @returns Standardized API error response
 */
export function serializeError(error: AppError, requestId?: string): ApiResponse {
  const apiError: ApiError = {
    code: error.code,
    message: error.message,
    details: error.details
  };
  
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || 'unknown'
    },
    errors: [apiError]
  };
}

/**
 * Serialize a validation error from Fastify/JSON Schema
 * 
 * @param validationErrors The validation errors from Fastify
 * @param requestId The request ID for tracking
 * @returns Standardized API error response
 */
export function serializeValidationError(validationErrors: any[], requestId?: string): ApiResponse {
  // Transform validation errors into a more user-friendly format
  const details = validationErrors.map(err => {
    // Extract field name from JSON path (remove leading '/')
    const field = err.dataPath?.substring(1) || err.params?.missingProperty || 'input';
    
    return {
      field,
      message: err.message,
      params: err.params
    };
  });
  
  const apiError: ApiError = {
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    details
  };
  
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || 'unknown'
    },
    errors: [apiError]
  };
}

/**
 * Serialize an unknown error into a standardized API response format
 * 
 * @param error The unknown error to serialize
 * @param requestId The request ID for tracking
 * @returns Standardized API error response
 */
export function serializeUnknownError(error: any, requestId?: string): ApiResponse {
  // In production, don't expose internal error details
  const isProd = process.env.NODE_ENV === 'production';
  
  const apiError: ApiError = {
    code: ErrorCode.SERVER_ERROR,
    message: isProd ? 'An unexpected error occurred' : error.message || 'Unknown error',
    details: isProd ? undefined : {
      name: error.name,
      stack: error.stack,
      // Include any other properties that might be useful for debugging
      ...Object.fromEntries(
        Object.entries(error)
          .filter(([key]) => !['name', 'message', 'stack'].includes(key))
      )
    }
  };
  
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || 'unknown'
    },
    errors: [apiError]
  };
}
