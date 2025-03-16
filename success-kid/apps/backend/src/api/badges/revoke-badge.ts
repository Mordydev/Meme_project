/**
 * Revoke badge from user (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function revokeBadge(
  request: FastifyRequest<{
    Params: {
      userId: string;
      badgeId: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId, badgeId } = request.params;
    
    // Get badge service
    const badgeService = request.diContainer.resolve('badgeService');
    
    // Check if badge exists
    const badge = await badgeService.getBadge(badgeId);
    
    if (!badge) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Badge with ID ${badgeId} not found`
      });
    }
    
    // Check if user has the badge
    const userBadges = await badgeService.getUserBadges(userId);
    const hasBadge = userBadges.some(userBadge => userBadge.badge_id === badgeId);
    
    if (!hasBadge) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `User ${userId} does not have badge ${badgeId}`
      });
    }
    
    // Revoke badge
    const success = await badgeService.revokeBadge(userId, badgeId);
    
    if (!success) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to revoke badge'
      });
    }
    
    // Return success
    return reply.code(200).send({
      data: {
        success: true,
        message: `Badge ${badgeId} has been revoked from user ${userId}`
      }
    });
  } catch (error) {
    logger.error('Error revoking badge', { 
      error, 
      userId: request.params.userId, 
      badgeId: request.params.badgeId 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while revoking the badge'
    });
  }
}
