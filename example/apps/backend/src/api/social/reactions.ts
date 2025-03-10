import { FastifyInstance } from 'fastify';
import { auth } from '@clerk/fastify';
import { SocialService } from '../../services/social-service';

/**
 * Reaction API endpoints
 */
export default async function reactionRoutes(fastify: FastifyInstance): Promise<void> {
  const socialService = fastify.diContainer.resolve(SocialService);
  
  /**
   * Create or toggle a reaction
   */
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['targetType', 'targetId', 'reactionType'],
        properties: {
          targetType: { type: 'string', enum: ['content', 'comment'] },
          targetId: { type: 'string' },
          reactionType: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            targetType: { type: 'string' },
            targetId: { type: 'string' },
            type: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { targetType, targetId, reactionType } = request.body as {
      targetType: 'content' | 'comment';
      targetId: string;
      reactionType: string;
    };
    
    const reaction = await socialService.createReaction(
      userId, 
      targetType, 
      targetId,
      reactionType
    );
    
    return reaction;
  });
  
  /**
   * Get reactions for a target
   */
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        required: ['targetType', 'targetId'],
        properties: {
          targetType: { type: 'string', enum: ['content', 'comment'] },
          targetId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            reactions: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  targetType: { type: 'string' },
                  targetId: { type: 'string' },
                  type: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      displayName: { type: 'string' },
                      imageUrl: { type: ['string', 'null'] }
                    }
                  }
                }
              }
            },
            total: { type: 'integer' }
          }
        }
      }
    }
  }, async (request) => {
    const { targetType, targetId, limit, offset } = request.query as {
      targetType: 'content' | 'comment';
      targetId: string;
      limit: number;
      offset: number;
    };
    
    const result = await socialService.getReactions(
      targetType,
      targetId,
      { limit, offset }
    );
    
    return result;
  });
  
  /**
   * Get reaction counts for a target
   */
  fastify.get('/counts', {
    schema: {
      querystring: {
        type: 'object',
        required: ['targetType', 'targetId'],
        properties: {
          targetType: { type: 'string', enum: ['content', 'comment'] },
          targetId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          additionalProperties: { type: 'integer' }
        }
      }
    }
  }, async (request) => {
    const { targetType, targetId } = request.query as {
      targetType: 'content' | 'comment';
      targetId: string;
    };
    
    const counts = await socialService.getReactionCounts(targetType, targetId);
    
    return counts;
  });
}
