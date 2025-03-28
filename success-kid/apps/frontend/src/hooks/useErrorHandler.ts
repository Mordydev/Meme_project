'use client';

import { useState, useCallback } from 'react';
import { AppError } from '@/lib/api/api-client';
import * as Sentry from '@sentry/nextjs';

interface ErrorState {
  error: Error | null;
  code?: string;
  status?: number;
  details?: any;
  timestamp: number;
}

interface ErrorHandlerOptions {
  captureInSentry?: boolean;
  rethrow?: boolean;
  logToConsole?: boolean;
}

/**
 * Hook for handling errors consistently across the application
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    captureInSentry = process.env.NODE_ENV === 'production',
    rethrow = false,
    logToConsole = process.env.NODE_ENV !== 'production',
  } = options;
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    timestamp: 0,
  });
  
  /**
   * Handle an error
   */
  const handleError = useCallback((error: unknown) => {
    if (logToConsole) {
      console.error('Error caught by useErrorHandler:', error);
    }
    
    // Capture in Sentry if enabled
    if (captureInSentry) {
      Sentry.captureException(error);
    }
    
    // Create error state
    if (error instanceof AppError) {
      setErrorState({
        error,
        code: error.code,
        status: error.status,
        details: error.details,
        timestamp: Date.now(),
      });
    } else if (error instanceof Error) {
      setErrorState({
        error,
        timestamp: Date.now(),
      });
    } else {
      // Handle non-Error objects
      const genericError = new Error(String(error));
      setErrorState({
        error: genericError,
        timestamp: Date.now(),
      });
    }
    
    // Rethrow if requested
    if (rethrow) {
      throw error;
    }
  }, [captureInSentry, logToConsole, rethrow]);
  
  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      timestamp: 0,
    });
  }, []);
  
  /**
   * Wrap an async function with error handling
   */
  const withErrorHandler = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error);
        throw error; // Rethrow to allow caller to handle as well
      }
    };
  }, [handleError]);
  
  return {
    error: errorState.error,
    errorCode: errorState.code,
    errorStatus: errorState.status,
    errorDetails: errorState.details,
    errorTimestamp: errorState.timestamp,
    hasError: !!errorState.error,
    handleError,
    clearError,
    withErrorHandler,
  };
}

export default useErrorHandler;