/**
 * Request Handlers for the Activity API module
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  activityService,
  FeedOptions
} from '../../activity'; // Assuming activityService and FeedOptions are exported from the service index
import { GetFeedQuery, MarkReadBody } from './types';

/**
 * Handler for getting the user activity feed
 */
export async function getFeedHandler(
  request: FastifyRequest<{ Querystring: GetFeedQuery }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user.id;
    const options: FeedOptions = {
      limit: request.query.limit ?? 20, // Provide default value
      before: request.query.before,
      after: request.query.after,
      types: request.query.types,
      actors: request.query.actors
    };

    // Get feed - either aggregated or raw
    const feed = request.query.aggregated
      ? await activityService.getAggregatedUserFeed(userId, options)
      : await activityService.getUserFeed(userId, options);

    // Transform for response
    let responseData;

    if (request.query.aggregated) {
      // Transform aggregated feed
      // TODO: Define a specific type for aggregated feed items
      responseData = (feed as any[]).map(item => ({
        primaryActivity: {
          id: item.primaryActivity?.id,
          type: item.primaryActivity?.type,
          actorId: item.primaryActivity?.actorId,
          data: item.primaryActivity?.data
        },
        actorId: item.actorId,
        actorName: item.actorName,
        actorAvatar: item.actorAvatar,
        type: item.type,
        count: item.count,
        relatedActivities: (item.relatedActivities || []).map((related: any) => ({ // Add type for related
          id: related.id,
          type: related.type,
          actorId: related.actorId,
          data: related.data
        })),
        createdAt: item.createdAt.toISOString()
      }));
    } else {
      // Transform regular feed
      // TODO: Define a specific type for regular feed items
      responseData = (feed as any[]).map(item => ({
        id: item.id,
        activityId: item.activityId,
        type: item.type,
        actorId: item.actorId,
        data: item.data,
        isRead: item.isRead,
        createdAt: item.createdAt.toISOString()
      }));
    }

    return reply.send({
      data: responseData
    });
  } catch (error) {
    request.log.error('Error getting activity feed', error);
    return reply.status(500).send({
      error: 'Failed to retrieve activity feed'
    });
  }
}

/**
 * Handler for marking specific feed items as read
 */
export async function markReadHandler(
  request: FastifyRequest<{ Body: MarkReadBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user.id;
    const { feedItemIds } = request.body;

    // Mark as read
    const count = await activityService.markFeedItemsAsRead(feedItemIds, userId);

    return reply.send({
      data: {
        count
      }
    });
  } catch (error) {
    request.log.error('Error marking feed items as read', error);
    return reply.status(500).send({
      error: 'Failed to mark feed items as read'
    });
  }
}

/**
 * Handler for marking all feed items as read
 */
export async function markReadAllHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    const userId = request.user.id;

    // Mark all as read
    const count = await activityService.markAllFeedItemsAsRead(userId);

    return reply.send({
      data: {
        count
      }
    });
  } catch (error) {
    request.log.error('Error marking all feed items as read', error);
    return reply.status(500).send({
      error: 'Failed to mark feed items as read'
    });
  }
}
