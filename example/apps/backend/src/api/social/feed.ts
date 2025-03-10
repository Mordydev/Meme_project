import { FastifyInstance } from 'fastify';
import { auth } from '@clerk/fastify';
import { FeedService } from '../../services/feed-service';

/**
 * Feed API endpoints
 */
export default async function feedRoutes(fastify: FastifyInstance): Promise<void> {
  const feedService = fastify.diContainer.resolve(FeedService);
  
  /**
   * Get personalized feed for the authenticated user
   */
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          cursor: { type: 'string' },
          context: { type: 'string', enum: ['default', 'discover'], default: 'default' },
          bypassCache: { type: 'boolean', default: false }
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
                  type: { type: 'string', enum: ['content', 'battle', 'achievement', 'follow'] },
                  priority: { type: 'number' },
                  itemId: { type: 'string' },
                  userId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  content: { type: 'object', additionalProperties: true },
                  battle: { type: 'object', additionalProperties: true },
                  achievement: { type: 'object', additionalProperties: true },
                  user: { type: 'object', additionalProperties: true },
                  relationship: {
                    type: 'object',
                    properties: {
                      isFollowing: { type: 'boolean' }
                    }
                  }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                cursor: { type: ['string', 'null'] },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { limit, cursor, context, bypassCache } = request.query as {
      limit: number;
      cursor?: string;
      context: 'default' | 'discover';
      bypassCache: boolean;
    };
    
    const feed = await feedService.getUserFeed(userId, {
      limit,
      cursor,
      context,
      bypassCache
    });
    
    return feed;
  });
  
  /**
   * Get feed for a specified user
   */
  fastify.get('/user/:userId', {
    schema: {
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          cursor: { type: 'string' }
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
                  type: { type: 'string', enum: ['content', 'battle', 'achievement', 'follow'] },
                  priority: { type: 'number' },
                  itemId: { type: 'string' },
                  userId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  content: { type: 'object', additionalProperties: true },
                  battle: { type: 'object', additionalProperties: true },
                  achievement: { type: 'object', additionalProperties: true },
                  user: { type: 'object', additionalProperties: true }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                cursor: { type: ['string', 'null'] },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const { userId } = request.params as { userId: string };
    const { limit, cursor } = request.query as { limit: number; cursor?: string };
    
    // For user profile feeds, we use a special context to only show their content
    // In a real implementation, we would have a separate method for this
    const feed = await feedService.getUserFeed(userId, {
      limit,
      cursor,
      context: 'profile', // Special context for profile feeds
      bypassCache: true // Don't cache profile feeds
    });
    
    return feed;
  });
  
  /**
   * Get discovery feed for trending content and battles
   */
  fastify.get('/discover', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          cursor: { type: 'string' },
          category: { type: 'string' },
          type: { type: 'string', enum: ['content', 'battle', 'all'], default: 'all' }
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
                  type: { type: 'string', enum: ['content', 'battle'] },
                  priority: { type: 'number' },
                  itemId: { type: 'string' },
                  userId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  content: { type: 'object', additionalProperties: true },
                  battle: { type: 'object', additionalProperties: true },
                  user: { type: 'object', additionalProperties: true },
                  metrics: {
                    type: 'object',
                    properties: {
                      views: { type: 'integer' },
                      reactions: { type: 'integer' },
                      comments: { type: 'integer' },
                      trending_score: { type: 'number' }
                    }
                  }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                cursor: { type: ['string', 'null'] },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const { limit, cursor, category, type } = request.query as {
      limit: number;
      cursor?: string;
      category?: string;
      type: 'content' | 'battle' | 'all';
    };
    
    // Get current user if authenticated
    const userId = request.auth?.userId;
    
    // Get discovery feed (trending content and battles)
    const feed = await feedService.getDiscoveryFeed({
      limit,
      cursor,
      category,
      type,
      userId // Optional - for personalization if user is logged in
    });
    
    return feed;
  });
}
