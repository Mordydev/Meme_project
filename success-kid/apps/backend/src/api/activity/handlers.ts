/**
 * Activity API Handlers
 * 
 * Handles activity feed API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  FeedOptions,
  ActivityType
} from '../../models/activity';
import { logger } from '../../lib/logger';

/**
 * Get user's activity feed with pagination
 */
export async function getUserFeed(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    
    // Extract query parameters
    const query = request.query as {
      limit?: string;
      before?: string;
      after?: string;
      includeTypes?: string;
      excludeTypes?: string;
      actorIds?: string;
      unreadOnly?: string;
    };
    
    // Prepare options
    const options: FeedOptions = {
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      before: query.before,
      after: query.after,
      unreadOnly: query.unreadOnly === 'true'
    };
    
    // Parse includeTypes if provided
    if (query.includeTypes) {
      options.includeTypes = query.includeTypes.split(',') as ActivityType[];
    }
    
    // Parse excludeTypes if provided
    if (query.excludeTypes) {
      options.excludeTypes = query.excludeTypes.split(',') as ActivityType[];
    }
    
    // Parse actorIds if provided
    if (query.actorIds) {
      options.actorIds = query.actorIds.split(',');
    }
    
    // Get feed
    const activityService = request.diContainer.resolve('activityService');
    const result = await activityService.getUserFeed(userId, options);
    
    reply.send({
      data: result.items,
      meta: {
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
        unreadCount: result.unreadCount
      }
    });
  } catch (error) {
    logger.error('Error getting user feed', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to get user feed',
      message: error.message
    });
  }
}

/**
 * Mark a feed item as read
 */
export async function markAsRead(
  request: FastifyRequest<{
    Params: { id: string }
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const { id } = request.params;
    const activityService = request.diContainer.resolve('activityService');
    
    const result = await activityService.markFeedItemAsRead(userId, id);
    
    if (!result) {
      reply.status(404).send({
        error: 'Feed item not found',
        message: 'The specified feed item was not found'
      });
      return;
    }
    
    reply.send({
      success: true,
      message: 'Feed item marked as read'
    });
  } catch (error) {
    logger.error('Error marking feed item as read', { 
      error, 
      userId: request.user.id,
      activityId: request.params.id 
    });
    reply.status(500).send({
      error: 'Failed to mark feed item as read',
      message: error.message
    });
  }
}

/**
 * Mark all feed items as read
 */
export async function markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    const activityService = request.diContainer.resolve('activityService');
    
    const count = await activityService.markAllFeedItemsAsRead(userId);
    
    reply.send({
      success: true,
      message: `Marked ${count} feed items as read`
    });
  } catch (error) {
    logger.error('Error marking all feed items as read', { error, userId: request.user.id });
    reply.status(500).send({
      error: 'Failed to mark all feed items as read',
      message: error.message
    });
  }
}

/**
 * Hide a feed item
 */
export async function hideFeedItem(
  request: FastifyRequest<{
    Params: { id: string }
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const { id } = request.params;
    const activityService = request.diContainer.resolve('activityService');
    
    const result = await activityService.hideFeedItem(userId, id);
    
    if (!result) {
      reply.status(404).send({
        error: 'Feed item not found',
        message: 'The specified feed item was not found'
      });
      return;
    }
    
    reply.send({
      success: true,
      message: 'Feed item hidden'
    });
  } catch (error) {
    logger.error('Error hiding feed item', { 
      error, 
      userId: request.user.id,
      activityId: request.params.id 
    });
    reply.status(500).send({
      error: 'Failed to hide feed item',
      message: error.message
    });
  }
}

/**
 * Get activities by actor (user)
 */
export async function getActorActivities(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: {
      limit?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
    
    const activityService = request.diContainer.resolve('activityService');
    const activities = await activityService.getActivitiesByActor(id, limit);
    
    reply.send({
      data: activities
    });
  } catch (error) {
    logger.error('Error getting user activities', { error, actorId: request.params.id });
    reply.status(500).send({
      error: 'Failed to get user activities',
      message: error.message
    });
  }
}
