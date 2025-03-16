/**
 * Get badge by ID
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getBadgeById(
  request: FastifyRequest<{
    Params: {
      id: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    
    // Get badge service
    const badgeService = request.diContainer.resolve('badgeService');
    
    // Get badge by ID
    const badge = await badgeService.getBadge(id);
    
    if (!badge) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Badge with ID ${id} not found`
      });
    }
    
    // Return badge
    return reply.code(200).send({
      data: badge
    });
  } catch (error) {
    logger.error('Error getting badge by ID', { error, id: request.params.id });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the badge'
    });
  }
}
