/**
 * Error Tracking System
 * 
 * Provides centralized error tracking, aggregation, and reporting
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { BaseError } from '../../errors/base-error';
import { ErrorCode } from '../../errors/error-codes';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Error source
 */
export enum ErrorSource {
  SERVER = 'server',
  CLIENT = 'client',
  EXTERNAL = 'external'
}

/**
 * Error event interface
 */
export interface ErrorEvent {
  // Unique error ID
  id: string;
  
  // Error details
  message: string;
  code: ErrorCode | string;
  status?: number;
  stack?: string;
  
  // Error metadata
  severity: ErrorSeverity;
  source: ErrorSource;
  timestamp: Date;
  
  // Request context
  requestId?: string;
  correlationId?: string;
  path?: string;
  method?: string;
  
  // User context
  userId?: string;
  sessionId?: string;
  
  // Additional context
  context?: Record<string, any>;
  
  // Grouping and aggregation
  fingerprint?: string;
  count?: number;
  firstSeen?: Date;
  lastSeen?: Date;
}

/**
 * Error tracking configuration
 */
interface ErrorTrackerConfig {
  // Whether to send errors to external service
  enableExternalReporting?: boolean;
  
  // Minimum severity level to report
  minimumSeverity?: ErrorSeverity;
  
  // Sample rate for high-volume errors (0-1)
  sampleRate?: number;
  
  // Maximum errors to store in memory
  maxErrorsStored?: number;
}

/**
 * Error Tracker Class
 */
export class ErrorTracker {
  private static instance: ErrorTracker;
  private config: ErrorTrackerConfig;
  private errors: Map<string, ErrorEvent> = new Map();
  private errorCounts: Map<string, number> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor(config: ErrorTrackerConfig = {}) {
    this.config = {
      enableExternalReporting: config.enableExternalReporting ?? process.env.NODE_ENV === 'production',
      minimumSeverity: config.minimumSeverity ?? ErrorSeverity.WARNING,
      sampleRate: config.sampleRate ?? 1.0,
      maxErrorsStored: config.maxErrorsStored ?? 1000
    };
    
    // Set up error cleanup interval
    setInterval(() => this.cleanupOldErrors(), 3600000); // Every hour
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(config?: ErrorTrackerConfig): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker(config);
    }
    return ErrorTracker.instance;
  }
  
  /**
   * Track an error
   */
  public trackError(error: Error | BaseError, context: Record<string, any> = {}): ErrorEvent {
    // Create error event
    const errorEvent = this.createErrorEvent(error, context);
    
    // Apply sampling for high-volume errors
    if (this.shouldSampleError(errorEvent)) {
      // Store error
      this.storeError(errorEvent);
      
      // Report to external service if enabled
      if (this.config.enableExternalReporting && this.shouldReportError(errorEvent)) {
        this.reportToExternalService(errorEvent);
      }
      
      // Log error
      this.logError(errorEvent);
    }
    
    return errorEvent;
  }
  
  /**
   * Track a client-side error
   */
  public trackClientError(errorData: any): ErrorEvent {
    // Validate input
    if (!errorData || !errorData.message) {
      logger.warn('Invalid client error data', { errorData });
      errorData = { message: 'Unknown client error', code: 'CLIENT_ERROR' };
    }
    
    // Create error event
    const errorEvent: ErrorEvent = {
      id: errorData.id || uuidv4(),
      message: errorData.message,
      code: errorData.code || 'CLIENT_ERROR',
      status: errorData.status,
      stack: errorData.stack,
      severity: errorData.severity || ErrorSeverity.ERROR,
      source: ErrorSource.CLIENT,
      timestamp: new Date(errorData.timestamp) || new Date(),
      requestId: errorData.requestId,
      correlationId: errorData.correlationId,
      path: errorData.path,
      method: errorData.method,
      userId: errorData.userId,
      sessionId: errorData.sessionId,
      context: errorData.context || {},
      fingerprint: this.generateFingerprint({
        message: errorData.message,
        code: errorData.code,
        path: errorData.path,
        source: ErrorSource.CLIENT
      })
    };
    
    // Store and report error
    this.storeError(errorEvent);
    
    if (this.config.enableExternalReporting && this.shouldReportError(errorEvent)) {
      this.reportToExternalService(errorEvent);
    }
    
    // Log client error
    logger.warn(`Client error: ${errorEvent.message}`, {
      errorId: errorEvent.id,
      code: errorEvent.code,
      path: errorEvent.path,
      userId: errorEvent.userId,
      context: errorEvent.context
    });
    
    return errorEvent;
  }
  
  /**
   * Get all tracked errors
   */
  public getErrors(): ErrorEvent[] {
    return Array.from(this.errors.values());
  }
  
  /**
   * Get most frequent errors
   */
  public getMostFrequentErrors(limit: number = 10): ErrorEvent[] {
    return Array.from(this.errors.values())
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, limit);
  }
  
  /**
   * Get recent errors
   */
  public getRecentErrors(limit: number = 10): ErrorEvent[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  /**
   * Get error counts
   */
  public getErrorCounts(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
  
  /**
   * Clear all tracked errors
   */
  public clearErrors(): void {
    this.errors.clear();
    this.errorCounts.clear();
  }
  
  /**
   * Create error event from error object
   */
  private createErrorEvent(error: Error | BaseError, context: Record<string, any>): ErrorEvent {
    const isBaseError = error instanceof BaseError;
    
    // Determine error code
    const code = isBaseError ? error.code : (error as any).code || ErrorCode.SERVER_ERROR;
    
    // Determine HTTP status code
    const status = isBaseError ? error.statusCode : (error as any).status || 500;
    
    // Determine severity
    const severity = this.determineErrorSeverity(error, status);
    
    // Create error event
    const errorEvent: ErrorEvent = {
      id: uuidv4(),
      message: error.message,
      code,
      status,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      severity,
      source: ErrorSource.SERVER,
      timestamp: new Date(),
      requestId: context.requestId,
      correlationId: context.correlationId,
      path: context.path,
      method: context.method,
      userId: context.userId,
      sessionId: context.sessionId,
      context,
      fingerprint: this.generateFingerprint({
        message: error.message,
        code,
        path: context.path,
        stack: error.stack
      })
    };
    
    return errorEvent;
  }
  
  /**
   * Determine error severity based on error and status
   */
  private determineErrorSeverity(error: Error, status?: number): ErrorSeverity {
    // Critical errors
    if (
      status === 500 ||
      status === 503 ||
      error.message.includes('FATAL') ||
      error.message.includes('CRITICAL')
    ) {
      return ErrorSeverity.CRITICAL;
    }
    
    // Error level
    if (
      status === 400 ||
      status === 401 ||
      status === 403 ||
      status === 404 ||
      status === 422
    ) {
      return ErrorSeverity.WARNING;
    }
    
    // Default to ERROR
    return ErrorSeverity.ERROR;
  }
  
  /**
   * Generate fingerprint for error grouping
   */
  private generateFingerprint(data: Record<string, any>): string {
    // Create string from relevant data
    const parts: string[] = [];
    
    if (data.code) parts.push(data.code.toString());
    if (data.message) parts.push(data.message);
    if (data.path) parts.push(data.path);
    
    // Add first frame of stack trace if available (without line numbers)
    if (data.stack) {
      const stackFrames = data.stack.split('\n');
      if (stackFrames.length > 1) {
        // Get second line (first frame) and remove line numbers
        const frame = stackFrames[1].trim().replace(/:\d+:\d+\)$/, ')');
        parts.push(frame);
      }
    }
    
    return parts.join('|');
  }
  
  /**
   * Store error event
   */
  private storeError(errorEvent: ErrorEvent): void {
    const fingerprint = errorEvent.fingerprint!;
    
    // Check if we already have this error
    if (this.errors.has(fingerprint)) {
      // Update existing error
      const existingError = this.errors.get(fingerprint)!;
      existingError.count = (existingError.count || 1) + 1;
      existingError.lastSeen = new Date();
      
      // Update context with new information if available
      existingError.context = {
        ...existingError.context,
        ...errorEvent.context
      };
    } else {
      // Add new error
      errorEvent.count = 1;
      errorEvent.firstSeen = new Date();
      errorEvent.lastSeen = new Date();
      this.errors.set(fingerprint, errorEvent);
    }
    
    // Update error counts
    const code = errorEvent.code.toString();
    this.errorCounts.set(code, (this.errorCounts.get(code) || 0) + 1);
    
    // Limit stored errors
    if (this.errors.size > this.config.maxErrorsStored!) {
      // Remove oldest errors
      const errorsByAge = Array.from(this.errors.entries())
        .sort(([, a], [, b]) => a.lastSeen!.getTime() - b.lastSeen!.getTime());
      
      // Remove oldest 10%
      const removeCount = Math.ceil(this.errors.size * 0.1);
      for (let i = 0; i < removeCount && i < errorsByAge.length; i++) {
        this.errors.delete(errorsByAge[i][0]);
      }
    }
  }
  
  /**
   * Check if error should be sampled
   */
  private shouldSampleError(errorEvent: ErrorEvent): boolean {
    // Always sample critical errors
    if (errorEvent.severity === ErrorSeverity.CRITICAL) {
      return true;
    }
    
    // Apply sampling rate
    return Math.random() < this.config.sampleRate!;
  }
  
  /**
   * Check if error should be reported to external service
   */
  private shouldReportError(errorEvent: ErrorEvent): boolean {
    // Check minimum severity
    const severityMap: Record<ErrorSeverity, number> = {
      [ErrorSeverity.INFO]: 0,
      [ErrorSeverity.WARNING]: 1,
      [ErrorSeverity.ERROR]: 2,
      [ErrorSeverity.CRITICAL]: 3
    };
    
    const errorSeverityLevel = severityMap[errorEvent.severity];
    const minimumSeverityLevel = severityMap[this.config.minimumSeverity!];
    
    return errorSeverityLevel >= minimumSeverityLevel;
  }
  
  /**
   * Report error to external service
   */
  private reportToExternalService(errorEvent: ErrorEvent): void {
    // In a real implementation, this would send to an error reporting service
    // like Sentry, New Relic, etc.
    
    // For now, just log that we would report this
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Would report error to external service: ${errorEvent.message}`, {
        errorId: errorEvent.id,
        severity: errorEvent.severity
      });
    }
  }
  
  /**
   * Log error to application logs
   */
  private logError(errorEvent: ErrorEvent): void {
    const logData = {
      errorId: errorEvent.id,
      code: errorEvent.code,
      path: errorEvent.path,
      method: errorEvent.method,
      requestId: errorEvent.requestId,
      userId: errorEvent.userId,
      fingerprint: errorEvent.fingerprint
    };
    
    switch (errorEvent.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`CRITICAL ERROR: ${errorEvent.message}`, logData);
        break;
      case ErrorSeverity.ERROR:
        logger.error(`ERROR: ${errorEvent.message}`, logData);
        break;
      case ErrorSeverity.WARNING:
        logger.warn(`WARNING: ${errorEvent.message}`, logData);
        break;
      case ErrorSeverity.INFO:
        logger.info(`INFO: ${errorEvent.message}`, logData);
        break;
    }
  }
  
  /**
   * Clean up old errors
   */
  private cleanupOldErrors(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Keep critical errors for longer
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Remove old errors
    for (const [fingerprint, error] of this.errors.entries()) {
      const cutoffDate = error.severity === ErrorSeverity.CRITICAL ? oneWeekAgo : oneDayAgo;
      
      if (error.lastSeen && error.lastSeen < cutoffDate) {
        this.errors.delete(fingerprint);
      }
    }
  }
}

// Export singleton instance
export default ErrorTracker.getInstance();
