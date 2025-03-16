/**
 * Get user challenges
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { ChallengeStatus } from '../../models/challenge';

export async function getUserChallenges(
  request: FastifyRequest<{
    Params: {
      userId: string;
    },
    Querystring: {
      status?: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    const { status } = request.query;
    
    // Check permissions - users can only see their own challenges unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s challenges'
      });
    }
    
    // Validate status if provided
    if (status && !Object.values(ChallengeStatus).includes(status as ChallengeStatus)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Invalid status: ${status}`
      });
    }
    
    // Get challenge service
    const challengeService = request.diContainer.resolve('challengeService');
    
    // Get user challenges with optional status filter
    const challenges = await challengeService.getUserChallenges(
      userId,
      status as ChallengeStatus
    );
    
    // Return challenges
    return reply.code(200).send({
      data: challenges,
      meta: {
        total: challenges.length,
        userId,
        inProgressCount: challenges.filter(c => c.status === ChallengeStatus.IN_PROGRESS).length,
        completedCount: challenges.filter(c => c.status === ChallengeStatus.COMPLETED).length
      }
    });
  } catch (error) {
    logger.error('Error getting user challenges', { 
      error, 
      userId: request.params.userId, 
      status: request.query.status 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user challenges'
    });
  }
}
