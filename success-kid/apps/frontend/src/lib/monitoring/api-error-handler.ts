'use client';

import { AxiosError } from 'axios';
import { ErrorCode } from '../errors/error-codes';
import { ErrorWithCode, ApiErrorResponse } from '../errors/error-types';
import { createError, createNetworkError, parseApiError } from '../errors/error-utils';
import { logError } from './error-logging';

/**
 * Handle API errors consistently
 * @param error Error from API call
 * @param context Additional context for error logging
 * @returns Standardized error object
 */
export function handleApiError(error: unknown, context: Record<string, any> = {}): ErrorWithCode {
  // Error is already standardized
  if ((error as ErrorWithCode).code && (error as ErrorWithCode).isOperational) {
    logError(error, {
      component: context.component || 'api',
      action: context.action || 'request',
      data: context
    });
    return error as ErrorWithCode;
  }
  
  // Check if it's an Axios error
  if (isAxiosError(error)) {
    return handleAxiosError(error, context);
  }
  
  // Check if it's a fetch AbortError
  if (error instanceof DOMException && error.name === 'AbortError') {
    const abortError = createError(
      'Request was cancelled',
      ErrorCode.CLIENT_ERROR
    );
    abortError.isCancelled = true;
    
    logError(abortError, {
      component: context.component || 'api',
      action: context.action || 'request',
      data: {
        ...context,
        cancelled: true
      }
    });
    
    return abortError;
  }
  
  // Handle fetch error
  if (error instanceof Error) {
    const fetchError = error.message.toLowerCase().includes('network') || 
                       error.message.toLowerCase().includes('fetch')
      ? createNetworkError(error.message)
      : createError(error.message, ErrorCode.CLIENT_ERROR);
    
    logError(fetchError, {
      component: context.component || 'api',
      action: context.action || 'request',
      data: context
    });
    
    return fetchError;
  }
  
  // Unknown error
  const unknownError = createError(
    typeof error === 'string' 
      ? error 
      : 'An unexpected error occurred',
    ErrorCode.CLIENT_ERROR
  );
  
  logError(unknownError, {
    component: context.component || 'api',
    action: context.action || 'request',
    data: {
      ...context,
      originalError: error
    }
  });
  
  return unknownError;
}

/**
 * Handle Axios specific errors
 * @param error Axios error
 * @param context Additional context
 * @returns Standardized error
 */
function handleAxiosError(error: AxiosError, context: Record<string, any>): ErrorWithCode {
  // Network error
  if (error.code === 'ECONNABORTED') {
    const timeoutError = createNetworkError(
      'Request timed out. Please try again.',
      true,
      false
    );
    
    logError(timeoutError, {
      component: context.component || 'api',
      action: context.action || 'request',
      data: {
        ...context,
        timeout: true,
        url: error.config?.url
      }
    });
    
    return timeoutError;
  }
  
  // No response (network error)
  if (!error.response) {
    const networkError = createNetworkError(
      'Network error. Please check your connection.',
      false,
      navigator.onLine === false
    );
    
    logError(networkError, {
      component: context.component || 'api',
      action: context.action || 'request',
      data: {
        ...context,
        url: error.config?.url,
        method: error.config?.method,
        isOnline: navigator.onLine
      }
    });
    
    return networkError;
  }
  
  // API error response
  if (error.response.data) {
    // Parse the error if it matches our API format
    try {
      if (
        error.response.data.errors && 
        Array.isArray(error.response.data.errors)
      ) {
        const apiError = parseApiError(error.response.data as ApiErrorResponse);
        apiError.status = error.response.status;
        apiError.path = error.config?.url;
        apiError.method = error.config?.method?.toUpperCase();
        
        logError(apiError, {
          component: context.component || 'api',
          action: context.action || 'request',
          data: {
            ...context,
            status: error.response.status,
            url: error.config?.url,
            method: error.config?.method
          }
        });
        
        return apiError;
      }
    } catch (parseError) {
      // Failed to parse API error, continue to generic error handling
    }
  }
  
  // Generic HTTP error
  const statusError = createError(
    error.response.data?.message || getErrorMessageForStatus(error.response.status),
    mapStatusToErrorCode(error.response.status),
    error.response.status
  );
  
  statusError.path = error.config?.url;
  statusError.method = error.config?.method?.toUpperCase();
  
  logError(statusError, {
    component: context.component || 'api',
    action: context.action || 'request',
    data: {
      ...context,
      status: error.response.status,
      url: error.config?.url,
      method: error.config?.method
    }
  });
  
  return statusError;
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: any): error is AxiosError {
  return error && error.isAxiosError === true;
}

/**
 * Map HTTP status to error code
 */
function mapStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCode.SERVER_ERROR;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return status >= 500 
        ? ErrorCode.SERVER_ERROR 
        : ErrorCode.CLIENT_ERROR;
  }
}

/**
 * Get user-friendly message for HTTP status
 */
function getErrorMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'The request was invalid. Please check your input.';
    case 401:
      return 'Authentication is required to access this resource.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource could not be found.';
    case 409:
      return 'This request conflicts with the current state of the resource.';
    case 422:
      return 'The request could not be processed due to validation errors.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Something went wrong on our end. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return status >= 500
        ? 'A server error occurred. Please try again later.'
        : 'An error occurred with your request.';
  }
}