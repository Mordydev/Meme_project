/**
 * Get all level definitions
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getLevels(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get level service
    const levelService = request.diContainer.resolve('levelService');
    
    // Get all levels
    const levels = await levelService.getLevels();
    
    // Return levels
    return reply.code(200).send({
      data: levels,
      meta: {
        total: levels.length,
        maxLevel: levels.length > 0 ? Math.max(...levels.map(l => l.level)) : 0
      }
    });
  } catch (error) {
    logger.error('Error getting levels', { error });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching level definitions'
    });
  }
}
