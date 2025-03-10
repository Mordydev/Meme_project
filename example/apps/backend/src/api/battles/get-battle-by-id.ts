import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth';

/**
 * Schema for get battle by ID request
 */
const schema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Battle ID' }
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
        participantCount: { type: 'integer' },
        entryCount: { type: 'integer' },
        voteCount: { type: 'integer' },
        featured: { type: 'boolean' },
        creatorId: { type: 'string' },
        creator: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            displayName: { type: 'string' },
            imageUrl: { type: 'string', nullable: true }
          }
        },
        exampleEntries: { 
          type: 'array',
          items: { type: 'string' }
        },
        userParticipation: {
          type: 'object',
          nullable: true,
          properties: {
            hasEntered: { type: 'boolean' },
            canEnter: { type: 'boolean' },
            remainingEntries: { type: 'integer' }
          }
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

/**
 * Get a single battle by ID
 */
export default async function (fastify: FastifyInstance) {
  fastify.get('/api/battles/:id', {
    schema,
    // Auth is optional for this endpoint
    preHandler: async (request, reply) => {
      try {
        await authenticate(request, reply);
      } catch (error) {
        // Continue even if authentication fails
        request.log.info('Unauthenticated user accessing battle details');
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const battleService = fastify.services.battleService;
    
    // Get battle details
    const battle = await battleService.getBattleById(id);
    
    // Check if user has participated
    let userParticipation = null;
    
    if (request.userId) {
      const hasEntered = await fastify.services.repositories.entryRepository.hasUserSubmittedToBattle(
        request.userId, id
      );
      
      // Calculate remaining entries
      const maxEntries = battle.maxEntriesPerUser || 1;
      const userEntryCount = await fastify.services.repositories.entryRepository.count({
        userId: request.userId,
        battleId: id
      });
      
      userParticipation = {
        hasEntered,
        canEnter: battle.status === 'open' && userEntryCount < maxEntries,
        remainingEntries: Math.max(0, maxEntries - userEntryCount)
      };
    }
    
    // Return battle with user participation info
    return reply.send({
      ...battle,
      userParticipation
    });
  });
}
