/**
 * Notification API Routes
 * 
 * Contains API endpoints for managing notifications.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  notificationService, 
  preferencesService,
  NotificationFilter
} from '../notifications';

interface GetNotificationsQuery {
  limit?: number;
  offset?: number;
  status?: string;
  category?: string;
  channel?: string;
  startDate?: string;
  endDate?: string;
  includeRead?: boolean;
}

interface NotificationIdParam {
  id: string;
}

interface PreferencesBody {
  channels?: Record<string, boolean>;
  categories?: Record<string, any>;
  types?: Record<string, any>;
  quietHours?: {
    enabled?: boolean;
    start?: string;
    end?: string;
    timezone?: string;
  };
}

/**
 * Register notification routes
 * 
 * @param fastify Fastify instance
 */
export default async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  // Get current user's notifications
  fastify.get('/', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get current user\'s notifications',
      description: 'Returns notifications for the authenticated user',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 },
          status: { type: 'string' },
          category: { type: 'string' },
          channel: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          includeRead: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          description: 'List of notifications',
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
                  body: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  readAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                unread: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{Querystring: GetNotificationsQuery}>, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const filter: NotificationFilter = {
        status: request.query.status as any,
        category: request.query.category as any,
        channel: request.query.channel as any,
        limit: request.query.limit || 20,
        offset: request.query.offset || 0,
        includeRead: request.query.includeRead || false
      };
      
      if (request.query.startDate) {
        filter.startDate = new Date(request.query.startDate);
      }
      
      if (request.query.endDate) {
        filter.endDate = new Date(request.query.endDate);
      }
      
      // Get notifications
      const notifications = await notificationService.getUserNotifications(userId, filter);
      
      // Count unread
      const unreadCount = await notificationService.countUnreadNotifications(userId);
      
      // Transform for response
      const responseData = notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image_url,
        data: notification.data,
        importance: notification.importance,
        status: notification.status,
        createdAt: notification.created_at.toISOString(),
        deliveredAt: notification.delivered_at?.toISOString(),
        readAt: notification.read_at?.toISOString()
      }));
      
      return reply.send({
        data: responseData,
        meta: {
          total: notifications.length,
          unread: unreadCount
        }
      });
    } catch (error) {
      request.log.error('Error getting notifications', error);
      return reply.status(500).send({
        error: 'Failed to retrieve notifications'
      });
    }
  });
  
  // Get notification count
  fastify.get('/count', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get notification count',
      description: 'Returns the count of unread notifications',
      response: {
        200: {
          description: 'Notification count',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                unread: { type: 'integer' }
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
      
      // Count unread
      const unreadCount = await notificationService.countUnreadNotifications(userId);
      
      return reply.send({
        data: {
          unread: unreadCount
        }
      });
    } catch (error) {
      request.log.error('Error getting notification count', error);
      return reply.status(500).send({
        error: 'Failed to retrieve notification count'
      });
    }
  });
  
  // Mark notification as read
  fastify.put('/:id/read', {
    schema: {
      tags: ['Notifications'],
      summary: 'Mark notification as read',
      description: 'Marks a specific notification as read',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Notification marked as read',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string' }
              }
            }
          }
        },
        404: {
          description: 'Notification not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{Params: NotificationIdParam}>, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const notificationId = request.params.id;
      
      // Mark as read
      const notification = await notificationService.markAsRead(notificationId, userId);
      
      if (!notification) {
        return reply.status(404).send({
          error: 'Notification not found'
        });
      }
      
      return reply.send({
        data: {
          id: notification.id,
          status: notification.status
        }
      });
    } catch (error) {
      request.log.error('Error marking notification as read', error);
      return reply.status(500).send({
        error: 'Failed to mark notification as read'
      });
    }
  });
  
  // Mark all notifications as read
  fastify.put('/read-all', {
    schema: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      description: 'Marks all notifications for the current user as read',
      response: {
        200: {
          description: 'Notifications marked as read',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                count: { type: 'integer' }
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
      
      // Mark all as read
      const count = await notificationService.markAllAsRead(userId);
      
      return reply.send({
        data: {
          count
        }
      });
    } catch (error) {
      request.log.error('Error marking all notifications as read', error);
      return reply.status(500).send({
        error: 'Failed to mark notifications as read'
      });
    }
  });
  
  // Get notification preferences
  fastify.get('/preferences', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get notification preferences',
      description: 'Returns the current user\'s notification preferences',
      response: {
        200: {
          description: 'Notification preferences',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                channels: { type: 'object' },
                categories: { type: 'object' },
                types: { type: 'object' },
                quietHours: { type: 'object' }
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
      
      // Get preferences
      const preferences = await preferencesService.getPreferences(userId);
      
      return reply.send({
        data: {
          channels: preferences.channels,
          categories: preferences.categories,
          types: preferences.types,
          quietHours: preferences.quietHours
        }
      });
    } catch (error) {
      request.log.error('Error getting notification preferences', error);
      return reply.status(500).send({
        error: 'Failed to retrieve notification preferences'
      });
    }
  });
  
  // Update notification preferences
  fastify.put('/preferences', {
    schema: {
      tags: ['Notifications'],
      summary: 'Update notification preferences',
      description: 'Updates the current user\'s notification preferences',
      body: {
        type: 'object',
        properties: {
          channels: {
            type: 'object',
            additionalProperties: { type: 'boolean' }
          },
          categories: {
            type: 'object',
            additionalProperties: { type: 'object' }
          },
          types: {
            type: 'object',
            additionalProperties: { type: 'object' }
          },
          quietHours: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              start: { type: 'string' },
              end: { type: 'string' },
              timezone: { type: 'string' }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Updated notification preferences',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                channels: { type: 'object' },
                categories: { type: 'object' },
                types: { type: 'object' },
                quietHours: { type: 'object' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{Body: PreferencesBody}>, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      
      // Update preferences
      const updatedPreferences = await preferencesService.updatePreferences(
        userId,
        request.body
      );
      
      return reply.send({
        data: {
          channels: updatedPreferences.channels,
          categories: updatedPreferences.categories,
          types: updatedPreferences.types,
          quietHours: updatedPreferences.quietHours
        }
      });
    } catch (error) {
      request.log.error('Error updating notification preferences', error);
      return reply.status(500).send({
        error: 'Failed to update notification preferences'
      });
    }
  });
  
  // Reset notification preferences to defaults
  fastify.post('/preferences/reset', {
    schema: {
      tags: ['Notifications'],
      summary: 'Reset notification preferences',
      description: 'Resets the current user\'s notification preferences to default values',
      response: {
        200: {
          description: 'Reset notification preferences',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                channels: { type: 'object' },
                categories: { type: 'object' },
                types: { type: 'object' },
                quietHours: { type: 'object' }
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
      
      // Reset preferences
      const defaultPreferences = await preferencesService.resetPreferences(userId);
      
      return reply.send({
        data: {
          channels: defaultPreferences.channels,
          categories: defaultPreferences.categories,
          types: defaultPreferences.types,
          quietHours: defaultPreferences.quietHours
        }
      });
    } catch (error) {
      request.log.error('Error resetting notification preferences', error);
      return reply.status(500).send({
        error: 'Failed to reset notification preferences'
      });
    }
  });
}
