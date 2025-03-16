/**
 * Get active challenges
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { ChallengeStatus, ChallengeDifficulty } from '../../models/challenge';

export async function getActiveChallenges(
  request: FastifyRequest<{
    Querystring: {
      status?: string;
      difficulty?: string;
      category?: string;
      search?: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { status, difficulty, category, search } = request.query;
    
    // Validate status if provided
    if (status && !Object.values(ChallengeStatus).includes(status as ChallengeStatus)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Invalid status: ${status}`
      });
    }
    
    // Validate difficulty if provided
    if (difficulty && !Object.values(ChallengeDifficulty).includes(difficulty as ChallengeDifficulty)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Invalid difficulty: ${difficulty}`
      });
    }
    
    // Get challenge service
    const challengeService = request.diContainer.resolve('challengeService');
    
    // Get challenges with optional filters
    const challenges = await challengeService.getActiveChallenges({
      status: status as ChallengeStatus,
      difficulty: difficulty as ChallengeDifficulty,
      category,
      search
    });
    
    // Return challenges
    return reply.code(200).send({
      data: challenges,
      meta: {
        total: challenges.length,
        categories: [...new Set(challenges.map(c => c.category))],
        difficulties: [...new Set(challenges.map(c => c.difficulty))]
      }
    });
  } catch (error) {
    logger.error('Error getting active challenges', { error, query: request.query });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching challenges'
    });
  }
}
