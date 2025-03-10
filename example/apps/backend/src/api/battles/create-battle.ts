import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { BattleModel } from '../../repositories/battle-repository';

/**
 * Schema for create battle request
 */
const schema = {
  body: {
    type: 'object',
    required: ['title', 'description', 'battleType', 'rules', 'startTime', 'endTime', 'votingEndTime'],
    properties: {
      title: { 
        type: 'string',
        minLength: 3,
        maxLength: 100
      },
      description: { 
        type: 'string',
        minLength: 10,
        maxLength: 500
      },
      battleType: { 
        type: 'string',
        enum: ['wildStyle', 'pickUpKillIt', 'rAndBeef', 'tournament']
      },
      rules: {
        type: 'object',
        required: ['prompt', 'mediaTypes'],
        properties: {
          prompt: { 
            type: 'string',
            minLength: 5,
            maxLength: 200
          },
          mediaTypes: { 
            type: 'array',
            items: { 
              type: 'string',
              enum: ['text', 'image', 'audio', 'video', 'mixed']
            },
            minItems: 1
          },
          maxDuration: { type: 'integer', nullable: true },
          minLength: { type: 'integer', nullable: true },
          maxLength: { type: 'integer', nullable: true },
          additionalRules: { 
            type: 'array',
            items: { type: 'string' },
            nullable: true
          }
        }
      },
      startTime: { type: 'string', format: 'date-time' },
      endTime: { type: 'string', format: 'date-time' },
      votingEndTime: { type: 'string', format: 'date-time' },
      maxEntriesPerUser: { 
        type: 'integer',
        minimum: 1,
        maximum: 10,
        default: 1
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        battleType: { 
          type: 'string',
          enum: ['wildStyle', 'pickUpKillIt', 'rAndBeef', 'tournament']
        },
        rules: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            mediaTypes: { 
              type: 'array',
              items: { type: 'string' }
            },
            maxDuration: { type: 'integer', nullable: true },
            minLength: { type: 'integer', nullable: true },
            maxLength: { type: 'integer', nullable: true },
            additionalRules: { 
              type: 'array',
              items: { type: 'string' },
              nullable: true
            }
          }
        },
        status: { 
          type: 'string',
          enum: ['draft', 'scheduled', 'open', 'voting', 'completed']
        },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' },
        votingStartTime: { type: 'string', format: 'date-time' },
        votingEndTime: { type: 'string', format: 'date-time' },
        creatorId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

/**
 * Create a new battle
 */
export default async function (fastify: FastifyInstance) {
  fastify.post('/api/battles', {
    schema,
    preHandler: authenticate
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const battleData = request.body as {
      title: string;
      description: string;
      battleType: BattleModel['battleType'];
      rules: BattleModel['rules'];
      startTime: string;
      endTime: string;
      votingEndTime: string;
      maxEntriesPerUser?: number;
    };
    
    const battleService = fastify.services.battleService;
    
    // Create battle
    const battle = await battleService.createBattle(
      request.userId,
      {
        ...battleData,
        startTime: new Date(battleData.startTime),
        endTime: new Date(battleData.endTime),
        votingEndTime: new Date(battleData.votingEndTime)
      }
    );
    
    // Return created battle
    return reply.code(201).send(battle);
  });
}
