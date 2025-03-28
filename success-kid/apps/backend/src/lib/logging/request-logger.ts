/**
 * Request logging middleware for Fastify
 * 
 * Provides structured logging for HTTP requests with performance metrics
 * and appropriate context.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { createChildLogger, logger } from './logger';
import { monitoringService } from '@/monitoring/service';

// Skip logging for these paths
const SKIP_PATHS = [
  '/health',
  '/health/live',
  '/health/ready',
  '/metrics',
];

// Don't log request bodies for these content types
const SKIP_BODY_CONTENT_TYPES = [
  'multipart/form-data',
  'application/octet-stream',
  'image/',
  'video/',
  'audio/',
];

/**
 * Redact sensitive information from request logs
 * 
 * @param headers Request headers
 * @returns Redacted headers
 */
function redactSensitiveHeaders(headers: Record<string, any>): Record<string, any> {
  const result = { ...headers };
  
  // Redact common sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
  ];
  
  sensitiveHeaders.forEach(header => {
    if (header in result) {
      result[header] = '[REDACTED]';
    }
  });
  
  return result;
}

/**
 * Determine if request body should be logged
 * 
 * @param request Fastify request
 * @returns Whether to log the request body
 */
function shouldLogBody(request: FastifyRequest): boolean {
  const contentType = request.headers['content-type'] || '';
  
  // Skip binary content types
  if (SKIP_BODY_CONTENT_TYPES.some(type => contentType.includes(type))) {
    return false;
  }
  
  return true;
}

/**
 * Create request logging middleware
 * 
 * @returns Fastify middleware function
 */
export function createRequestLoggingMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip certain paths
    if (SKIP_PATHS.some(path => request.url.startsWith(path))) {
      return;
    }
    
    // Generate a request ID if not present
    const requestId = request.id || randomUUID();
    
    // Store the start time for performance metrics
    const startTime = process.hrtime();
    
    // Create a child logger with request context
    const requestLogger = createChildLogger(logger, {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.id,
    });
    
    // Attach logger to request for use in route handlers
    (request as any).log = requestLogger;
    
    // Log incoming request
    if (process.env.NODE_ENV !== 'production') {
      // Development: log detailed request information
      requestLogger.debug({
        msg: 'Request received',
        request: {
          method: request.method,
          url: request.url,
          path: request.routerPath,
          parameters: request.params,
          query: request.query,
          headers: redactSensitiveHeaders(request.headers),
          body: shouldLogBody(request) ? request.body : '[SKIPPED]',
        },
      });
    } else {
      // Production: log minimal information
      requestLogger.info({
        msg: 'Request received',
        method: request.method,
        url: request.url,
        path: request.routerPath,
      });
    }
    
    // Add response hook to log when complete
    reply.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
      // Calculate response time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
      
      // Only log response body in development and if it's not too large
      let responseBody;
      if (process.env.NODE_ENV !== 'production' && 
          typeof payload === 'string' && 
          payload.length < 10000) {
        try {
          responseBody = JSON.parse(payload);
        } catch (e) {
          // If not valid JSON, use a snippet
          responseBody = payload.length > 200 
            ? payload.substring(0, 200) + '...' 
            : payload;
        }
      }
      
      // Record metrics
      monitoringService.recordMetric('http.request_duration', responseTimeMs, {
        method: request.method,
        route: request.routerPath || request.url,
        status: String(reply.statusCode)
      });
      
      // Log response
      const logLevel = reply.statusCode >= 500 
        ? 'error' 
        : reply.statusCode >= 400 
          ? 'warn' 
          : 'info';
      
      requestLogger[logLevel]({
        msg: 'Request completed',
        responseTime: responseTimeMs,
        response: {
          statusCode: reply.statusCode,
          headers: redactSensitiveHeaders(reply.getHeaders()),
          body: responseBody,
        },
      });
      
      return payload;
    });
  };
}

export default createRequestLoggingMiddleware;