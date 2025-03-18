'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorCode } from './error-codes';
import { ErrorWithCode } from './error-types';
import { createError, getUserFriendlyMessage, getRecoveryAction } from './error-utils';
import { logError } from '../monitoring/error-logging';
import ErrorFallback from '../../components/ui/error-fallback';

interface ErrorBoundaryProps {
  /** The component tree to render and monitor for errors */
  children: ReactNode;
  
  /** Component name for better error reporting */
  componentName?: string;
  
  /** Custom fallback component to render when an error occurs */
  fallback?: React.ComponentType<{ 
    error: ErrorWithCode; 
    resetError: () => void;
  }>;
  
  /** Whether to capture errors but not display fallback (for non-critical components) */
  silentCapture?: boolean;
  
  /** Additional context data for error reporting */
  contextData?: Record<string, any>;
  
  /** Called when an error occurs */
  onError?: (error: ErrorWithCode, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  
  /** The error that occurred */
  error: ErrorWithCode | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in its child component tree, logs them,
 * and displays a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert raw error to our error type if needed
    const typedError: ErrorWithCode = (error as ErrorWithCode).code 
      ? (error as ErrorWithCode) 
      : createError(
          error.message || 'An unexpected error occurred',
          ErrorCode.CLIENT_ERROR
        );
    
    return {
      hasError: true,
      error: typedError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Enrich the error with component info
    const enrichedError = {
      ...(error as ErrorWithCode),
      componentName: this.props.componentName,
      componentStack: errorInfo.componentStack,
      contextData: this.props.contextData
    };
    
    // Log the error to our monitoring system
    logError(enrichedError, {
      component: this.props.componentName,
      action: 'render',
      data: {
        ...this.props.contextData,
        componentStack: errorInfo.componentStack
      }
    });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(enrichedError as ErrorWithCode, errorInfo);
    }
  }

  /**
   * Reset the error state to re-render the children
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    const { children, fallback: CustomFallback, silentCapture } = this.props;
    const { hasError, error } = this.state;

    if (hasError && error) {
      // If silent capture is enabled, continue rendering children
      // despite the error (useful for non-critical UI elements)
      if (silentCapture) {
        return children;
      }
      
      // Use custom fallback if provided, otherwise use default
      if (CustomFallback) {
        return <CustomFallback error={error} resetError={this.resetError} />;
      }
      
      // Default error UI
      return (
        <ErrorFallback
          error={error}
          message={getUserFriendlyMessage(error)}
          recoveryText={getRecoveryAction(error)}
          resetError={this.resetError}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
