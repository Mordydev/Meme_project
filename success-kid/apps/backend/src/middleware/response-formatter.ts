/**
 * Response Formatter Middleware
 * 
 * Ensures all API responses follow a consistent format according to our standards
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '@success-kid/api-types';

/**
 * Options for the response formatter middleware
 */
export interface ResponseFormatterOptions {
  /**
   * Whether to wrap all responses (true) or only unwrapped ones (false)
   */
  wrapAll?: boolean;
  
  /**
   * Function to generate additional metadata
   */
  metaGenerator?: (request: FastifyRequest) => Record<string, any>;
}

/**
 * Default response formatter options
 */
const defaultOptions: ResponseFormatterOptions = {
  wrapAll: false,
  metaGenerator: () => ({})
};

/**
 * Middleware to ensure all responses follow the standardized format
 */
export async function responseFormatterMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  options: ResponseFormatterOptions = {}
): Promise<void> {
  // Merge options with defaults
  const config = { ...defaultOptions, ...options };
  
  // Store original send function to intercept
  const originalSend = reply.send;
  
  // Override send function to format responses
  reply.send = function(payload: any) {
    // Skip formatting for non-JSON responses or if already formatted
    if (
      reply.getHeader('content-type')?.toString().includes('text/html') ||
      reply.getHeader('content-type')?.toString().includes('application/octet-stream') ||
      reply.getHeader('content-type')?.toString().includes('text/plain') ||
      reply.getHeader('content-type')?.toString().includes('application/pdf') ||
      reply.getHeader('content-type')?.toString().includes('image/')
    ) {
      return originalSend.call(this, payload);
    }
    
    // Don't reformat if payload is already in our standard format
    // or if it's explicitly set to not wrap and payload is not an error
    if (
      (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) ||
      (!config.wrapAll && 
       reply.statusCode >= 200 && 
       reply.statusCode < 400 && 
       !('errors' in (payload || {})))
    ) {
      return originalSend.call(this, payload);
    }
    
    // Format error responses
    if (reply.statusCode >= 400 || (payload && typeof payload === 'object' && 'errors' in payload)) {
      // Extract errors from payload or create default error
      const errors = payload && typeof payload === 'object' && payload.errors 
        ? payload.errors 
        : [{
            code: 'ERROR',
            message: payload?.message || 'An error occurred',
            details: payload?.details
          }];
      
      // Create formatted error response
      const errorResponse: ApiResponse = {
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id as string,
          ...config.metaGenerator(request)
        },
        errors
      };
      
      return originalSend.call(this, errorResponse);
    }
    
    // Format success responses
    const successResponse: ApiResponse = {
      data: payload,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id as string,
        ...config.metaGenerator(request)
      }
    };
    
    return originalSend.call(this, successResponse);
  };
}

/**
 * Register the response formatter middleware with Fastify
 */
export function registerResponseFormatter(
  fastify: any,
  options: ResponseFormatterOptions = {}
): void {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    await responseFormatterMiddleware(request, reply, options);
  });
}

export default {
  middleware: responseFormatterMiddleware,
  register: registerResponseFormatter,
};
