/**
 * Get user XP history
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getUserXPHistory(
  request: FastifyRequest<{
    Params: {
      userId: string;
    },
    Querystring: {
      limit?: string;
      offset?: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
    const offset = request.query.offset ? parseInt(request.query.offset, 10) : 0;
    
    // Check permissions - users can only see their own XP history unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s XP history'
      });
    }
    
    // Validate pagination params
    if (isNaN(limit) || limit < 1 || limit > 100 || isNaN(offset) || offset < 0) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid pagination parameters'
      });
    }
    
    // Get level service
    const levelService = request.diContainer.resolve('levelService');
    
    // Get XP history
    const xpHistory = await levelService.getUserXPHistory(userId, { limit, offset });
    
    // Return XP history
    return reply.code(200).send({
      data: xpHistory.transactions,
      meta: {
        total: xpHistory.total,
        limit,
        offset,
        hasMore: xpHistory.total > offset + limit
      }
    });
  } catch (error) {
    logger.error('Error getting user XP history', { 
      error, 
      userId: request.params.userId 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user XP history'
    });
  }
}
