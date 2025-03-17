/**
 * Error Handlers
 * 
 * Provides middleware and utilities for handling errors
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseError } from './base-error';
import { ErrorCode, ErrorMessages, ErrorStatusCodes } from './error-codes';
import { logger } from '../lib/logger';

/**
 * Global error handler for API routes
 * @param error Error object
 * @param request Fastify request
 * @param reply Fastify reply
 */
export function handleApiError(
  error: Error, 
  request: FastifyRequest, 
  reply: FastifyReply
): void {
  // Determine if error is a known application error
  if (error instanceof BaseError) {
    // Log appropriately based on status code
    if (error.statusCode >= 500) {
      logger.error('Server error', {
        error: error.toJSON(),
        path: request.url,
        method: request.method,
        requestId: request.id
      });
    } else if (error.statusCode >= 400) {
      logger.warn('Client error', {
        message: error.message,
        code: error.code,
        path: request.url,
        method: request.method,
        requestId: request.id
      });
    }
    
    // Send standardized error response
    reply.status(error.statusCode).send({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      },
      errors: [
        {
          code: error.code,
          message: error.message,
          details: error.details
        }
      ]
    });
    return;
  }
  
  // Handle unknown errors
  logger.error('Unhandled error', {
    error,
    stack: error.stack,
    path: request.url,
    method: request.method,
    requestId: request.id
  });
  
  // Determine error code and message based on error type
  let errorCode = ErrorCode.SERVER_ERROR;
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  
  // Special handling for common error types
  if (error.name === 'ValidationError') {
    errorCode = ErrorCode.VALIDATION_ERROR;
    statusCode = 400;
    message = error.message || 'Validation error';
  } else if (error.name === 'NotFoundError') {
    errorCode = ErrorCode.RESOURCE_NOT_FOUND;
    statusCode = 404;
    message = error.message || 'Resource not found';
  } else if (error.name === 'UnauthorizedError') {
    errorCode = ErrorCode.UNAUTHORIZED;
    statusCode = 401;
    message = error.message || 'Authentication required';
  }
  
  // Send generic error response
  reply.status(statusCode).send({
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: request.id
    },
    errors: [
      {
        code: errorCode,
        message: message,
        details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      }
    ]
  });
}

/**
 * Middleware for handling 404 errors
 * @param request Fastify request
 * @param reply Fastify reply
 */
export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  logger.warn('Route not found', {
    path: request.url,
    method: request.method,
    requestId: request.id
  });
  
  reply.status(404).send({
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: request.id
    },
    errors: [
      {
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'Route not found',
        details: {
          method: request.method,
          url: request.url
        }
      }
    ]
  });
}

/**
 * Create standardized error object for API responses
 * @param code Error code
 * @param message Custom error message (optional)
 * @param details Additional error details (optional)
 * @returns Error object for API response
 */
export function createErrorObject(
  code: ErrorCode,
  message?: string,
  details?: any
): {
  code: ErrorCode;
  message: string;
  details?: any;
} {
  return {
    code,
    message: message || ErrorMessages[code],
    details
  };
}

/**
 * Create standardized error response for API
 * @param code Error code
 * @param requestId Request ID
 * @param message Custom error message (optional)
 * @param details Additional error details (optional)
 * @returns Error response object
 */
export function createErrorResponse(
  code: ErrorCode,
  requestId: string,
  message?: string,
  details?: any
): {
  data: null;
  meta: { timestamp: string; requestId: string };
  errors: Array<{ code: ErrorCode; message: string; details?: any }>;
} {
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId
    },
    errors: [
      createErrorObject(code, message, details)
    ]
  };
}
