import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { EntryModel } from '../../repositories/entry-repository';

/**
 * Schema for submit battle entry request
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
    required: ['content'],
    properties: {
      content: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { 
            type: 'string',
            enum: ['text', 'image', 'audio', 'video', 'mixed']
          },
          body: { 
            type: 'string',
            nullable: true
          },
          mediaUrl: { 
            type: 'string',
            nullable: true
          },
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
          deviceInfo: { type: 'string' },
          creationTime: { type: 'number' },
          tags: { 
            type: 'array',
            items: { type: 'string' }
          },
          duration: { type: 'number' }
        }
      }
    }
  },
  response: {
    201: {
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
        submissionTime: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

/**
 * Submit an entry to a battle
 */
export default async function (fastify: FastifyInstance) {
  fastify.post('/api/battles/:id/entries', {
    schema,
    preHandler: authenticate
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { content, metadata } = request.body as {
      content: EntryModel['content'];
      metadata?: EntryModel['metadata'];
    };
    
    const battleService = fastify.services.battleService;
    
    // Submit entry
    const entry = await battleService.submitEntry(
      id,
      request.userId,
      { content, metadata }
    );
    
    // Return created entry
    return reply.code(201).send(entry);
  });
}
