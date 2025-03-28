'use client';

import React, { useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import errorTrackingService from '@/lib/monitoring/error-tracking';
import monitoringService from '@/lib/monitoring/monitor';

interface ErrorBoundaryProviderProps {
  children: React.ReactNode;
}

/**
 * A global error boundary provider that integrates with our monitoring systems
 * This should wrap the application at a high level
 */
const ErrorBoundaryProvider: React.FC<ErrorBoundaryProviderProps> = ({ children }) => {
  // Initialize monitoring and error tracking
  useEffect(() => {
    // Initialize error tracking with Sentry
    errorTrackingService.initializeSentry();
    
    // Record application load event
    monitoringService.recordEvent('application', 'load', window.location.pathname);
    
    // Clean up on unmount
    return () => {
      monitoringService.cleanup();
    };
  }, []);
  
  /**
   * Handle errors caught by the error boundary
   */
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Track error in our error tracking service
    errorTrackingService.captureError(error, {
      component: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      url: window.location.href,
      extraData: { componentStack: errorInfo.componentStack }
    });
    
    // Record error event
    monitoringService.recordEvent(
      'error', 
      'react-error-boundary', 
      error.name, 
      undefined, 
      { message: error.message }
    );
  };
  
  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryProvider;