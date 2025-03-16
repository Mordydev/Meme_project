/**
 * Update equipped badges
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

interface UpdateEquippedBadgesBody {
  badgeIds: string[];
}

export async function updateEquippedBadges(
  request: FastifyRequest<{
    Params: {
      userId: string;
    },
    Body: UpdateEquippedBadgesBody;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    const { badgeIds } = request.body;
    
    // Check permissions - users can only update their own equipped badges
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to update this user\'s equipped badges'
      });
    }
    
    // Validate request body
    if (!Array.isArray(badgeIds)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'badgeIds must be an array'
      });
    }
    
    // Limit number of equipped badges
    const MAX_EQUIPPED_BADGES = 5;
    if (badgeIds.length > MAX_EQUIPPED_BADGES) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Maximum of ${MAX_EQUIPPED_BADGES} badges can be equipped`
      });
    }
    
    // Get badge service
    const badgeService = request.diContainer.resolve('badgeService');
    
    // Verify all badges exist and belong to the user
    const userBadges = await badgeService.getUserBadges(userId);
    const userBadgeIds = userBadges.map(badge => badge.badge_id);
    
    const invalidBadges = badgeIds.filter(id => !userBadgeIds.includes(id));
    if (invalidBadges.length > 0) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Some badges do not exist or do not belong to this user: ${invalidBadges.join(', ')}`
      });
    }
    
    // Update equipped badges
    const updatedCount = await badgeService.updateEquippedBadges(userId, badgeIds);
    
    // Return result
    return reply.code(200).send({
      data: {
        success: true,
        updatedCount,
        equippedBadges: badgeIds
      }
    });
  } catch (error) {
    logger.error('Error updating equipped badges', { 
      error, 
      userId: request.params.userId, 
      body: request.body 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while updating equipped badges'
    });
  }
}
