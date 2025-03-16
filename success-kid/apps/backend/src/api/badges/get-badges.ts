/**
 * Get all badges
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { BadgeCategory, BadgeTier } from '../../models/badge';

export async function getBadges(
  request: FastifyRequest<{
    Querystring: {
      category?: string;
      tier?: string;
      search?: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { category, tier, search } = request.query;
    
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
    
    // Get badges with optional filters
    const badges = await badgeService.getBadges({
      category: category as BadgeCategory,
      tier: tier as BadgeTier,
      search
    });
    
    // Return badges
    return reply.code(200).send({
      data: badges,
      meta: {
        total: badges.length,
        categories: [...new Set(badges.map(b => b.category))],
        tiers: [...new Set(badges.map(b => b.tier))]
      }
    });
  } catch (error) {
    logger.error('Error getting badges', { error, query: request.query });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching badges'
    });
  }
}
