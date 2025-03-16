/**
 * Award XP to a user (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

interface AwardXPBody {
  amount: number;
  source: string;
  referenceId?: string;
  description?: string;
}

export async function awardXP(
  request: FastifyRequest<{
    Params: {
      userId: string;
    },
    Body: AwardXPBody;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    const { amount, source, referenceId, description } = request.body;
    
    // Validate request body
    if (!amount || !source) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Amount and source are required'
      });
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Amount must be a positive number'
      });
    }
    
    // Get level service
    const levelService = request.diContainer.resolve('levelService');
    
    // Award XP
    const result = await levelService.addXP({
      userId,
      amount,
      source,
      referenceId,
      description
    });
    
    // Return result
    return reply.code(200).send({
      data: {
        ...result,
        userId
      }
    });
  } catch (error) {
    logger.error('Error awarding XP', { 
      error, 
      userId: request.params.userId,
      body: request.body
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while awarding XP'
    });
  }
}
