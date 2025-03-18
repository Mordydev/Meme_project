'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AppError } from '@/lib/api/api-client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const isProd = process.env.NODE_ENV === 'production';

/**
 * Error message mapping for user-friendly messages
 */
const errorMessages: Record<string, string> = {
  // API errors
  'unauthorized': 'You need to sign in to access this feature',
  'forbidden': 'You don\'t have permission to access this feature',
  'not_found': 'The requested resource could not be found',
  'rate_limited': 'Too many requests. Please try again later',
  'invalid_input': 'Please check your input and try again',
  'wallet_connection_error': 'There was a problem connecting to your wallet',
  'network_error': 'Network connection issue. Please check your internet connection',
  'service_unavailable': 'Service temporarily unavailable. Please try again later',
  
  // Generic JavaScript errors
  'TypeError': 'There was a problem with the data format',
  'SyntaxError': 'There was a syntax error in the application',
  'ReferenceError': 'The application tried to reference something that doesn\'t exist',
  'RangeError': 'A value is outside the acceptable range',
  'Error': 'An unexpected error occurred'
};

/**
 * Get a user-friendly error message based on the error
 */
function getFriendlyErrorMessage(error: Error): string {
  if (error instanceof AppError) {
    // Check if we have a specific message for this error code
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }
    
    // Return the error message from the API
    return error.message;
  }
  
  // Check if we have a message for this error type
  if (error.name && errorMessages[error.name]) {
    return errorMessages[error.name];
  }
  
  // In development, show the actual error
  if (!isProd) {
    return error.message;
  }
  
  // In production, show a generic message
  return 'Something went wrong. Please try again.';
}

/**
 * A component that catches JavaScript errors anywhere in its child component tree
 * and displays a fallback UI instead of crashing the whole application.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Update state with error details
    this.setState({
      errorInfo
    });
    
    // Log the error to Sentry
    if (isProd) {
      Sentry.captureException(error);
    }
  }
  
  /**
   * Reset the error state to render the children again
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Use default fallback UI
      return (
        <div className="p-6 max-w-md mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error ? getFriendlyErrorMessage(this.state.error) : 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={this.handleReset}>
              Try again
            </Button>
            
            <Button variant="default" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
          
          {/* Show error details in development */}
          {!isProd && this.state.error && (
            <div className="mt-8 p-4 bg-gray-100 rounded overflow-auto text-sm">
              <p className="font-mono mb-2">{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

/**
 * A higher-order component to wrap components with an ErrorBoundary
 */
export function withErrorBoundary<P>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  // Set display name for better debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}

export default ErrorBoundary;