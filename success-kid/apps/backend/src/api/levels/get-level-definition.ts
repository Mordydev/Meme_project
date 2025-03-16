/**
 * Get level definition by level number
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getLevelDefinition(
  request: FastifyRequest<{
    Params: {
      level: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // Parse level number
    const levelNumber = parseInt(request.params.level, 10);
    
    if (isNaN(levelNumber) || levelNumber < 1) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Level must be a positive integer'
      });
    }
    
    // Get level service
    const levelService = request.diContainer.resolve('levelService');
    
    // Get level definition
    const level = await levelService.getLevelDefinition(levelNumber);
    
    if (!level) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Level ${levelNumber} not found`
      });
    }
    
    // Return level definition
    return reply.code(200).send({
      data: level
    });
  } catch (error) {
    logger.error('Error getting level definition', { 
      error, 
      level: request.params.level 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching level definition'
    });
  }
}
