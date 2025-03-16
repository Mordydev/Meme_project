/**
 * Reset user level (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function resetUserLevel(
  request: FastifyRequest<{
    Params: {
      userId: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    
    // Get level service
    const levelService = request.diContainer.resolve('levelService');
    
    // Reset user level
    const success = await levelService.resetUserLevel(userId);
    
    if (!success) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `User ${userId} not found or has no level data`
      });
    }
    
    // Return success
    return reply.code(200).send({
      data: {
        success: true,
        message: `User ${userId} level has been reset to 1`
      }
    });
  } catch (error) {
    logger.error('Error resetting user level', { 
      error, 
      userId: request.params.userId 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while resetting user level'
    });
  }
}
