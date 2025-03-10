import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth';

/**
 * Schema for vote for entry request
 */
const schema = {
  params: {
    type: 'object',
    required: ['entryId'],
    properties: {
      entryId: { type: 'string', description: 'Entry ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

/**
 * Vote for a battle entry
 */
export default async function (fastify: FastifyInstance) {
  fastify.post('/api/battles/entries/:entryId/vote', {
    schema,
    preHandler: authenticate
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { entryId } = request.params as { entryId: string };
    
    const battleService = fastify.services.battleService;
    
    // Submit vote
    await battleService.voteForEntry(entryId, request.userId);
    
    // Return success response
    return reply.send({
      success: true,
      message: 'Vote recorded successfully'
    });
  });
}
