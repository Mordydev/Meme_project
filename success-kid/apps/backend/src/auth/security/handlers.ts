import { FastifyRequest, FastifyReply } from 'fastify';
import { securityAuditService } from './audit-service';
import { logger } from '../../lib/logger';
import { UnauthorizedError, ForbiddenError } from '../../lib/errors';

/**
 * Handler to get a user's authentication history
 */
export async function getUserAuthHistoryHandler(
  request: FastifyRequest<{
    Params: { userId: string };
    Querystring: { limit?: number };
  }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const { userId } = request.params;
    const { limit = 20 } = request.query;
    
    // Security check: Users can only see their own history unless they are admins
    if (userId !== request.user.id && request.user.role !== 'admin') {
      throw new ForbiddenError('Cannot access another user\'s authentication history');
    }
    
    // Get auth events
    const events = await securityAuditService.getUserAuthEvents(userId, limit);
    
    return {
      data: {
        events
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error getting user auth history', { error });
    
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    
    throw new Error('Failed to retrieve authentication history');
  }
}

/**
 * Handler to get suspicious activity events (admin only)
 */
export async function getSuspiciousActivityHandler(
  request: FastifyRequest<{
    Querystring: { limit?: number };
  }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Only admins can access this endpoint
    if (request.user.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }
    
    const { limit = 50 } = request.query;
    
    // Get suspicious events
    const events = await securityAuditService.getSuspiciousEvents(limit);
    
    return {
      data: {
        events
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error getting suspicious activity', { error });
    
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    
    throw new Error('Failed to retrieve suspicious activity');
  }
}
