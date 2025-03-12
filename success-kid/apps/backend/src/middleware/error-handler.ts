import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors';
import { sendError } from '../lib/response';

/**
 * Global error handler for Fastify
 * 
 * @param error The error that occurred
 * @param request The Fastify request object
 * @param reply The Fastify reply object
 */
export function errorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);
  
  // Handle Fastify validation errors
  if (error.validation) {
    return sendError(
      reply,
      [{
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.validation
      }],
      400
    );
  }
  
  // Handle application-specific errors
  if (error instanceof AppError) {
    return sendError(
      reply,
      [{
        code: error.code,
        message: error.message,
        details: error.details
      }],
      error.statusCode
    );
  }
  
  // Handle unknown errors
  const isDev = process.env.NODE_ENV === 'development';
  return sendError(
    reply,
    [{
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: isDev ? error.message : undefined
    }],
    500
  );
}