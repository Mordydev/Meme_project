/**
 * Logging middleware for Fastify
 * 
 * Configures logging for the application and sets up request-scoped loggers.
 */
import { FastifyInstance } from 'fastify';
import { createRequestLoggingMiddleware } from '@/lib/logging';
import { logger } from '@/lib/logging/logger';

/**
 * Register logging middleware with Fastify
 * 
 * @param fastify Fastify instance
 */
export function registerLoggingMiddleware(fastify: FastifyInstance): void {
  // Create and register request logging middleware
  const requestLogger = createRequestLoggingMiddleware();
  fastify.addHook('onRequest', requestLogger);
  
  // Decorate fastify with logger
  fastify.decorate('logger', logger);
  
  // Log all uncaught errors for routes
  fastify.addHook('onError', (request, reply, error, done) => {
    const routeLogger = (request as any).log || logger;
    
    // Different logging based on error status code
    if (reply.statusCode >= 500) {
      routeLogger.error({ 
        msg: 'Uncaught error in route handler',
        error,
        stack: error.stack,
        route: request.routerPath,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode
      });
    } else if (reply.statusCode >= 400) {
      routeLogger.warn({
        msg: 'Request error',
        error: error.message,
        route: request.routerPath,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode
      });
    }
    
    done();
  });
  
  // Log when server starts
  fastify.addHook('onReady', () => {
    logger.info({
      msg: 'Server ready',
      address: fastify.server.address(),
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version
    });
  });
  
  // Log when server stops
  fastify.addHook('onClose', (instance, done) => {
    logger.info({ msg: 'Server shutting down' });
    done();
  });
}

export default {
  register: registerLoggingMiddleware
};