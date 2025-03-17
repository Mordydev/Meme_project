/**
 * Presence API
 * 
 * Provides endpoints for managing user presence
 */
import { FastifyInstance } from 'fastify';
import * as handlers from './handlers';

/**
 * Register presence routes
 * @param fastify Fastify instance
 */
export default async function presenceRoutes(fastify: FastifyInstance) {
  // Get user presence
  fastify.get(
    '/presence/:userId',
    {
      schema: {
        tags: ['Presence'],
        summary: 'Get user presence',
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  status: { type: 'string' },
                  statusMessage: { type: 'string', nullable: true },
                  lastActivity: { type: 'string', format: 'date-time' },
                  lastLocation: { type: 'string', nullable: true }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handlers.getUserPresence
  );
  
  // Update current user's presence
  fastify.put(
    '/presence',
    {
      schema: {
        tags: ['Presence'],
        summary: 'Update current user presence',
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { 
              type: 'string',
              enum: ['online', 'away', 'offline', 'busy', 'invisible']
            },
            statusMessage: { type: 'string', nullable: true },
            lastLocation: { type: 'string', nullable: true },
            metadata: { 
              type: 'object',
              additionalProperties: true,
              nullable: true
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  status: { type: 'string' }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handlers.updatePresence
  );
  
  // Get presence for multiple users
  fastify.post(
    '/presence/batch',
    {
      schema: {
        tags: ['Presence'],
        summary: 'Get presence for multiple users',
        body: {
          type: 'object',
          required: ['userIds'],
          properties: {
            userIds: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 100
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    status: { type: 'string' },
                    statusMessage: { type: 'string', nullable: true },
                    lastActivity: { type: 'string', format: 'date-time' },
                    lastLocation: { type: 'string', nullable: true }
                  }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  count: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    handlers.getMultiplePresence
  );
  
  // Get users in a room
  fastify.get(
    '/presence/room/:roomId',
    {
      schema: {
        tags: ['Presence'],
        summary: 'Get users present in a room',
        params: {
          type: 'object',
          required: ['roomId'],
          properties: {
            roomId: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    status: { type: 'string' },
                    statusMessage: { type: 'string', nullable: true },
                    lastActivity: { type: 'string', format: 'date-time' }
                  }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  count: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    handlers.getRoomPresence
  );
  
  // Join a room
  fastify.post(
    '/presence/room/:roomId/join',
    {
      schema: {
        tags: ['Presence'],
        summary: 'Join a room',
        params: {
          type: 'object',
          required: ['roomId'],
          properties: {
            roomId: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  roomId: { type: 'string' }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handlers.joinRoom
  );
  
  // Leave a room
  fastify.post(
    '/presence/room/:roomId/leave',
    {
      schema: {
        tags: ['Presence'],
        summary: 'Leave a room',
        params: {
          type: 'object',
          required: ['roomId'],
          properties: {
            roomId: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handlers.leaveRoom
  );
}
