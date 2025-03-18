'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundary } from '../../lib/errors';
import { usePathname } from 'next/navigation';
import { logError } from '../../lib/monitoring/error-logging';

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

/**
 * Global Error Boundary Provider
 * 
 * Wraps the application in an error boundary to catch unhandled errors
 */
const ErrorBoundaryProvider: React.FC<ErrorBoundaryProviderProps> = ({ children }) => {
  const pathname = usePathname();
  
  /**
   * Handle errors caught by the error boundary
   */
  const handleError = (error: any, errorInfo: React.ErrorInfo) => {
    // Log the error to our monitoring system
    logError(error, {
      component: 'global',
      route: pathname,
      action: 'render',
      data: {
        componentStack: errorInfo.componentStack
      }
    });
  };
  
  return (
    <ErrorBoundary
      componentName="global"
      onError={handleError}
      contextData={{ route: pathname }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryProvider;
