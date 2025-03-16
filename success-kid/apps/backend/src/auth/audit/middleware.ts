/**
 * Audit Logging Middleware
 * 
 * Middleware for logging authentication and authorization events
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from './service';
import { AuditEventType, AuditSeverity } from './events';
import { logger } from '../../lib/logger';

/**
 * Options for audit logging middleware
 */
export interface AuditOptions {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  includeBody?: boolean;
  includeHeaders?: boolean;
  includeParams?: boolean;
  includeQuery?: boolean;
  skipSuccessful?: boolean;
  skipFailed?: boolean;
  extractMetadata?: (request: FastifyRequest, reply: FastifyReply) => Record<string, any>;
}

/**
 * Create audit logging middleware
 */
export function createAuditMiddleware(options: AuditOptions) {
  const {
    eventType,
    severity,
    includeBody = false,
    includeHeaders = false,
    includeParams = true,
    includeQuery = true,
    skipSuccessful = false,
    skipFailed = false,
    extractMetadata
  } = options;
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Capture request data before processing
    const requestData = {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: request.user?.id,
      sessionId: (request as any).session?.id,
      organizationId: request.headers['x-organization-id'] as string
    };
    
    // Prepare metadata
    const metadata: Record<string, any> = {};
    
    if (includeParams) {
      metadata.params = request.params;
    }
    
    if (includeQuery) {
      metadata.query = request.query;
    }
    
    if (includeHeaders) {
      // Filter out sensitive headers
      const filteredHeaders = { ...request.headers };
      delete filteredHeaders.authorization;
      delete filteredHeaders.cookie;
      metadata.headers = filteredHeaders;
    }
    
    if (includeBody && request.body) {
      // Filter out sensitive fields
      const filteredBody = { ...request.body as Record<string, any> };
      delete filteredBody.password;
      delete filteredBody.token;
      delete filteredBody.accessToken;
      delete filteredBody.refreshToken;
      metadata.body = filteredBody;
    }
    
    // Add custom metadata if provided
    if (extractMetadata) {
      try {
        const customMetadata = extractMetadata(request, reply);
        Object.assign(metadata, customMetadata);
      } catch (error) {
        logger.error('Error extracting custom metadata', { error });
      }
    }
    
    // Log after response using reply.send hook
    reply.addHook('onSend', async (request, reply, payload) => {
      try {
        const status = reply.statusCode;
        const isSuccess = status >= 200 && status < 400;
        
        // Skip logging based on options
        if ((isSuccess && skipSuccessful) || (!isSuccess && skipFailed)) {
          return;
        }
        
        // Add response status to metadata
        metadata.responseStatus = status;
        
        // Log the audit event
        await auditService.logEvent({
          type: eventType,
          userId: requestData.userId,
          sessionId: requestData.sessionId,
          organizationId: requestData.organizationId,
          ip: requestData.ip,
          userAgent: requestData.userAgent,
          severity,
          metadata
        });
      } catch (error) {
        // Don't block the response for logging errors
        logger.error('Audit logging error', { error });
      }
    });
  };
}

/**
 * Audit middleware for authentication attempts
 */
export const authenticationAuditMiddleware = createAuditMiddleware({
  eventType: AuditEventType.USER_LOGIN,
  includeBody: false,
  includeHeaders: false,
  extractMetadata: (request, reply) => ({
    authProvider: (request.body as any)?.authProvider,
    success: reply.statusCode < 400
  })
});

/**
 * Audit middleware for user registration
 */
export const registrationAuditMiddleware = createAuditMiddleware({
  eventType: AuditEventType.USER_REGISTERED,
  includeBody: true,
  extractMetadata: (request) => ({
    email: (request.body as any)?.email
  })
});

/**
 * Audit middleware for password resets
 */
export const passwordResetAuditMiddleware = createAuditMiddleware({
  eventType: AuditEventType.PASSWORD_RESET_REQUESTED,
  severity: AuditSeverity.WARNING,
  includeBody: true,
  extractMetadata: (request) => ({
    email: (request.body as any)?.email
  })
});

/**
 * Audit middleware for access denied events
 */
export const accessDeniedAuditMiddleware = createAuditMiddleware({
  eventType: AuditEventType.ACCESS_DENIED,
  severity: AuditSeverity.WARNING,
  includeParams: true,
  includeQuery: true,
  extractMetadata: (request) => ({
    resource: (request as any).resource,
    action: (request as any).action
  })
});

/**
 * Audit middleware for admin actions
 */
export const adminActionAuditMiddleware = createAuditMiddleware({
  eventType: AuditEventType.ADMIN_ACTION,
  severity: AuditSeverity.WARNING,
  includeBody: true,
  includeParams: true,
  extractMetadata: (request) => ({
    action: (request as any).adminAction,
    targetUserId: (request.params as any)?.userId || (request.body as any)?.userId
  })
});
