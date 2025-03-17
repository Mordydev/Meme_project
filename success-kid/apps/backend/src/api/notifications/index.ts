/**
 * Notifications API
 * 
 * Provides endpoints for managing notifications
 */
import { FastifyInstance } from 'fastify';
import * as handlers from './handlers';

/**
 * Register notification routes
 * @param fastify Fastify instance
 */
export default async function notificationRoutes(fastify: FastifyInstance) {
  // Get user's notifications
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Get user notifications',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20 },
            offset: { type: 'number', default: 0 },
            read: { type: 'boolean' }
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
                    id: { type: 'string' },
                    type: { type: 'string' },
                    title: { type: 'string' },
                    message: { type: 'string' },
                    read: { type: 'boolean' },
                    data: { type: 'object', additionalProperties: true },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  total: { type: 'number' },
                  unread: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    handlers.getNotifications
  );
  
  // Mark notification as read
  fastify.put(
    '/:id/read',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
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
    handlers.markAsRead
  );
  
  // Mark all notifications as read
  fastify.put(
    '/read-all',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  count: { type: 'number' }
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
    handlers.markAllAsRead
  );
  
  // Get notification settings
  fastify.get(
    '/settings',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Get notification settings',
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  channels: {
                    type: 'object',
                    properties: {
                      inApp: { type: 'boolean' },
                      email: { type: 'boolean' },
                      push: { type: 'boolean' }
                    }
                  },
                  types: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        enabled: { type: 'boolean' },
                        channels: {
                          type: 'object',
                          properties: {
                            inApp: { type: 'boolean' },
                            email: { type: 'boolean' },
                            push: { type: 'boolean' }
                          }
                        }
                      }
                    }
                  }
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
    handlers.getSettings
  );
  
  // Update notification settings
  fastify.put(
    '/settings',
    {
      schema: {
        tags: ['Notifications'],
        summary: 'Update notification settings',
        body: {
          type: 'object',
          properties: {
            channels: {
              type: 'object',
              properties: {
                inApp: { type: 'boolean' },
                email: { type: 'boolean' },
                push: { type: 'boolean' }
              }
            },
            types: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  enabled: { type: 'boolean' },
                  channels: {
                    type: 'object',
                    properties: {
                      inApp: { type: 'boolean' },
                      email: { type: 'boolean' },
                      push: { type: 'boolean' }
                    }
                  }
                }
              }
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
    handlers.updateSettings
  );
}
