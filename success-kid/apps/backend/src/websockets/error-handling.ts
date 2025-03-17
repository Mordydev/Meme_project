/**
 * WebSocket Error Handling
 * 
 * Comprehensive error handling for WebSocket connections with
 * standardized error types, detection, and recovery mechanisms.
 */
import { WebSocket } from 'ws';
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger';

/**
 * WebSocket error types
 */
export enum WebSocketErrorType {
  // Connection errors
  CONNECTION_FAILED = 'connection.failed',
  CONNECTION_CLOSED = 'connection.closed',
  CONNECTION_TIMEOUT = 'connection.timeout',
  CONNECTION_LIMIT_EXCEEDED = 'connection.limit.exceeded',
  
  // Authentication errors
  AUTH_FAILED = 'auth.failed',
  AUTH_EXPIRED = 'auth.expired',
  AUTH_INVALID = 'auth.invalid',
  AUTH_REQUIRED = 'auth.required',
  
  // Message errors
  MESSAGE_INVALID = 'message.invalid',
  MESSAGE_TOO_LARGE = 'message.too_large',
  MESSAGE_RATE_LIMIT = 'message.rate_limit',
  
  // Subscription errors
  SUBSCRIPTION_DENIED = 'subscription.denied',
  SUBSCRIPTION_INVALID = 'subscription.invalid',
  SUBSCRIPTION_LIMIT_EXCEEDED = 'subscription.limit.exceeded',
  
  // Server errors
  SERVER_ERROR = 'server.error',
  SERVER_UNAVAILABLE = 'server.unavailable',
  SERVER_MAINTENANCE = 'server.maintenance',
  
  // Client errors
  CLIENT_ERROR = 'client.error',
  CLIENT_TIMEOUT = 'client.timeout',
  
  // Other errors
  UNKNOWN_ERROR = 'unknown.error'
}

/**
 * WebSocket error response
 */
export interface WebSocketErrorResponse {
  type: 'error';
  code: WebSocketErrorType;
  message: string;
  details?: any;
  id?: string;
  timestamp: string;
}

/**
 * WebSocket error options
 */
export interface WebSocketErrorOptions {
  code?: number;
  shouldClose?: boolean;
  details?: any;
  messageId?: string;
}

/**
 * Create standardized WebSocket error response
 * @param type Error type
 * @param message Error message
 * @param options Error options
 * @returns Formatted error response
 */
export function createErrorResponse(
  type: WebSocketErrorType,
  message: string,
  options: WebSocketErrorOptions = {}
): WebSocketErrorResponse {
  return {
    type: 'error',
    code: type,
    message,
    details: options.details,
    id: options.messageId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Send error response to WebSocket client
 * @param socket WebSocket connection
 * @param type Error type
 * @param message Error message
 * @param options Error options
 */
export function sendErrorResponse(
  socket: WebSocket,
  type: WebSocketErrorType,
  message: string,
  options: WebSocketErrorOptions = {}
): void {
  try {
    // Create error response
    const response = createErrorResponse(type, message, options);
    
    // Send error to client if socket is open
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(response));
    }
    
    // Log error
    logger.warn('WebSocket error sent', { type, message, details: options.details });
    
    // Close connection if requested
    if (options.shouldClose && socket.readyState === WebSocket.OPEN) {
      socket.close(options.code || 1008, message);
    }
  } catch (error) {
    logger.error('Failed to send WebSocket error', { error, type, message });
  }
}

/**
 * Parse WebSocket errors for consistent handling
 * @param error Error object
 * @returns Standardized error type
 */
export function parseWebSocketError(error: any): {
  type: WebSocketErrorType;
  message: string;
  details?: any;
} {
  // Handle different error types
  if (error instanceof Error) {
    // Handle standard error objects
    const message = error.message;
    
    // Classify error by message patterns
    if (message.includes('authentication') || message.includes('auth')) {
      return {
        type: WebSocketErrorType.AUTH_FAILED,
        message: 'Authentication failed',
        details: { originalMessage: message }
      };
    } else if (message.includes('limit')) {
      return {
        type: WebSocketErrorType.CONNECTION_LIMIT_EXCEEDED,
        message: 'Connection limit exceeded',
        details: { originalMessage: message }
      };
    } else if (message.includes('timeout')) {
      return {
        type: WebSocketErrorType.CONNECTION_TIMEOUT,
        message: 'Connection timed out',
        details: { originalMessage: message }
      };
    } else if (message.includes('message')) {
      return {
        type: WebSocketErrorType.MESSAGE_INVALID,
        message: 'Invalid message format',
        details: { originalMessage: message }
      };
    }
    
    // Default to unknown error
    return {
      type: WebSocketErrorType.UNKNOWN_ERROR,
      message: error.message,
      details: { stack: error.stack }
    };
  } else if (typeof error === 'string') {
    // Handle string errors
    return {
      type: WebSocketErrorType.UNKNOWN_ERROR,
      message: error
    };
  } else {
    // Handle other error types
    return {
      type: WebSocketErrorType.UNKNOWN_ERROR,
      message: 'Unknown error occurred',
      details: error
    };
  }
}

/**
 * Error handler middleware for WebSocket route
 * @param request Fastify request
 * @param reply Fastify reply
 * @param error Error object
 */
export async function websocketErrorHandler(
  request: FastifyRequest,
  reply: FastifyReply,
  error: any
): Promise<void> {
  const parsedError = parseWebSocketError(error);
  
  logger.error('WebSocket error', {
    error: parsedError,
    url: request.url,
    method: request.method,
    ip: request.ip
  });
  
  // Send appropriate HTTP response for WebSocket connection errors
  switch (parsedError.type) {
    case WebSocketErrorType.AUTH_FAILED:
    case WebSocketErrorType.AUTH_EXPIRED:
    case WebSocketErrorType.AUTH_INVALID:
    case WebSocketErrorType.AUTH_REQUIRED:
      reply.code(401).send({
        error: parsedError.type,
        message: parsedError.message
      });
      break;
      
    case WebSocketErrorType.CONNECTION_LIMIT_EXCEEDED:
      reply.code(429).send({
        error: parsedError.type,
        message: parsedError.message
      });
      break;
      
    case WebSocketErrorType.SERVER_UNAVAILABLE:
    case WebSocketErrorType.SERVER_MAINTENANCE:
      reply.code(503).send({
        error: parsedError.type,
        message: parsedError.message
      });
      break;
      
    default:
      reply.code(500).send({
        error: parsedError.type,
        message: parsedError.message
      });
  }
}

/**
 * Circuit breaker for WebSocket connections
 * Temporarily disables connections when error rate is too high
 */
export class WebSocketCircuitBreaker {
  private errorCount: number = 0;
  private successCount: number = 0;
  private lastReset: number = Date.now();
  private isOpen: boolean = false;
  private readonly errorThreshold: number;
  private readonly resetTimeout: number;
  
  /**
   * Create circuit breaker
   * @param errorThreshold Number of errors to trigger circuit open
   * @param resetTimeout Milliseconds to wait before reset
   */
  constructor(errorThreshold: number = 10, resetTimeout: number = 60000) {
    this.errorThreshold = errorThreshold;
    this.resetTimeout = resetTimeout;
  }
  
  /**
   * Record connection success
   */
  recordSuccess(): void {
    this.successCount++;
    this.resetIfNeeded();
  }
  
  /**
   * Record connection error
   * @returns Whether circuit was opened
   */
  recordError(): boolean {
    this.errorCount++;
    
    // Check if should open circuit
    if (!this.isOpen && this.errorCount >= this.errorThreshold) {
      this.isOpen = true;
      
      logger.warn('WebSocket circuit breaker opened', {
        errorCount: this.errorCount,
        successCount: this.successCount,
        threshold: this.errorThreshold
      });
      
      // Schedule reset
      setTimeout(() => this.reset(), this.resetTimeout);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if circuit is open
   * @returns Whether circuit is open
   */
  isCircuitOpen(): boolean {
    return this.isOpen;
  }
  
  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.errorCount = 0;
    this.successCount = 0;
    this.isOpen = false;
    this.lastReset = Date.now();
    
    logger.info('WebSocket circuit breaker reset');
  }
  
  /**
   * Reset if needed based on time
   */
  private resetIfNeeded(): void {
    const now = Date.now();
    
    // Reset counts if too much time has passed
    if (now - this.lastReset > this.resetTimeout) {
      this.errorCount = 0;
      this.successCount = 0;
      this.lastReset = now;
    }
  }
}
