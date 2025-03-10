import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BattleModel } from '../../repositories/battle-repository';
import { authenticate } from '../../middleware/auth';

/**
 * Schema for get battles request
 */
const schema = {
  querystring: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['draft', 'scheduled', 'open', 'voting', 'completed'],
        description: 'Filter battles by status'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Number of battles to return'
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
        battles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              battleType: { 
                type: 'string',
                enum: ['wildStyle', 'pickUpKillIt', 'rAndBeef', 'tournament']
              },
              status: { 
                type: 'string',
                enum: ['draft', 'scheduled', 'open', 'voting', 'completed']
              },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              votingStartTime: { type: 'string', format: 'date-time' },
              votingEndTime: { type: 'string', format: 'date-time' },
              participantCount: { type: 'integer' },
              entryCount: { type: 'integer' },
              voteCount: { type: 'integer' },
              featured: { type: 'boolean' },
              creatorId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
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
 * Get battles with optional filtering
 */
export default async function (fastify: FastifyInstance) {
  fastify.get('/api/battles', {
    schema,
    // Auth is optional for this endpoint
    preHandler: async (request, reply) => {
      try {
        await authenticate(request, reply);
      } catch (error) {
        // Continue even if authentication fails
        request.log.info('Unauthenticated user accessing battles');
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { status, limit, cursor } = request.query as {
      status?: BattleModel['status'];
      limit?: number;
      cursor?: string;
    };
    
    const battleService = fastify.services.battleService;
    
    // Get battles with pagination
    const result = await battleService.getAllBattles(
      status,
      limit || 20,
      cursor
    );
    
    return reply.send(result);
  });
}
