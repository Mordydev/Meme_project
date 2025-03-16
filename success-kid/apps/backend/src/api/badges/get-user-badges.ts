/**
 * Get user badges
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { BadgeCategory, BadgeTier } from '../../models/badge';

export async function getUserBadges(
  request: FastifyRequest<{
    Params: {
      userId: string;
    },
    Querystring: {
      category?: string;
      tier?: string;
      equipped?: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    const { category, tier, equipped } = request.query;
    
    // Check permissions - users can only see their own badges unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s badges'
      });
    }
    
    // Validate category if provided
    if (category && !Object.values(BadgeCategory).includes(category as BadgeCategory)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Invalid category: ${category}`
      });
    }
    
    // Validate tier if provided
    if (tier && !Object.values(BadgeTier).includes(tier as BadgeTier)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Invalid tier: ${tier}`
      });
    }
    
    // Get badge service
    const badgeService = request.diContainer.resolve('badgeService');
    
    // Get user badges
    let badges = await badgeService.getUserBadges(userId, {
      category: category as BadgeCategory,
      tier: tier as BadgeTier
    });
    
    // Filter by equipped status if specified
    if (equipped === 'true') {
      badges = badges.filter(b => b.equipped);
    } else if (equipped === 'false') {
      badges = badges.filter(b => !b.equipped);
    }
    
    // Return badges
    return reply.code(200).send({
      data: badges,
      meta: {
        total: badges.length,
        userId,
        equippedCount: badges.filter(b => b.equipped).length
      }
    });
  } catch (error) {
    logger.error('Error getting user badges', { 
      error, 
      userId: request.params.userId, 
      query: request.query 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user badges'
    });
  }
}
