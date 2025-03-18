/**
 * Logging Plugin
 * 
 * Provides structured logging middleware for Fastify
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';
import { logger, LogContext } from '../lib/logger';
import { incrementCounter, observeHistogram } from '../monitoring/metrics';

/**
 * Fastify plugin for structured logging
 */
export const loggingPlugin = fp(async function (fastify: FastifyInstance) {
  // Add request logging hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Create unique request ID if not already set
    if (!request.id) {
      request.id = uuidv4();
    }
    
    // Extract correlation ID from header or generate new one
    const correlationId = 
      request.headers['x-correlation-id'] as string || 
      request.headers['x-request-id'] as string || 
      uuidv4();
    
    // Add correlation ID to response headers
    reply.header('x-correlation-id', correlationId);
    
    // Create request context
    const context: LogContext = {
      requestId: request.id,
      correlationId,
      method: request.method,
      path: request.routerPath || request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    };
    
    // Create child logger with request context
    const requestLogger = logger.child(context);
    
    // Attach logger to request
    request.log = requestLogger;
    
    // Track request start time
    request.startTime = performance.now();
    
    // Log request
    requestLogger.info(`Request started: ${request.method} ${request.url}`);
    
    // Increment request counter
    incrementCounter('http_requests_total', {
      method: request.method,
      route: request.routerPath || 'unknown',
      status_code: 'pending'
    });
  });
  
  // Add response logging hook
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Calculate request duration
    const requestDuration = performance.now() - (request.startTime || 0);
    
    // Request context
    const context: LogContext = {
      requestId: request.id,
      statusCode: reply.statusCode,
      responseTime: requestDuration.toFixed(2),
      contentLength: reply.getHeader('content-length') || 0
    };
    
    // Log response
    const message = `Request completed: ${request.method} ${request.url} ${reply.statusCode}`;
    
    if (reply.statusCode >= 500) {
      request.log.error(context, message);
    } else if (reply.statusCode >= 400) {
      request.log.warn(context, message);
    } else {
      request.log.info(context, message);
    }
    
    // Record request duration
    observeHistogram('http_request_duration_seconds', requestDuration / 1000, {
      method: request.method,
      route: request.routerPath || 'unknown',
      status_code: reply.statusCode.toString()
    });
    
    // Update request counter with final status
    incrementCounter('http_requests_total', {
      method: request.method,
      route: request.routerPath || 'unknown',
      status_code: reply.statusCode.toString()
    });
    
    // Log slow requests (over 1 second)
    if (requestDuration > 1000) {
      request.log.warn({
        ...context,
        message: 'Slow request detected'
      });
    }
  });
  
  // Add error logging hook
  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    const context: LogContext = {
      requestId: request.id,
      statusCode: reply.statusCode,
      path: request.routerPath || request.url,
      method: request.method
    };
    
    // Log error
    request.log.error({
      ...context,
      error,
      stack: error.stack
    }, `Request error: ${error.message}`);
  });
  
  fastify.log.info('Logging plugin registered');
});

/**
 * Extend FastifyRequest type
 */
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}
