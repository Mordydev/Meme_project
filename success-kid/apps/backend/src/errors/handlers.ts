/**
 * Error Handlers
 * 
 * Centralized error handling for application components
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { logger } from '@/lib/logger';
import { monitoringService } from '@/monitoring/service';
import { WebSocketEventType } from '@success-kid/api-types';
import { serializeError, serializeUnknownError, serializeValidationError } from './serializers';
import { errorTrackingService, extractErrorContextFromRequest } from '@/monitoring/error-tracking';
import { AppError } from './base-error';

/**
 * Error classification types
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  INTERNAL = 'internal',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  WEBSOCKET = 'websocket',
  UNKNOWN = 'unknown'
}

/**
 * Error codes
 */
export enum ErrorCode {
  INVALID_INPUT = 'invalid_input',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INVALID_FORMAT = 'invalid_format',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  ALREADY_EXISTS = 'already_exists',
  TIMEOUT = 'timeout',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  INTERNAL_ERROR = 'internal_error',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMITED = 'rate_limited',
  INVALID_MESSAGE = 'invalid_message',
  WEBSOCKET_ERROR = 'websocket_error',
  CONNECTION_ERROR = 'connection_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Handle API errors and format consistent responses
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @param error Error that occurred
 * @returns Fastify reply with formatted error response
 */
export async function handleApiError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: any
): Promise<FastifyReply> {
  try {
    // Track error with context
    const errorContext = extractErrorContextFromRequest(request);
    errorTrackingService.captureError(error, errorContext);
    
    // Handle Fastify validation errors
    if (error.validation) {
      const response = serializeValidationError(error.validation, request.id);
      return reply.code(400).send(response);
    }
    
    // Handle AppError with standardized format
    if (error instanceof AppError) {
      const response = serializeError(error, request.id);
      return reply.code(error.statusCode).send(response);
    }
    
    // Handle unknown errors
    const statusCode = error.statusCode || error.status || 500;
    const response = serializeUnknownError(error, request.id);
    
    // Record error metrics
    monitoringService.recordMetric('http.errors', 1, {
      method: request.method,
      route: request.routerPath || request.url,
      status: String(statusCode)
    });
    
    return reply.code(statusCode).send(response);
  } catch (handlingError) {
    // Last resort error handling if error handler itself fails
    logger.error('Error in error handler', { 
      originalError: error,
      handlingError
    });
    
    return reply.code(500).send({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      },
      errors: [{
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing your request'
      }]
    });
  }
}

/**
 * WebSocket-specific error class
 */
export class WebSocketError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.WEBSOCKET_ERROR,
    details?: any
  ) {
    super(
      message,
      code,
      500,
      details
    );
    
    this.name = 'WebSocketError';
    // Ensure prototype chain is properly maintained
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Handle WebSocket error
 * 
 * @param socket WebSocket connection
 * @param error Error object
 */
export function handleWebSocketError(socket: WebSocket, error: any): void {
  try {
    // Normalize error
    const normalizedError = normalizeError(error);
    
    // Log the error
    logger.error('WebSocket error', { 
      error: normalizedError,
      connectionId: (socket as any).connectionId,
      userId: (socket as any).userId
    });
    
    // Track error
    errorTrackingService.captureError(error, {
      userId: (socket as any).userId,
      component: 'WebSocket',
      metadata: {
        connectionId: (socket as any).connectionId
      }
    });
    
    // Only send error response if socket is still open
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: WebSocketEventType.ERROR,
        payload: {
          code: normalizedError.code,
          message: normalizedError.message,
          category: normalizedError.category
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    // Record error metrics
    monitoringService.recordMetric('websocket.errors', 1, {
      category: normalizedError.category,
      code: normalizedError.code
    });
    
    // Close socket for critical errors
    if (
      normalizedError.category === ErrorCategory.AUTHENTICATION ||
      normalizedError.category === ErrorCategory.AUTHORIZATION ||
      normalizedError.code === ErrorCode.INTERNAL_ERROR
    ) {
      socket.close(getCloseCodeForError(normalizedError), normalizedError.message.substring(0, 123));
    }
  } catch (handlingError) {
    // Last resort error handling
    logger.error('Error in WebSocket error handler', { 
      error: handlingError,
      originalError: error 
    });
    
    // Try to close socket if it's open
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1011, 'Internal error');
      }
    } catch (e) {
      // Ignore further errors
    }
  }
}

/**
 * Normalize various error types into a consistent structure
 * 
 * @param error Error object
 * @returns Normalized error
 */
export function normalizeError(error: any): {
  message: string;
  category: ErrorCategory;
  code: ErrorCode | string;
  details?: any;
  isOperational: boolean;
} {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      message: error.message,
      category: inferErrorCategory(error),
      code: error.code as ErrorCode,
      details: error.details,
      isOperational: true
    };
  }
  
  // Handle standard Error
  if (error instanceof Error) {
    return {
      message: error.message || 'Unknown error occurred',
      category: inferErrorCategory(error),
      code: inferErrorCode(error),
      details: { name: error.name, stack: error.stack },
      isOperational: false
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      category: ErrorCategory.UNKNOWN,
      code: ErrorCode.UNKNOWN_ERROR,
      isOperational: false
    };
  }
  
  // Handle other types
  return {
    message: error?.message || 'Unknown error occurred',
    category: ErrorCategory.UNKNOWN,
    code: ErrorCode.UNKNOWN_ERROR,
    details: error,
    isOperational: false
  };
}

/**
 * Infer error category from standard Error
 * 
 * @param error Error object
 * @returns Error category
 */
export function inferErrorCategory(error: Error | AppError): ErrorCategory {
  // Use existing category if available
  if ('category' in error && error.category) {
    return error.category;
  }
  
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
 * Infer error code from standard Error
 * 
 * @param error Error object
 * @returns Error code
 */
export function inferErrorCode(error: Error): ErrorCode {
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
 * Get WebSocket close code for error type
 * 
 * @param error Normalized error
 * @returns WebSocket close code
 */
function getCloseCodeForError(error: {
  category: ErrorCategory;
  code: ErrorCode | string;
}): number {
  switch (error.category) {
    case ErrorCategory.AUTHENTICATION:
      return 1008; // Policy violation
    
    case ErrorCategory.AUTHORIZATION:
      return 1008; // Policy violation
    
    case ErrorCategory.VALIDATION:
      return 1007; // Invalid data
    
    case ErrorCategory.RATE_LIMIT:
      return 1013; // Try again later
    
    case ErrorCategory.NETWORK:
      return 1006; // Abnormal closure
    
    case ErrorCategory.INTERNAL:
      return 1011; // Internal error
    
    case ErrorCategory.EXTERNAL_SERVICE:
      return 1011; // Internal error
    
    default:
      return 1000; // Normal closure
  }
}

/**
 * Create a global error handler for Node.js uncaught errors
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    try {
      logger.error('Uncaught exception', { error });
      
      // Track error
      errorTrackingService.captureError(error, {
        component: 'Node.js Process',
        tags: {
          type: 'uncaughtException'
        }
      });
      
      // Record metric
      monitoringService.recordMetric('process.uncaught_exception', 1);
    } catch (handlingError) {
      // Last resort logging if error tracking fails
      console.error('CRITICAL: Error handling uncaught exception', handlingError);
      console.error('Original error:', error);
    }
    
    // For uncaught exceptions, we should exit the process
    // as the state may be corrupted
    if (process.env.NODE_ENV === 'production') {
      // Allow time for logging before exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    try {
      logger.error('Unhandled promise rejection', { reason });
      
      // Track error
      errorTrackingService.captureError(
        reason instanceof Error ? reason : new Error(String(reason)),
        {
          component: 'Node.js Process',
          tags: {
            type: 'unhandledRejection'
          }
        }
      );
      
      // Record metric
      monitoringService.recordMetric('process.unhandled_rejection', 1);
    } catch (handlingError) {
      // Last resort logging if error tracking fails
      console.error('CRITICAL: Error handling unhandled rejection', handlingError);
      console.error('Original reason:', reason);
    }
    
    // We don't exit the process for unhandled rejections
    // as they may be handled later and are less likely to corrupt state
  });
}
