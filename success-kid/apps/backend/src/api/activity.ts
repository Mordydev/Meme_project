/**
 * Activity API Routes
 * 
 * Contains API endpoints for activity feeds and management.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  activityService,
  ActivityType,
  FeedOptions
} from '../activity';

interface GetFeedQuery {
  limit?: number;
  before?: string;
  after?: string;
  types?: ActivityType[];
  actors?: string[];
  aggregated?: boolean;
}

interface MarkReadBody {
  feedItemIds: string[];
}

/**
 * Register activity routes
 * 
 * @param fastify Fastify instance
 */
export default async function activityRoutes(fastify: FastifyInstance): Promise<void> {
  // Get user's activity feed
  fastify.get('/feed', {
    schema: {
      tags: ['Activity'],
      summary: 'Get user activity feed',
      description: 'Returns the activity feed for the authenticated user',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 },
          before: { type: 'string' },
          after: { type: 'string' },
          types: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          actors: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          aggregated: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          description: 'User activity feed',
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  actorId: { type: 'string' },
                  data: { type: 'object' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{Querystring: GetFeedQuery}>, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const options: FeedOptions = {
        limit: request.query.limit,
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
        responseData = feed.map(item => ({
          primaryActivity: {
            id: item.primaryActivity.id,
            type: item.primaryActivity.type,
            actorId: item.primaryActivity.actorId,
            data: item.primaryActivity.data
          },
          actorId: item.actorId,
          actorName: item.actorName,
          actorAvatar: item.actorAvatar,
          type: item.type,
          count: item.count,
          relatedActivities: item.relatedActivities.map(related => ({
            id: related.id,
            type: related.type,
            actorId: related.actorId,
            data: related.data
          })),
          createdAt: item.createdAt.toISOString()
        }));
      } else {
        // Transform regular feed
        responseData = feed.map(item => ({
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
  });
  
  // Mark feed items as read
  fastify.put('/feed/read', {
    schema: {
      tags: ['Activity'],
      summary: 'Mark feed items as read',
      description: 'Marks specific feed items as read',
      body: {
        type: 'object',
        required: ['feedItemIds'],
        properties: {
          feedItemIds: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      response: {
        200: {
          description: 'Feed items marked as read',
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
  }, async (request: FastifyRequest<{Body: MarkReadBody}>, reply: FastifyReply) => {
    try {
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
  });
  
  // Mark all feed items as read
  fastify.put('/feed/read-all', {
    schema: {
      tags: ['Activity'],
      summary: 'Mark all feed items as read',
      description: 'Marks all feed items for the current user as read',
      response: {
        200: {
          description: 'Feed items marked as read',
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
  });
}
