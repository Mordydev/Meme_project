import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth';

/**
 * Schema for get battle entries request
 */
const schema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Battle ID' }
    }
  },
  querystring: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 50,
        description: 'Number of entries to return'
      },
      cursor: {
        type: 'string',
        description: 'Cursor for pagination'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              battleId: { type: 'string' },
              userId: { type: 'string' },
              content: {
                type: 'object',
                properties: {
                  type: { 
                    type: 'string',
                    enum: ['text', 'image', 'audio', 'video', 'mixed']
                  },
                  body: { type: 'string', nullable: true },
                  mediaUrl: { type: 'string', nullable: true },
                  additionalMedia: { 
                    type: 'array',
                    items: { type: 'string' },
                    nullable: true
                  }
                }
              },
              metadata: {
                type: 'object',
                properties: {
                  deviceInfo: { type: 'string', nullable: true },
                  creationTime: { type: 'number', nullable: true },
                  tags: { 
                    type: 'array',
                    items: { type: 'string' },
                    nullable: true
                  }
                }
              },
              moderation: {
                type: 'object',
                properties: {
                  status: { 
                    type: 'string',
                    enum: ['pending', 'approved', 'rejected']
                  },
                  reviewerId: { type: 'string', nullable: true },
                  reviewedAt: { type: 'string', format: 'date-time', nullable: true },
                  reason: { type: 'string', nullable: true }
                }
              },
              metrics: {
                type: 'object',
                properties: {
                  viewCount: { type: 'integer' },
                  voteCount: { type: 'integer' },
                  commentCount: { type: 'integer' },
                  shareCount: { type: 'integer' }
                }
              },
              rank: { type: 'integer', nullable: true },
              submissionTime: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  displayName: { type: 'string' },
                  imageUrl: { type: 'string', nullable: true }
                }
              }
            }
          }
        },
        hasMore: { type: 'boolean' },
        cursor: { type: 'string', nullable: true }
      }
    }
  }
};

/**
 * Get entries for a battle
 */
export default async function (fastify: FastifyInstance) {
  fastify.get('/api/battles/:id/entries', {
    schema,
    // Auth is optional for this endpoint
    preHandler: async (request, reply) => {
      try {
        await authenticate(request, reply);
      } catch (error) {
        // Continue even if authentication fails
        request.log.info('Unauthenticated user accessing battle entries');
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { limit, cursor } = request.query as {
      limit?: number;
      cursor?: string;
    };
    
    const battleService = fastify.services.battleService;
    
    // Get battle entries
    const result = await battleService.getBattleEntries(
      id,
      limit || 50,
      cursor
    );
    
    // Get user details for each entry
    const entriesWithUsers = await Promise.all(result.entries.map(async (entry) => {
      try {
        const user = await fastify.services.repositories.profileRepository.findById(entry.userId);
        return {
          ...entry,
          user: user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            imageUrl: user.imageUrl
          } : null
        };
      } catch (error) {
        // If user not found, continue without user details
        return {
          ...entry,
          user: null
        };
      }
    }));
    
    // Return entries with users
    return reply.send({
      entries: entriesWithUsers,
      hasMore: result.hasMore,
      cursor: result.cursor
    });
  });
}
