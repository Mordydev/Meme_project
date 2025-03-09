import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { BattleModel } from '../../repositories/battle-repository';

/**
 * Schema for update battle status request
 */
const schema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Battle ID' }
    }
  },
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { 
        type: 'string',
        enum: ['draft', 'scheduled', 'open', 'voting', 'completed'],
        description: 'New battle status'
      }
    }
  },
  response: {
    200: {
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
        creatorId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

/**
 * Update battle status
 */
export default async function (fastify: FastifyInstance) {
  fastify.patch('/api/battles/:id/status', {
    schema,
    preHandler: authenticate
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: BattleModel['status'] };
    
    const battleService = fastify.services.battleService;
    
    // Update battle status (user ID passed for permission check)
    const updatedBattle = await battleService.updateBattleStatus(id, status, request.userId);
    
    // Return updated battle
    return reply.send(updatedBattle);
  });
}
