/**
 * Presence API Routes
 * 
 * Contains API endpoints for user presence management.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  presenceService,
  PresenceStatus
} from '../presence';

interface UpdatePresenceBody {
  status: PresenceStatus;
  customStatus?: string;
}

interface GetPresenceQuery {
  userIds: string[];
}

/**
 * Register presence routes
 * 
 * @param fastify Fastify instance
 */
export default async function presenceRoutes(fastify: FastifyInstance): Promise<void> {
  // Update user presence
  fastify.put('/', {
    schema: {
      tags: ['Presence'],
      summary: 'Update user presence',
      description: 'Updates the current user\'s presence status',
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { 
            type: 'string',
            enum: ['online', 'away', 'busy', 'offline']
          },
          customStatus: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Updated presence',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                status: { type: 'string' },
                lastActive: { type: 'string', format: 'date-time' },
                customStatus: { type: 'string' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{Body: UpdatePresenceBody}>, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const { status, customStatus } = request.body;
      
      // Update presence
      const presence = await presenceService.updatePresence(userId, status, {
        customStatus,
        source: 'api'
      });
      
      return reply.send({
        data: {
          userId: presence.userId,
          status: presence.status,
          lastActive: presence.lastActive.toISOString(),
          customStatus: presence.customStatus
        }
      });
    } catch (error) {
      request.log.error('Error updating presence', error);
      return reply.status(500).send({
        error: 'Failed to update presence'
      });
    }
  });
  
  // Get user presence (self)
  fastify.get('/', {
    schema: {
      tags: ['Presence'],
      summary: 'Get current user presence',
      description: 'Returns the current user\'s presence status',
      response: {
        200: {
          description: 'User presence',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                status: { type: 'string' },
                lastActive: { type: 'string', format: 'date-time' },
                customStatus: { type: 'string' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      
      // Get presence
      const presence = await presenceService.getUserPresence(userId);
      
      if (!presence) {
        // Return default offline status if no presence data
        return reply.send({
          data: {
            userId,
            status: PresenceStatus.OFFLINE,
            lastActive: new Date(0).toISOString()
          }
        });
      }
      
      return reply.send({
        data: {
          userId: presence.userId,
          status: presence.status,
          lastActive: presence.lastActive.toISOString(),
          customStatus: presence.customStatus
        }
      });
    } catch (error) {
      request.log.error('Error getting presence', error);
      return reply.status(500).send({
        error: 'Failed to get presence'
      });
    }
  });
  
  // Get presence for multiple users
  fastify.get('/batch', {
    schema: {
      tags: ['Presence'],
      summary: 'Get presence for multiple users',
      description: 'Returns presence status for multiple users',
      querystring: {
        type: 'object',
        required: ['userIds'],
        properties: {
          userIds: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      response: {
        200: {
          description: 'User presence batch',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  lastActive: { type: 'string', format: 'date-time' },
                  customStatus: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{Querystring: GetPresenceQuery}>, reply: FastifyReply) => {
    try {
      const userIds = request.query.userIds;
      
      // Get presence for multiple users
      const presenceMap = await presenceService.getUsersPresence(userIds);
      
      // Transform for response
      const responseData: Record<string, any> = {};
      
      presenceMap.forEach((presence, userId) => {
        responseData[userId] = {
          status: presence.status,
          lastActive: presence.lastActive.toISOString(),
          customStatus: presence.customStatus
        };
      });
      
      return reply.send({
        data: responseData
      });
    } catch (error) {
      request.log.error('Error getting batch presence', error);
      return reply.status(500).send({
        error: 'Failed to get presence'
      });
    }
  });
  
  // Subscribe to presence updates
  fastify.post('/subscribe', {
    schema: {
      tags: ['Presence'],
      summary: 'Subscribe to presence updates',
      description: 'Subscribes to presence updates for specific users',
      body: {
        type: 'object',
        required: ['userIds'],
        properties: {
          userIds: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      response: {
        200: {
          description: 'Subscription status',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                subscribed: { type: 'boolean' },
                userCount: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{Body: {userIds: string[]}}>, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const targetIds = request.body.userIds;
      
      // Subscribe to presence updates
      await presenceService.subscribeToPresence(userId, targetIds);
      
      return reply.send({
        data: {
          subscribed: true,
          userCount: targetIds.length
        }
      });
    } catch (error) {
      request.log.error('Error subscribing to presence', error);
      return reply.status(500).send({
        error: 'Failed to subscribe to presence updates'
      });
    }
  });
}
