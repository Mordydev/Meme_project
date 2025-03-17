/**
 * Notifications API Handlers
 * 
 * Implements route handlers for notifications
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { NotFoundError, ForbiddenError } from '../../errors/api-errors';
import { logger } from '../../lib/logger';
import { eventBus, EventType } from '../../lib/enhanced-event-bus';

/**
 * Get user notifications
 */
export async function getNotifications(
  request: FastifyRequest<{
    Querystring: {
      limit?: number;
      offset?: number;
      read?: boolean;
    }
  }>,
  reply: FastifyReply
) {
  // Ensure user is authenticated
  if (!request.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  
  const userId = request.user.id;
  const { limit = 20, offset = 0, read } = request.query;
  
  try {
    // Get user notifications from DB (mock implementation for now)
    // In a real implementation, use the notifications repository
    const notificationsData = Array.from({ length: 5 }, (_, i) => ({
      id: `notification-${i + 1}`,
      type: ['points', 'achievement', 'system', 'content', 'level'][i % 5],
      title: `Test Notification ${i + 1}`,
      message: `This is a test notification ${i + 1}`,
      read: i < 2 ? true : false,
      data: { test: true },
      createdAt: new Date(Date.now() - i * 60000).toISOString() // Each one minute earlier
    }));
    
    // Filter by read status if specified
    const filteredNotifications = read !== undefined
      ? notificationsData.filter(n => n.read === read)
      : notificationsData;
    
    // Apply pagination
    const paginatedNotifications = filteredNotifications
      .slice(offset, offset + limit);
    
    // Get unread count
    const unreadCount = notificationsData.filter(n => !n.read).length;
    
    // Return notifications
    return reply.send({
      data: paginatedNotifications,
      meta: {
        timestamp: new Date().toISOString(),
        total: filteredNotifications.length,
        unread: unreadCount
      }
    });
  } catch (error) {
    logger.error('Error getting notifications', { error, userId });
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  request: FastifyRequest<{
    Params: { id: string }
  }>,
  reply: FastifyReply
) {
  // Ensure user is authenticated
  if (!request.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  
  const userId = request.user.id;
  const { id } = request.params;
  
  try {
    // Mark notification as read in DB (mock implementation for now)
    // In a real implementation, use the notifications repository
    
    // Simulate updating the notification
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Publish notification read event
    eventBus.publish(EventType.NOTIFICATION_READ, {
      userId,
      notificationId: id
    });
    
    // Return success
    return reply.send({
      data: {
        success: true
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error marking notification as read', { error, userId, notificationId: id });
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Ensure user is authenticated
  if (!request.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  
  const userId = request.user.id;
  
  try {
    // Mark all notifications as read in DB (mock implementation for now)
    // In a real implementation, use the notifications repository
    
    // Simulate updating notifications
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Publish all notifications read event
    eventBus.publish(EventType.NOTIFICATION_ALL_READ, {
      userId
    });
    
    // Return success
    return reply.send({
      data: {
        success: true,
        count: 5 // Mock count of updated notifications
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', { error, userId });
    throw error;
  }
}

/**
 * Get notification settings
 */
export async function getSettings(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Ensure user is authenticated
  if (!request.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  
  const userId = request.user.id;
  
  try {
    // Get notification settings from DB (mock implementation for now)
    // In a real implementation, use the notifications repository
    
    // Mock settings
    const settings = {
      channels: {
        inApp: true,
        email: true,
        push: false
      },
      types: {
        points: {
          enabled: true,
          channels: {
            inApp: true,
            email: false,
            push: false
          }
        },
        achievement: {
          enabled: true,
          channels: {
            inApp: true,
            email: true,
            push: false
          }
        },
        content: {
          enabled: true,
          channels: {
            inApp: true,
            email: false,
            push: false
          }
        },
        system: {
          enabled: true,
          channels: {
            inApp: true,
            email: true,
            push: false
          }
        }
      }
    };
    
    // Return settings
    return reply.send({
      data: settings,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting notification settings', { error, userId });
    throw error;
  }
}

/**
 * Update notification settings
 */
export async function updateSettings(
  request: FastifyRequest<{
    Body: {
      channels?: {
        inApp?: boolean;
        email?: boolean;
        push?: boolean;
      };
      types?: Record<string, {
        enabled?: boolean;
        channels?: {
          inApp?: boolean;
          email?: boolean;
          push?: boolean;
        };
      }>;
    }
  }>,
  reply: FastifyReply
) {
  // Ensure user is authenticated
  if (!request.user?.id) {
    throw new ForbiddenError('Authentication required');
  }
  
  const userId = request.user.id;
  const updates = request.body;
  
  try {
    // Update notification settings in DB (mock implementation for now)
    // In a real implementation, use the notifications repository
    
    // Simulate updating settings
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return success
    return reply.send({
      data: {
        success: true
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error updating notification settings', { error, userId });
    throw error;
  }
}
