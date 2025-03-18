/**
 * Error Tracking Module
 * 
 * Centralized error tracking and reporting
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import ErrorTracker, { ErrorEvent, ErrorSeverity, ErrorSource } from './error-tracker';
import { logger } from '../../lib/logger';

export { ErrorTracker, ErrorEvent, ErrorSeverity, ErrorSource };

/**
 * Set up error tracking and reporting
 */
export function setupErrorTracking(fastify: FastifyInstance): void {
  // Register error tracking routes
  fastify.get('/monitoring/errors', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      // Get errors based on query parameters
      const { type, limit } = request.query as any;
      
      let errors;
      const limitNumber = parseInt(limit, 10) || 50;
      
      if (type === 'frequent') {
        errors = ErrorTracker.getMostFrequentErrors(limitNumber);
      } else if (type === 'counts') {
        errors = ErrorTracker.getErrorCounts();
      } else {
        errors = ErrorTracker.getRecentErrors(limitNumber);
      }
      
      return {
        errors,
        timestamp: new Date().toISOString()
      };
    }
  });
  
  // Route to receive client-side errors
  fastify.post('/monitoring/errors/client', {
    schema: {
      hide: true, // Hide from Swagger docs
    },
    handler: async (request, reply) => {
      try {
        // Track client error
        const errorData = request.body as any;
        const errorEvent = ErrorTracker.trackClientError(errorData);
        
        return {
          success: true,
          errorId: errorEvent.id
        };
      } catch (error) {
        logger.error('Error processing client error report', { error });
        
        return {
          success: false,
          message: 'Failed to process error report'
        };
      }
    }
  });
  
  // Add error tracking hook
  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    // Track server error
    ErrorTracker.trackError(error, {
      requestId: request.id,
      path: request.routerPath || request.url,
      method: request.method,
      userId: (request as any).user?.id,
      sessionId: (request as any).sessionId,
      userAgent: request.headers['user-agent'],
    });
  });
  
  // Clean up error tracker on server shutdown
  fastify.addHook('onClose', async () => {
    // Perform any cleanup needed
  });
  
  logger.info('Error tracking system initialized');
}

// Export main tracker instance
export default ErrorTracker;
