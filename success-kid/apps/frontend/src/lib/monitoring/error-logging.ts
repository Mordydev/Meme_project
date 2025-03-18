'use client';

import { ErrorWithCode, ErrorContext, ErrorEvent, createErrorEvent } from '../errors';

// Maximum number of errors to store locally
const MAX_STORED_ERRORS = 50;

// Store recent errors to prevent duplicates
let recentErrors: ErrorEvent[] = [];

// Flag to indicate if backend is available
let isBackendAvailable = true;

// Flag to indicate if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log an error to monitoring system
 * @param error Error to log
 * @param context Additional context information
 */
export function logError(error: any, context: Partial<ErrorContext> = {}): void {
  try {
    // Create error event
    const errorEvent = createErrorEvent(error, context);
    
    // Check for duplicate errors to prevent spam
    const isDuplicate = recentErrors.some(e => 
      e.code === errorEvent.code && 
      e.message === errorEvent.message &&
      Date.now() - e.timestamp < 60000 // Within last minute
    );
    
    // Update duplicate count if it's a duplicate
    if (isDuplicate) {
      errorEvent.isDuplicate = true;
      const duplicateError = recentErrors.find(e => 
        e.code === errorEvent.code && 
        e.message === errorEvent.message
      );
      
      if (duplicateError) {
        duplicateError.duplicateCount = (duplicateError.duplicateCount || 1) + 1;
      }
    } else {
      // Add to recent errors if not a duplicate
      recentErrors.unshift(errorEvent);
      
      // Limit array size
      if (recentErrors.length > MAX_STORED_ERRORS) {
        recentErrors = recentErrors.slice(0, MAX_STORED_ERRORS);
      }
    }
    
    // Skip duplicate errors to prevent spam
    if (isDuplicate && !isDevelopment) {
      return;
    }

    // Always log to console in development mode
    if (isDevelopment) {
      console.error('[Error]', errorEvent);
    }
    
    // Send to backend error logging service
    if (isBackendAvailable) {
      sendErrorToBackend(errorEvent);
    }
    
    // If configured, send to external error tracking service
    sendErrorToExternalService(errorEvent);
    
  } catch (loggingError) {
    // If error logging itself fails, log to console as a fallback
    console.error('[Error Logging Failed]', loggingError);
  }
}

/**
 * Send error to backend logging service
 * @param errorEvent Error event to send
 */
async function sendErrorToBackend(errorEvent: ErrorEvent): Promise<void> {
  try {
    // Don't send in development unless explicitly enabled
    if (isDevelopment && !process.env.NEXT_PUBLIC_LOG_ERRORS_IN_DEV) {
      return;
    }
    
    const response = await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorEvent),
      // Use keepalive to ensure delivery even if the page is closing
      keepalive: true,
    });
    
    if (!response.ok) {
      console.warn('[Error Logging] Failed to send error to backend:', await response.text());
      isBackendAvailable = false;
      
      // Retry after 5 minutes
      setTimeout(() => {
        isBackendAvailable = true;
      }, 5 * 60 * 1000);
    }
  } catch (error) {
    console.warn('[Error Logging] Failed to send error to backend:', error);
    isBackendAvailable = false;
    
    // Retry after 5 minutes
    setTimeout(() => {
      isBackendAvailable = true;
    }, 5 * 60 * 1000);
  }
}

/**
 * Send error to external error tracking service (if configured)
 * @param errorEvent Error event to send
 */
function sendErrorToExternalService(errorEvent: ErrorEvent): void {
  // Check if external error tracking is configured
  if (typeof window !== 'undefined' && 
      window.errorTrackingService &&
      typeof window.errorTrackingService.captureError === 'function') {
    
    try {
      window.errorTrackingService.captureError(errorEvent);
    } catch (error) {
      console.warn('[Error Logging] Failed to send to external service:', error);
    }
  }
}

/**
 * Get recent logged errors
 * @returns Array of recent error events
 */
export function getRecentErrors(): ErrorEvent[] {
  return [...recentErrors];
}

/**
 * Clear recent errors (useful for testing)
 */
export function clearRecentErrors(): void {
  recentErrors = [];
}

// Global error handler for unhandled exceptions
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      component: 'window',
      action: 'unhandled',
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || new Error('Unhandled Promise rejection'), {
      component: 'promise',
      action: 'unhandled',
    });
  });
}