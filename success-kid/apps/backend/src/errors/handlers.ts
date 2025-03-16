/**
 * Error handler implementations for different contexts
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError, InternalServerError } from './base-error';
import { serializeError } from './serializers';
import { logger } from '../lib/logger';

/**
 * Handle API errors for HTTP responses
 * 
 * This function creates a standardized error response format for API errors
 * with appropriate status codes and structured information.
 * 
 * @param request Fastify request object
 * @param reply Fastify reply object
 * @param error The error to handle
 */
export async function handleApiError(
  request: FastifyRequest, 
  reply: FastifyReply, 
  error: any
): Promise<FastifyReply> {
  // Map to an AppError with appropriate information
  let appError: AppError;
  
  if (error instanceof AppError) {
    // Known application error - use as is
    appError = error;
  } else if (error.validation) {
    // Fastify validation error
    appError = new AppError(
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      error.validation.map((v: any) => ({ 
        field: v.dataPath.substring(1), // Remove leading '.'
        message: v.message 
      }))
    );
  } else {
    // Unknown error - treat as internal server error
    appError = new InternalServerError(
      'An unexpected error occurred',
      process.env.NODE_ENV !== 'production' ? { 
        originalMessage: error.message 
      } : undefined
    );
    
    // Log unexpected errors with detail
    logger.error('Unhandled error', { 
      error: error.message,
      stack: error.stack,
      path: request.url,
      method: request.method,
      params: request.params,
      query: request.query,
      body: request.body,
      requestId: request.id
    });
  }
  
  // Log all errors at appropriate levels
  const logMethod = appError.statusCode >= 500 ? 'error' : 'warn';
  logger[logMethod](`${appError.code}: ${appError.message}`, {
    statusCode: appError.statusCode,
    path: request.url,
    method: request.method,
    requestId: request.id
  });
  
  // Create standardized error response
  const errorResponse = serializeError(appError, request.id);
  
  // Send response with appropriate status code
  return reply
    .code(appError.statusCode)
    .send(errorResponse);
}

/**
 * WebSocket error handler
 * 
 * Serializes errors for WebSocket responses
 * 
 * @param socket The WebSocket connection
 * @param error The error to handle
 */
export function handleWebSocketError(socket: any, error: any): void {
  let appError: AppError;
  
  if (error instanceof AppError) {
    appError = error;
  } else {
    appError = new InternalServerError(
      'An unexpected error occurred',
      process.env.NODE_ENV !== 'production' ? { 
        originalMessage: error.message 
      } : undefined
    );
    
    // Log unexpected errors
    logger.error('Unhandled WebSocket error', { 
      error: error.message,
      stack: error.stack
    });
  }
  
  // Send error message to client if connection is open
  if (socket.readyState === 1) { // OPEN
    socket.send(JSON.stringify({
      type: 'error',
      payload: {
        code: appError.code,
        message: appError.message,
        details: appError.details
      }
    }));
  }
}
