/**
 * Join challenge
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function joinChallenge(
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
    
    // Check permissions - users can only join challenges for themselves unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to join challenges for this user'
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
    
    // Check if user already joined this challenge
    const userChallenges = await challengeService.getUserChallenges(userId);
    const alreadyJoined = userChallenges.some(uc => uc.challenge_id === challengeId);
    
    if (alreadyJoined) {
      return reply.code(409).send({
        error: 'Conflict',
        message: `User ${userId} has already joined challenge ${challengeId}`
      });
    }
    
    // Join challenge
    const result = await challengeService.joinChallenge(userId, challengeId);
    
    // Return result
    return reply.code(200).send({
      data: {
        success: true,
        joinedAt: result.joined_at,
        userId,
        challengeId,
        challengeTitle: challenge.title
      }
    });
  } catch (error) {
    logger.error('Error joining challenge', { 
      error, 
      userId: request.params.userId, 
      challengeId: request.params.challengeId 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while joining the challenge'
    });
  }
}
