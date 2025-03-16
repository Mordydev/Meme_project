/**
 * Manual update challenge progress (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

interface UpdateChallengeProgressBody {
  activity: {
    type: string;
    metadata?: Record<string, any>;
  };
}

export async function updateChallengeProgress(
  request: FastifyRequest<{
    Params: {
      userId: string;
      challengeId: string;
    },
    Body: UpdateChallengeProgressBody;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId, challengeId } = request.params;
    const { activity } = request.body;
    
    // Validate request body
    if (!activity || !activity.type) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Activity type is required'
      });
    }
    
    // Get challenge service
    const challengeService = request.diContainer.resolve('challengeService');
    
    // Check if challenge exists
    const challenge = await challengeService.getChallenge(challengeId);
    
    if (!challenge) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Challenge with ID ${challengeId} not found`
      });
    }
    
    // Check if user is participating in challenge
    const userChallenges = await challengeService.getUserChallenges(userId);
    const isParticipating = userChallenges.some(uc => uc.challenge_id === challengeId);
    
    if (!isParticipating) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `User ${userId} is not participating in challenge ${challengeId}`
      });
    }
    
    // Update progress
    const result = await challengeService.updateChallengeProgress({
      userId,
      type: activity.type,
      activityId: challengeId,
      metadata: activity.metadata
    });
    
    // Return result
    return reply.code(200).send({
      data: {
        ...result,
        userId,
        challengeId
      }
    });
  } catch (error) {
    logger.error('Error updating challenge progress', { 
      error, 
      userId: request.params.userId, 
      challengeId: request.params.challengeId,
      body: request.body 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while updating challenge progress'
    });
  }
}
