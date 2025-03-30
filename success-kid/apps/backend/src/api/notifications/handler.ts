/**
 * Request Handlers for the Notifications API module
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  notificationService,
  preferencesService,
  NotificationFilter
} from '../../notifications'; // Assuming services are exported from the service index
import { GetNotificationsQuery, NotificationIdParam, PreferencesBody } from './types';

/**
 * Handler for getting user notifications
 */
export async function getNotificationsHandler(
  request: FastifyRequest<{ Querystring: GetNotificationsQuery }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user.id;
    const filter: NotificationFilter = {
      status: request.query.status as any, // Consider using validated enum type
      category: request.query.category as any, // Consider using validated enum type
      channel: request.query.channel as any, // Consider using validated enum type
      limit: request.query.limit ?? 20,
      offset: request.query.offset ?? 0,
      includeRead: request.query.includeRead ?? false
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
        total: notifications.length, // Note: This might not be the total count if pagination is used server-side
        unread: unreadCount
      }
    });
  } catch (error) {
    request.log.error('Error getting notifications', error);
    return reply.status(500).send({
      error: 'Failed to retrieve notifications'
    });
  }
}

/**
 * Handler for getting unread notification count
 */
export async function getNotificationCountHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
}

/**
 * Handler for marking a notification as read
 */
export async function markNotificationReadHandler(
  request: FastifyRequest<{ Params: NotificationIdParam }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
}

/**
 * Handler for marking all notifications as read
 */
export async function markAllNotificationsReadHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
}

/**
 * Handler for getting notification preferences
 */
export async function getPreferencesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
}

/**
 * Handler for updating notification preferences
 */
export async function updatePreferencesHandler(
  request: FastifyRequest<{ Body: PreferencesBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
}

/**
 * Handler for resetting notification preferences
 */
export async function resetPreferencesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
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
}
