/**
 * Get challenge by ID
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getChallengeById(
  request: FastifyRequest<{
    Params: {
      id: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    
    // Get challenge service
    const challengeService = request.diContainer.resolve('challengeService');
    
    // Get challenge by ID
    const challenge = await challengeService.getChallenge(id);
    
    if (!challenge) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Challenge with ID ${id} not found`
      });
    }
    
    // Return challenge
    return reply.code(200).send({
      data: challenge
    });
  } catch (error) {
    logger.error('Error getting challenge by ID', { error, id: request.params.id });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the challenge'
    });
  }
}
