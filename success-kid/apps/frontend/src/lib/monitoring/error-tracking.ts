'use client';

import * as Sentry from '@sentry/nextjs';
import { AppError } from '@/lib/api/api-client';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/**
 * Error context additional information
 */
export interface ErrorContext {
  userId?: string;
  url?: string;
  component?: string;
  tags?: Record<string, string>;
  extraData?: Record<string, any>;
}

/**
 * Frontend error tracking service
 * Handles client-side error tracking, reporting, and analysis
 */
class ErrorTrackingService {
  private static MAX_ERRORS = 50; // Maximum number of errors to store in memory
  
  private isInitialized = false;
  private recentErrors: Error[] = [];
  private onErrorListeners: Array<(error: Error, context?: ErrorContext) => void> = [];
  private sentryEnabled: boolean;
  
  constructor() {
    this.sentryEnabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true';
    
    // Initialize error tracking in browser environment
    if (typeof window !== 'undefined') {
      this.initializeErrorListeners();
    }
  }
  
  /**
   * Initialize global error listeners
   */
  private initializeErrorListeners(): void {
    if (this.isInitialized) return;
    
    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        url: event.filename,
        tags: { type: 'window.onerror' }
      });
    });
    
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.captureError(error, {
        tags: { type: 'unhandledrejection' }
      });
    });
    
    this.isInitialized = true;
  }
  
  /**
   * Initialize Sentry
   * Should be called from _app.js or similar
   */
  initializeSentry(): void {
    if (!this.sentryEnabled) return;
    
    // Sentry is expected to be initialized in _app.js
    // This is just to register our error listener
    this.registerOnErrorListener((error, context) => {
      if (!this.sentryEnabled) return;
      
      const scope = new Sentry.Scope();
      
      // Add context to Sentry scope
      if (context) {
        if (context.userId) scope.setUser({ id: context.userId });
        if (context.component) scope.setTag('component', context.component);
        if (context.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        if (context.extraData) {
          Object.entries(context.extraData).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        
        // Set severity based on tags or error type
        let severity: ErrorSeverity = 'error';
        if (context.tags?.severity) {
          severity = context.tags.severity as ErrorSeverity;
        } else if (error instanceof AppError && error.code) {
          // Set severity based on error code
          if (error.code.includes('FATAL')) severity = 'fatal';
          else if (error.code.includes('WARNING')) severity = 'warning';
          else if (error.code.includes('INFO')) severity = 'info';
        }
        
        scope.setLevel(severity as Sentry.SeverityLevel);
      }
      
      Sentry.captureException(error, scope);
    });
  }
  
  /**
   * Capture and track an error
   * 
   * @param error Error object
   * @param context Additional context about the error
   */
  captureError(error: Error, context?: ErrorContext): void {
    try {
      // Store in recent errors (with rotation if needed)
      if (this.recentErrors.length >= ErrorTrackingService.MAX_ERRORS) {
        this.recentErrors.shift(); // Remove oldest error
      }
      this.recentErrors.push(error);
      
      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error captured by ErrorTrackingService:', error, context);
      }
      
      // Notify listeners
      this.notifyListeners(error, context);
    } catch (e) {
      // Failsafe - if error tracking itself fails, at least log to console
      console.error('Error in ErrorTrackingService:', e);
      console.error('Original error:', error);
    }
  }
  
  /**
   * Register a listener for captured errors
   * 
   * @param listener Function to call when an error is captured
   * @returns Function to unregister the listener
   */
  registerOnErrorListener(
    listener: (error: Error, context?: ErrorContext) => void
  ): () => void {
    this.onErrorListeners.push(listener);
    
    // Return unregister function
    return () => {
      const index = this.onErrorListeners.indexOf(listener);
      if (index !== -1) {
        this.onErrorListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all listeners about an error
   * 
   * @param error Error object
   * @param context Error context
   */
  private notifyListeners(error: Error, context?: ErrorContext): void {
    for (const listener of this.onErrorListeners) {
      try {
        listener(error, context);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    }
  }
  
  /**
   * Get recent errors captured by the service
   * 
   * @param limit Maximum number of errors to return
   * @returns Array of recent errors
   */
  getRecentErrors(limit: number = ErrorTrackingService.MAX_ERRORS): Error[] {
    return this.recentErrors.slice(-limit);
  }
  
  /**
   * Clear recent errors
   */
  clearRecentErrors(): void {
    this.recentErrors = [];
  }
}

// Export singleton instance
export const errorTrackingService = new ErrorTrackingService();

export default errorTrackingService;