import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Handler for getting community guidelines
 */
export async function getCommunityGuidelinesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get moderation service
    const moderationService = request.diScope.resolve('moderationService');
    
    // Get community guidelines
    const guidelines = await moderationService.getCommunityGuidelines();
    
    return reply.code(200).send({
      data: guidelines
    });
  } catch (error) {
    request.log.error(error, 'Error fetching community guidelines');
    
    // Handle error
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching community guidelines',
      },
    });
  }
}
