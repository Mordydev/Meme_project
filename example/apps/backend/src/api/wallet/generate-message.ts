import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { auth } from '@clerk/fastify';

/**
 * Schema for response
 */
const responseSchema = z.object({
  message: z.string(),
  expires: z.string().datetime()
});

/**
 * Generate a wallet verification message
 */
export async function generateMessage(fastify: FastifyInstance) {
  fastify.get(
    '/message',
    {
      schema: {
        description: 'Generate a wallet verification message',
        tags: ['wallet'],
        response: {
          200: responseSchema.shape
        }
      },
      onRequest: [auth()]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Get authenticated user
      const { userId } = request.auth;
      
      if (!userId) {
        return reply.status(401).send({
          error: {
            code: 'unauthorized',
            message: 'Authentication required'
          }
        });
      }
      
      try {
        // Generate verification message
        const result = await fastify.walletService.generateVerificationMessage(userId);
        
        return {
          message: result.message,
          expires: result.expires.toISOString()
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to generate verification message');
        
        return reply.status(500).send({
          error: {
            code: 'generate_message_error',
            message: 'Failed to generate verification message'
          }
        });
      }
    }
  );
}
