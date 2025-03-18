'use client';

import React from 'react';
import { ErrorWithCode } from '../../lib/errors';

interface ErrorFallbackProps {
  /** The error that occurred */
  error: ErrorWithCode;
  
  /** User-friendly error message */
  message?: string;
  
  /** Suggested recovery action */
  recoveryText?: string;
  
  /** Function to reset the error and retry */
  resetError: () => void;
  
  /** Whether to show small/compact version */
  compact?: boolean;
  
  /** Additional CSS class names */
  className?: string;
}

/**
 * Error Fallback Component
 * 
 * Displays a user-friendly error message with recovery options
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  message,
  recoveryText,
  resetError,
  compact = false,
  className = '',
}) => {
  const defaultMessage = 'Something went wrong';
  const displayMessage = message || defaultMessage;
  
  // Determine if the error is a connection issue
  const isConnectionIssue = 
    error.isNetworkError || 
    error.isOfflineError || 
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('connection');
  
  // Icon to display based on error type
  const getIcon = () => {
    if (isConnectionIssue) return '🌐';
    if (error.status === 404) return '🔍';
    if (error.status === 403 || error.status === 401) return '🔒';
    return '⚠️';
  };
  
  if (compact) {
    return (
      <div 
        className={`p-4 rounded-md bg-red-50 border border-red-200 text-red-800 ${className}`}
        role="alert"
      >
        <div className="flex items-center">
          <span className="mr-2 text-lg">{getIcon()}</span>
          <p className="text-sm font-medium">{displayMessage}</p>
        </div>
        {recoveryText && (
          <p className="mt-1 text-xs text-red-600">{recoveryText}</p>
        )}
        <button
          onClick={resetError}
          className="mt-2 text-xs font-medium text-red-700 hover:text-red-900 underline"
        >
          Try again
        </button>
      </div>
    );
  }
  
  return (
    <div 
      className={`w-full p-6 rounded-lg bg-white border border-red-200 shadow-sm ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{getIcon()}</span>
        <h2 className="text-lg font-semibold text-gray-900">{displayMessage}</h2>
      </div>
      
      {recoveryText && (
        <p className="mb-4 text-sm text-gray-600">{recoveryText}</p>
      )}
      
      {/* Error details - only in development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs font-mono overflow-x-auto">
          <p className="text-gray-500">{error.name}: {error.message}</p>
          {error.code && <p className="text-gray-500 mt-1">Code: {error.code}</p>}
          {error.status && <p className="text-gray-500 mt-1">Status: {error.status}</p>}
          {error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-gray-500">Stack trace</summary>
              <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
            </details>
          )}
        </div>
      )}
      
      <div className="mt-4 flex space-x-3">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Go to home page
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback;
