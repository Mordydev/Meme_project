import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth';

/**
 * Schema for get battle results request
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
        battle: {
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
            creatorId: { type: 'string' }
          }
        },
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
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
              user: {
                type: 'object',
                nullable: true,
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
        hasEnded: { type: 'boolean' },
        userVoted: { type: 'boolean', nullable: true },
        userEntry: { 
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string' },
            rank: { type: 'integer', nullable: true },
            voteCount: { type: 'integer' }
          }
        }
      }
    }
  }
};

/**
 * Get battle results
 */
export default async function (fastify: FastifyInstance) {
  fastify.get('/api/battles/:id/results', {
    schema,
    // Auth is optional for this endpoint
    preHandler: async (request, reply) => {
      try {
        await authenticate(request, reply);
      } catch (error) {
        // Continue even if authentication fails
        request.log.info('Unauthenticated user accessing battle results');
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    const battleService = fastify.services.battleService;
    
    // Get battle results
    const results = await battleService.getBattleResults(id);
    
    // Get user details for each entry
    const entriesWithUsers = await Promise.all(results.entries.map(async (entry) => {
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
    
    // Check if authenticated user has voted or submitted entry
    let userVoted = null;
    let userEntry = null;
    
    if (request.userId) {
      // Check if user has voted
      const votes = await fastify.services.repositories.entryRepository['db']
        .from('battle_votes')
        .select('id')
        .eq('battleId', id)
        .eq('voterId', request.userId);
      
      userVoted = votes.data && votes.data.length > 0;
      
      // Check if user has entry
      const userEntryData = await fastify.services.repositories.entryRepository['db']
        .from('battle_entries')
        .select('id, rank, metrics')
        .eq('battleId', id)
        .eq('userId', request.userId)
        .single();
      
      if (userEntryData.data) {
        userEntry = {
          id: userEntryData.data.id,
          rank: userEntryData.data.rank,
          voteCount: userEntryData.data.metrics.voteCount
        };
      }
    }
    
    // Return results with additional user-specific info
    return reply.send({
      battle: results.battle,
      entries: entriesWithUsers,
      hasEnded: results.hasEnded,
      userVoted,
      userEntry
    });
  });
}
