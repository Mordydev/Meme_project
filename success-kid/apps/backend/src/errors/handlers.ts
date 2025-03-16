/**
 * Error Handlers
 * 
 * This module provides handlers for different types of errors
 * throughout the application.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from './base-error';
import { logger } from '../lib/logger';
import { ErrorCode, errorCodeMap } from './error-codes';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  data: null;
  meta: {
    timestamp: string;
    requestId: string;
  };
  errors: Array<{
    code: string;
    message: string;
    details?: any;
  }>;
}

/**
 * Centralized error handler for API responses
 */
export function handleApiError(
  request: FastifyRequest, 
  reply: FastifyReply, 
  error: any
): FastifyReply {
  // Get request ID for tracking
  const requestId = request.id;
  
  // Handle known application errors
  if (error instanceof AppError) {
    // Known application error with specific code and status
    const response = serializeError(error, requestId);
    
    // Log error with appropriate level based on status code
    if (error.statusCode >= 500) {
      logger.error({ 
        err: error,
        req: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
        }
      }, `API Error [${error.code}]: ${error.message}`);
    } else if (error.statusCode >= 400) {
      logger.warn({
        err: error,
        req: {
          method: request.method,
          url: request.url,
        }
      }, `API Error [${error.code}]: ${error.message}`);
    }
    
    return reply.code(error.statusCode).send(response);
  }
  
  // Handle Fastify validation errors
  if (error.validation) {
    const validationError = {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation error',
      details: error.validation.map((v: any) => ({
        field: v.params?.missingProperty || v.dataPath?.substring(1) || 'unknown',
        message: v.message,
      })),
    };
    
    const response: ErrorResponse = {
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
      errors: [validationError],
    };
    
    logger.warn({
      validation: error.validation,
      req: {
        method: request.method,
        url: request.url,
      }
    }, 'Validation Error');
    
    return reply.code(400).send(response);
  }
  
  // Log unexpected errors
  logger.error({
    err: error,
    req: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      params: request.params,
      query: request.query,
    }
  }, `Unexpected Error: ${error.message || 'Unknown error'}`);
  
  // Return generic error for unexpected errors
  const genericError: ErrorResponse = {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
    errors: [
      {
        code: ErrorCode.SERVER_ERROR,
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message || 'Unknown error',
      }
    ]
  };
  
  return reply.code(500).send(genericError);
}

/**
 * Serialize an AppError into a standardized error response
 */
export function serializeError(error: AppError, requestId: string): ErrorResponse {
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
    errors: [
      {
        code: error.code,
        message: error.message,
        details: error.details,
      }
    ]
  };
}

/**
 * Create a Fastify error handler that uses the handleApiError function
 */
export function createErrorHandler() {
  return function errorHandler(
    error: Error, 
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    return handleApiError(request, reply, error);
  };
}

/**
 * Create a Not Found handler for routes that don't exist
 */
export function createNotFoundHandler() {
  return function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
    const error = {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `Route ${request.method}:${request.url} not found`,
    };
    
    const response: ErrorResponse = {
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
      errors: [error],
    };
    
    return reply.code(404).send(response);
  };
}
