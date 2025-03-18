/**
 * Error Tracking System
 * 
 * Centralized error collection, categorization, and analysis service.
 */
import { FastifyInstance, FastifyRequest } from 'fastify';
import { monitoringService } from '../service';
import { logger } from '@/lib/logger';
import { AppError, ErrorCategory, ErrorCode } from '@/errors/handlers';

/**
 * Error context to provide additional information about errors
 */
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  component?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Error event representing an error occurrence with context
 */
export interface ErrorEvent {
  id: string;
  error: Error | AppError;
  context: ErrorContext;
  timestamp: Date;
  isHandled: boolean;
  category: ErrorCategory;
  code: ErrorCode | string;
  message: string;
  stack?: string;
}

/**
 * Error aggregation for identifying patterns
 */
interface ErrorAggregation {
  signature: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  examples: ErrorEvent[];
  isResolved: boolean;
}

/**
 * Error tracking service for centralized error management
 */
export class ErrorTrackingService {
  private static MAX_STORED_ERRORS = 1000; // Maximum number of individual errors to store
  private static MAX_EXAMPLES_PER_SIGNATURE = 10; // Maximum examples to store per error signature
  
  private errors: ErrorEvent[] = [];
  private errorsBySignature: Map<string, ErrorAggregation> = new Map();
  private subscribers: Array<(event: ErrorEvent) => Promise<void>> = [];
  
  /**
   * Capture and track an error occurrence
   * 
   * @param error Error object that occurred
   * @param context Additional context about the error
   * @returns Generated error event
   */
  captureError(error: Error | AppError, context: ErrorContext = {}): ErrorEvent {
    try {
      // Create error event
      const event: ErrorEvent = {
        id: `err-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        error,
        context,
        timestamp: new Date(),
        isHandled: false,
        category: this.determineErrorCategory(error),
        code: this.determineErrorCode(error),
        message: error.message,
        stack: error.stack
      };
      
      // Store error (with rotation if limit reached)
      if (this.errors.length >= ErrorTrackingService.MAX_STORED_ERRORS) {
        this.errors.shift(); // Remove oldest error
      }
      this.errors.push(event);
      
      // Update error aggregation
      this.updateErrorAggregation(event);
      
      // Record metrics
      this.recordErrorMetrics(event);
      
      // Log error
      this.logError(event);
      
      // Notify subscribers
      this.notifySubscribers(event).catch(e => {
        logger.error('Error notifying error tracking subscribers', { error: e });
      });
      
      return event;
    } catch (trackingError) {
      // Failsafe: if error tracking itself fails, just log and continue
      logger.error('Error in error tracking', { 
        trackingError, 
        originalError: error 
      });
      
      // Return a basic error event
      return {
        id: `err-failsafe-${Date.now()}`,
        error,
        context,
        timestamp: new Date(),
        isHandled: false,
        category: ErrorCategory.UNKNOWN,
        code: ErrorCode.UNKNOWN_ERROR,
        message: error.message,
        stack: error.stack
      };
    }
  }
  
  /**
   * Determine error category from error object
   * 
   * @param error Error object
   * @returns Error category
   */
  private determineErrorCategory(error: Error | AppError): ErrorCategory {
    // Use existing category if it's an AppError
    if ('category' in error && error.category) {
      return error.category;
    }
    
    // For other errors, use the inferErrorCategory logic from handlers.ts
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (message.includes('auth') || name.includes('auth')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return ErrorCategory.DATABASE;
    }
    
    if (message.includes('network') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    
    if (message.includes('rate limit') || message.includes('throttle')) {
      return ErrorCategory.RATE_LIMIT;
    }
    
    if (message.includes('websocket') || message.includes('connection')) {
      return ErrorCategory.WEBSOCKET;
    }
    
    return ErrorCategory.INTERNAL;
  }
  
  /**
   * Determine error code from error object
   * 
   * @param error Error object
   * @returns Error code
   */
  private determineErrorCode(error: Error | AppError): ErrorCode | string {
    // Use existing code if it's an AppError
    if ('code' in error && error.code) {
      return error.code;
    }
    
    // For other errors, use the inferErrorCode logic from handlers.ts
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid')) {
      return ErrorCode.INVALID_INPUT;
    }
    
    if (message.includes('required')) {
      return ErrorCode.MISSING_REQUIRED_FIELD;
    }
    
    if (message.includes('auth')) {
      return ErrorCode.UNAUTHORIZED;
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCode.FORBIDDEN;
    }
    
    if (message.includes('not found')) {
      return ErrorCode.NOT_FOUND;
    }
    
    if (message.includes('already exists')) {
      return ErrorCode.ALREADY_EXISTS;
    }
    
    if (message.includes('timeout')) {
      return ErrorCode.TIMEOUT;
    }
    
    if (message.includes('unavailable')) {
      return ErrorCode.SERVICE_UNAVAILABLE;
    }
    
    if (message.includes('database')) {
      return ErrorCode.DATABASE_ERROR;
    }
    
    if (message.includes('network')) {
      return ErrorCode.NETWORK_ERROR;
    }
    
    if (message.includes('rate limit')) {
      return ErrorCode.RATE_LIMITED;
    }
    
    if (message.includes('websocket')) {
      return ErrorCode.WEBSOCKET_ERROR;
    }
    
    return ErrorCode.INTERNAL_ERROR;
  }
  
  /**
   * Generate a stable signature for an error to group similar errors
   * 
   * @param event Error event
   * @returns Error signature string
   */
  private generateErrorSignature(event: ErrorEvent): string {
    // Extract the first frame from the stack trace that belongs to our code
    const stackFrames = event.stack?.split('\n').slice(1) || [];
    
    let relevantFrame = stackFrames.find(frame => 
      !frame.includes('node_modules') && 
      (frame.includes('/src/') || frame.includes('/dist/'))
    ) || stackFrames[0] || '';
    
    // Clean up the frame
    relevantFrame = relevantFrame.trim().replace(/\s+at\s+/, '');
    
    // Create signature based on error properties and context
    return [
      event.category,
      event.code,
      relevantFrame,
      event.context.component,
      event.context.path
    ].filter(Boolean).join('::');
  }
  
  /**
   * Update error aggregation with a new error event
   * 
   * @param event Error event
   */
  private updateErrorAggregation(event: ErrorEvent): void {
    // Generate error signature
    const signature = this.generateErrorSignature(event);
    
    // Get existing aggregation or create a new one
    let aggregation = this.errorsBySignature.get(signature);
    
    if (!aggregation) {
      aggregation = {
        signature,
        count: 0,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        examples: [],
        isResolved: false
      };
      this.errorsBySignature.set(signature, aggregation);
    }
    
    // Update aggregation
    aggregation.count++;
    aggregation.lastSeen = event.timestamp;
    
    // Store example if we don't have too many already
    if (aggregation.examples.length < ErrorTrackingService.MAX_EXAMPLES_PER_SIGNATURE) {
      aggregation.examples.push(event);
    }
  }
  
  /**
   * Record error metrics for monitoring
   * 
   * @param event Error event
   */
  private recordErrorMetrics(event: ErrorEvent): void {
    // Record error count by category
    monitoringService.recordMetric('error.count', 1, {
      category: event.category,
      code: event.code,
      path: event.context.path || 'unknown',
      method: event.context.method || 'unknown',
      component: event.context.component || 'unknown',
      handled: String(event.isHandled)
    });
  }
  
  /**
   * Log error based on severity and context
   * 
   * @param event Error event
   */
  private logError(event: ErrorEvent): void {
    // Determine log level based on error category
    let logMethod = logger.error.bind(logger);
    
    if (event.category === ErrorCategory.VALIDATION) {
      logMethod = logger.warn.bind(logger);
    }
    
    // Log the error with context
    logMethod(`Error captured: ${event.message}`, {
      errorId: event.id,
      category: event.category,
      code: event.code,
      context: event.context,
      stack: event.stack
    });
  }
  
  /**
   * Subscribe to error events
   * 
   * @param handler Function to call for each error event
   * @returns Unsubscribe function
   */
  subscribe(handler: (event: ErrorEvent) => Promise<void>): () => void {
    this.subscribers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(handler);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all subscribers about an error event
   * 
   * @param event Error event
   */
  private async notifySubscribers(event: ErrorEvent): Promise<void> {
    // Execute all subscriber handlers in parallel
    await Promise.all(
      this.subscribers.map(handler => 
        handler(event).catch(e => 
          logger.error('Error in error tracking subscriber', { error: e })
        )
      )
    );
  }
  
  /**
   * Mark an error as handled
   * 
   * @param errorId ID of the error to mark as handled
   */
  markErrorAsHandled(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.isHandled = true;
    }
  }
  
  /**
   * Mark an error pattern as resolved
   * 
   * @param signature Error signature to mark as resolved
   */
  markErrorAsResolved(signature: string): void {
    const aggregation = this.errorsBySignature.get(signature);
    if (aggregation) {
      aggregation.isResolved = true;
    }
  }
  
  /**
   * Get recent errors
   * 
   * @param limit Maximum number of errors to return (default: 100)
   * @returns Recent error events
   */
  getRecentErrors(limit: number = 100): ErrorEvent[] {
    return this.errors
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get error aggregations
   * 
   * @param includeResolved Whether to include resolved errors (default: false)
   * @returns Error aggregations
   */
  getErrorAggregations(includeResolved: boolean = false): ErrorAggregation[] {
    const aggregations = Array.from(this.errorsBySignature.values())
      .filter(agg => includeResolved || !agg.isResolved)
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    return aggregations;
  }
  
  /**
   * Get error frequency over time
   * 
   * @param timeframe Timeframe in milliseconds to look back
   * @param resolution Number of bins to divide the timeframe into
   * @returns Error counts over time
   */
  getErrorFrequency(timeframe: number = 86400000, resolution: number = 24): Array<{ timestamp: Date; count: number }> {
    const now = Date.now();
    const startTime = now - timeframe;
    const interval = timeframe / resolution;
    
    // Initialize bins
    const bins = new Array(resolution).fill(0).map((_, i) => ({
      timestamp: new Date(startTime + i * interval),
      count: 0
    }));
    
    // Count errors in each bin
    for (const error of this.errors) {
      const errorTime = error.timestamp.getTime();
      if (errorTime >= startTime) {
        const binIndex = Math.min(
          Math.floor((errorTime - startTime) / interval),
          resolution - 1
        );
        bins[binIndex].count++;
      }
    }
    
    return bins;
  }
}

/**
 * Extract error context from a Fastify request
 * 
 * @param request Fastify request object
 * @returns Error context
 */
export function extractErrorContextFromRequest(request: FastifyRequest): ErrorContext {
  return {
    userId: request.user?.id,
    requestId: request.id,
    path: request.url,
    method: request.method,
    metadata: {
      headers: request.headers,
      query: request.query,
      params: request.params,
      // Don't include body to avoid sensitive data
    }
  };
}

// Create singleton instance
export const errorTrackingService = new ErrorTrackingService();

/**
 * Set up error tracking endpoints for a Fastify instance
 * 
 * @param app Fastify instance
 * @param options Configuration options
 * @returns Error tracking service instance
 */
export function setupErrorTracking(
  app: FastifyInstance,
  options: {
    endpoint?: string;
  } = {}
): ErrorTrackingService {
  // Add error tracking endpoints (admin only)
  app.get(options.endpoint || '/errors', {
    schema: {
      hide: true
    },
    handler: async (request, reply) => {
      const limit = request.query.limit || 100;
      const recentErrors = errorTrackingService.getRecentErrors(limit);
      
      return reply.send({
        data: {
          errors: recentErrors,
          count: recentErrors.length
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  });
  
  // Add error aggregation endpoint
  app.get('/errors/aggregations', {
    schema: {
      hide: true,
      querystring: {
        includeResolved: { type: 'boolean', default: false }
      }
    },
    handler: async (request: any, reply) => {
      const { includeResolved } = request.query;
      const aggregations = errorTrackingService.getErrorAggregations(includeResolved);
      
      return reply.send({
        data: {
          aggregations,
          count: aggregations.length
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  });
  
  // Add error frequency endpoint
  app.get('/errors/frequency', {
    schema: {
      hide: true,
      querystring: {
        timeframe: { type: 'number', default: 86400000 }, // 24 hours in ms
        resolution: { type: 'number', default: 24 }
      }
    },
    handler: async (request: any, reply) => {
      const { timeframe, resolution } = request.query;
      const frequency = errorTrackingService.getErrorFrequency(timeframe, resolution);
      
      return reply.send({
        data: {
          frequency,
          timeframe,
          resolution
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  });
  
  // Add error resolution endpoint
  app.post('/errors/:id/resolve', {
    schema: {
      hide: true,
      params: {
        id: { type: 'string' }
      }
    },
    handler: async (request: any, reply) => {
      const { id } = request.params;
      errorTrackingService.markErrorAsHandled(id);
      
      return reply.send({
        data: {
          success: true,
          id
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  });
  
  // Add error pattern resolution endpoint
  app.post('/errors/patterns/:signature/resolve', {
    schema: {
      hide: true,
      params: {
        signature: { type: 'string' }
      }
    },
    handler: async (request: any, reply) => {
      const { signature } = request.params;
      errorTrackingService.markErrorAsResolved(signature);
      
      return reply.send({
        data: {
          success: true,
          signature
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  });
  
  // Add error tracking service to app instance
  app.decorate('errorTracking', errorTrackingService);
  
  return errorTrackingService;
}

// Export all types and functions
export default {
  ErrorTrackingService,
  extractErrorContextFromRequest,
  setupErrorTracking,
  service: errorTrackingService
};