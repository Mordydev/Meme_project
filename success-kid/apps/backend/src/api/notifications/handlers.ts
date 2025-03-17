/**
 * Notification API Handlers
 * 
 * Handles notification API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  NotificationOptions,
  NotificationChannel
} from '../../models/notification';
import { logger } from '../../lib/logger';

/**
 * Get user's notifications with pagination and filtering
 */
export async function getNotifications(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    
    // Extract query parameters
    const query = request.query as {
      limit?: string;
      offset?: string;
      unreadOnly?: string;
      types?: string;
    };
    
    // Prepare options
    const options: NotificationOptions = {
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
      unreadOnly: query.unreadOnly === 'true'
    };
    
    // Parse types if provided
    if (query.types) {
      options.types = query.types.split(',');
    }
    
    // Get notifications
    const notificationService = request.diContainer.resolve('notificationService');
    const result = await notificationService.getUserNotifications(userId, options);
    
    reply.send({
      data: result.notifications,
      meta: {
        total: result.total,
        unreadCount: result.unreadCount
      }
    });
  } catch (error) {
    logger.error('Error getting notifications', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to get notifications',
      message: error.message
    });
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  request: FastifyRequest<{
    Params: { id: string }
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const notificationService = request.diContainer.resolve('notificationService');
    
    const result = await notificationService.markAsRead(id);
    
    if (!result) {
      reply.status(404).send({
        error: 'Notification not found',
        message: 'The specified notification was not found'
      });
      return;
    }
    
    reply.send({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Error marking notification as read', { error, id: request.params.id });
    reply.status(500).send({
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    const notificationService = request.diContainer.resolve('notificationService');
    
    const count = await notificationService.markAllAsRead(userId);
    
    reply.send({
      success: true,
      message: `Marked ${count} notifications as read`
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    const preferencesService = request.diContainer.resolve('notificationPreferencesService');
    
    const preferences = await preferencesService.getPreferences(userId);
    
    reply.send({
      data: preferences
    });
  } catch (error) {
    logger.error('Error getting notification preferences', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to get notification preferences',
      message: error.message
    });
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  request: FastifyRequest<{
    Body: {
      channels?: {
        inapp?: boolean;
        email?: boolean;
        push?: boolean;
      };
      categories?: {
        [category: string]: {
          enabled: boolean;
          channels?: {
            inapp?: boolean;
            email?: boolean;
            push?: boolean;
          };
        };
      };
    }
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const { channels, categories } = request.body;
    const preferencesService = request.diContainer.resolve('notificationPreferencesService');
    
    // Update channels if provided
    if (channels) {
      await preferencesService.updateChannelPreferences(userId, channels as Record<NotificationChannel, boolean>);
    }
    
    // Update categories if provided
    if (categories) {
      for (const [category, prefs] of Object.entries(categories)) {
        await preferencesService.updateCategoryPreferences(
          userId,
          category,
          prefs.enabled,
          prefs.channels as Record<NotificationChannel, boolean>
        );
      }
    }
    
    // Get updated preferences
    const preferences = await preferencesService.getPreferences(userId);
    
    reply.send({
      data: preferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    logger.error('Error updating notification preferences', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to update notification preferences',
      message: error.message
    });
  }
}

/**
 * Update quiet hours settings
 */
export async function updateQuietHours(
  request: FastifyRequest<{
    Body: {
      enabled: boolean;
      start?: string;
      end?: string;
      timezone?: string;
    }
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const quietHours = request.body;
    const preferencesService = request.diContainer.resolve('notificationPreferencesService');
    
    // Update quiet hours
    await preferencesService.updateQuietHours(userId, quietHours);
    
    // Get updated preferences
    const preferences = await preferencesService.getPreferences(userId);
    
    reply.send({
      data: preferences.quietHours,
      message: 'Quiet hours settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating quiet hours', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to update quiet hours',
      message: error.message
    });
  }
}

/**
 * Reset notification preferences to default
 */
export async function resetPreferences(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    const preferencesService = request.diContainer.resolve('notificationPreferencesService');
    
    const preferences = await preferencesService.resetPreferences(userId);
    
    reply.send({
      data: preferences,
      message: 'Notification preferences reset to default'
    });
  } catch (error) {
    logger.error('Error resetting notification preferences', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to reset notification preferences',
      message: error.message
    });
  }
}
