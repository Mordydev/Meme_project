/**
 * Error Handlers
 * 
 * Centralized error handling for application components
 */
import { WebSocket } from 'ws';
import { logger } from '../lib/logger';
import { monitoringService } from '../monitoring/service';
import { WebSocketEventType } from '@success-kid/api-types';

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
 * Application error base class
 */
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;
  
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintain proper stack trace (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
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
      ErrorCategory.WEBSOCKET,
      code,
      500,
      details,
      true
    );
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
      connectionId: socket.connectionId,
      userId: socket.userId
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
  code: ErrorCode;
  details?: any;
  isOperational: boolean;
} {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      message: error.message,
      category: error.category,
      code: error.code,
      details: error.details,
      isOperational: error.isOperational
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
function inferErrorCategory(error: Error): ErrorCategory {
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
function inferErrorCode(error: Error): ErrorCode {
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
  code: ErrorCode;
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
