/**
 * Feed Controller
 * 
 * Handles API endpoints for content feeds
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { FeedService, FeedType } from '../../../services/content/feed/feed-service';
import { logger } from '../../../lib/logger';
import { handleApiError } from '../../../errors/handlers';

// Query params schema for feed
const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  lastId: z.string().optional(),
  lastCreatedAt: z.string().optional(),
  contentType: z.string().optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  userId: z.string().optional(),
  timeframe: z.enum(['day', 'week', 'month', 'year', 'all']).default('week')
});

/**
 * Get feed by type
 */
export const getFeed = (feedService: FeedService) => {
  return async (request: FastifyRequest<{ Params: { type: string } }>, reply: FastifyReply) => {
    try {
      const { type } = request.params;
      
      // Validate feed type
      const feedType = validateFeedType(type);
      
      // Parse and validate query params
      const query = feedQuerySchema.parse(request.query);
      
      // Build options object
      const options = {
        limit: query.limit,
        lastId: query.lastId,
        lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined,
        contentType: query.contentType,
        categoryId: query.categoryId,
        tagId: query.tagId,
        userId: query.userId,
        timeframe: query.timeframe
      };
      
      // If personal feed, ensure user is authenticated
      if (feedType === 'personal' && !request.user) {
        return reply.code(401).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'UNAUTHORIZED',
              message: 'Authentication required for personal feed'
            }
          ]
        });
      }
      
      // Use authenticated user ID for personal feed if not specified
      if (feedType === 'personal' && !options.userId && request.user) {
        options.userId = request.user.id;
      }
      
      // Get feed
      const contentItems = await feedService.getFeed(feedType, options);
      
      // Return content items
      return reply.code(200).send({
        data: contentItems,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          feedType
        },
        pagination: {
          lastId: contentItems.length > 0 ? contentItems[contentItems.length - 1].id : null,
          lastCreatedAt: contentItems.length > 0 ? contentItems[contentItems.length - 1].created_at.toISOString() : null,
          limit: query.limit,
          hasMore: contentItems.length === query.limit
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Validate feed type
 * 
 * @param type Feed type from request
 * @returns Validated feed type
 */
function validateFeedType(type: string): FeedType {
  const validTypes: FeedType[] = ['latest', 'trending', 'popular', 'featured', 'discussed', 'personal'];
  
  if (validTypes.includes(type as FeedType)) {
    return type as FeedType;
  }
  
  // Default to latest if invalid
  logger.warn(`Invalid feed type requested: ${type}, defaulting to latest`);
  return 'latest';
}
