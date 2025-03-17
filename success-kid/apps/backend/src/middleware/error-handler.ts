/**
 * Global error handler middleware for Fastify
 */
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/base-error';
import { handleApiError } from '../errors/handlers';

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
  return handleApiError(request, reply, error);
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
