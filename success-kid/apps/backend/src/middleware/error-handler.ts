/**
 * Global error handler middleware for Fastify
 */
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@/errors/base-error';
import { handleApiError } from '@/errors/handlers';
import { ErrorCategory, ErrorCode } from '@/errors/handlers';
import { logger } from '@/lib/logger';
import { monitoringService } from '@/monitoring/service';

/**
 * Error handler middleware
 * 
 * Processes all errors that occur during request handling and formats them
 * according to the standardized API error response format.
 * 
 * @param error The error that occurred
 * @param request The Fastify request object
 * @param reply The Fastify reply object
 */
export async function errorHandlerMiddleware(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    // Record error metrics
    const statusCode = 'statusCode' in error ? error.statusCode : 500;
    const category = 'category' in error ? error.category : getErrorCategory(error);
    const code = 'code' in error ? error.code : getErrorCode(error);
    
    monitoringService.recordMetric('http.errors', 1, {
      method: request.method,
      route: request.routerPath || request.url,
      status: String(statusCode),
      category,
      code: String(code)
    });
    
    // Record latency for error responses
    if (request.locals?.startTime) {
      const [seconds, nanoseconds] = process.hrtime(request.locals.startTime);
      const responseTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
      
      monitoringService.recordMetric('http.error_response_time', responseTimeMs, {
        method: request.method,
        route: request.routerPath || request.url,
        status: String(statusCode)
      });
    }
    
    // Use the centralized error handler
    return handleApiError(request, reply, error);
  } catch (handlingError) {
    // Last resort error handling if the error handler itself fails
    logger.error('Critical: Error in error handler middleware', { 
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
 * Get error category from a non-AppError
 */
function getErrorCategory(error: Error): string {
  if (error.name === 'ValidationError' || 
      error.message.includes('validation') || 
      error.message.includes('invalid')) {
    return ErrorCategory.VALIDATION;
  }
  
  if (error.name === 'UnauthorizedError' || 
      error.message.includes('unauthorized') || 
      error.message.includes('unauthenticated')) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  if (error.name === 'ForbiddenError' || 
      error.message.includes('forbidden') || 
      error.message.includes('permission')) {
    return ErrorCategory.AUTHORIZATION;
  }
  
  // Default to internal error
  return ErrorCategory.INTERNAL;
}

/**
 * Get error code from a non-AppError
 */
function getErrorCode(error: Error): string {
  if (error.name === 'ValidationError') {
    return ErrorCode.INVALID_INPUT;
  }
  
  if (error.name === 'UnauthorizedError') {
    return ErrorCode.UNAUTHORIZED;
  }
  
  if (error.name === 'ForbiddenError') {
    return ErrorCode.FORBIDDEN;
  }
  
  if (error.name === 'NotFoundError' || error.message.includes('not found')) {
    return ErrorCode.NOT_FOUND;
  }
  
  // Default to internal error
  return ErrorCode.INTERNAL_ERROR;
}

/**
 * Register error handler with Fastify
 * 
 * @param fastify Fastify instance
 */
export function registerErrorHandler(fastify: any): void {
  fastify.setErrorHandler(errorHandlerMiddleware);
}

export default {
  middleware: errorHandlerMiddleware,
  register: registerErrorHandler
};
