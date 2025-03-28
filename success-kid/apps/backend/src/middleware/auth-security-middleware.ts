import { FastifyRequest, FastifyReply } from 'fastify';
import { securityAuditService, AuthEvent } from './audit-service';
import { logger } from '../../lib/logger';
import { RateLimitExceededError } from '../../lib/errors';

/**
 * Middleware to log authentication requests
 */
export function authAuditMiddleware(event: AuthEvent) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Extract basic information from request
      const data = {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        method: request.method,
        url: request.url,
        userId: request.user?.id,
        requestId: request.id
      };
      
      // Log the auth event
      await securityAuditService.logAuthEvent(event, data, request);
    } catch (error) {
      // Log but don't fail the request
      logger.error('Auth audit logging failed', { event, error });
    }
  };
}

/**
 * Middleware to detect suspicious authentication activity
 */
export async function suspiciousActivityMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Only check for authenticated requests
    if (!request.user) return;
    
    // Detect suspicious activity
    const result = await securityAuditService.detectSuspiciousActivity(
      request.user.id,
      request.ip,
      request.headers['user-agent']
    );
    
    // If suspicious, log and potentially take action
    if (result.suspicious) {
      await securityAuditService.logAuthEvent(
        AuthEvent.SUSPICIOUS_ACTIVITY, 
        {
          userId: request.user.id,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          reason: result.reason,
          requestId: request.id
        },
        request
      );
      
      // For high-risk operations, you might want to block the request
      // This will depend on your security policy
      const highRiskOperations = [
        '/api/auth/password-reset',
        '/api/admin/',
        '/api/auth/role/change'
      ];
      
      if (highRiskOperations.some(op => request.url.includes(op))) {
        throw new RateLimitExceededError(
          'This action has been blocked due to suspicious activity. Please contact support.'
        );
      }
      
      // For other operations, we might add additional verification but still allow the request
      request.suspicious = true;
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      throw error;
    }
    
    // Log but don't fail the request for other errors
    logger.error('Suspicious activity detection failed', { error });
  }
}

// Type augmentation for FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    suspicious?: boolean;
  }
}
