/**
 * Get challenge completion details
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getChallengeCompletion(
  request: FastifyRequest<{
    Params: {
      userId: string;
      challengeId: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId, challengeId } = request.params;
    
    // Check permissions - users can only see their own completion details unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s challenge completion'
      });
    }
    
    // Get challenge service
    const challengeService = request.diContainer.resolve('challengeService');
    
    // Get completion details
    const completion = await challengeService.getChallengeCompletion(userId, challengeId);
    
    if (!completion) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Challenge completion for challenge ${challengeId} not found for user ${userId}`
      });
    }
    
    // Return completion details
    return reply.code(200).send({
      data: completion
    });
  } catch (error) {
    logger.error('Error getting challenge completion', { 
      error, 
      userId: request.params.userId, 
      challengeId: request.params.challengeId 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching challenge completion'
    });
  }
}
