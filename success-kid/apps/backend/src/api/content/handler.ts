/**
 * Request Handlers for the Content API module (Content and Comments)
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { enhancedPointsService as pointsService } from '../../services'; // Import enhancedPointsService and alias it
// Assuming ContentService type is available via decoration or import
// import { ContentService } from '../../services/content/content-service';
import {
  createContentSchema,
  updateContentSchema,
  ContentType
} from '../../models/entities/content.model';
import {
  createCommentSchema,
  updateCommentSchema
} from '../../models/entities/comment.model';
import { logger } from '../../lib/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '../../errors'; // Assuming these exist
import { handleApiError } from '../../errors/handlers'; // Assuming this exists
import {
  ContentFeedQuery,
  CommentsQuery,
  ContentIdParam,
  CommentIdParam,
  FeedQuery, // Added import
  FeedType, // Added import
  validFeedTypes, // Added import
  // Search Types
  SearchQuery, // Added import
  SuggestionQuery // Added import
  // Import body types if needed
} from './types';
import {
  contentFeedQuerySchema,
  commentsQuerySchema,
  feedQuerySchema, // Added import
  createCommentApiSchema, // Added import
  // Search Schemas
  searchQuerySchema, // Added import
  suggestionQuerySchema // Added import
} from './schema'; // Import Zod schemas

// Helper to get contentService from the request instance
function getContentService(request: FastifyRequest): any { // Use 'any' for now, assuming decoration
    // @ts-ignore - Assuming contentService is decorated onto the fastify instance
    if (!request.server.contentService) {
        throw new Error('ContentService not found on Fastify instance');
    }
    // @ts-ignore
    return request.server.contentService;
}


/**
 * Get content feed
 */
export async function getContentFeedHandler(
  request: FastifyRequest<{ Querystring: ContentFeedQuery }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const query = contentFeedQuerySchema.parse(request.query);
    const options = {
      limit: query.limit,
      lastId: query.lastId,
      lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined,
      type: query.type,
      categoryId: query.categoryId,
      userId: query.userId
    };
    const contentItems = await contentService.getContentFeed(options);
    return reply.code(200).send({
      data: contentItems,
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
      pagination: {
        lastId: contentItems.length > 0 ? contentItems[contentItems.length - 1].id : null,
        lastCreatedAt: contentItems.length > 0 ? contentItems[contentItems.length - 1].created_at.toISOString() : null,
        limit: query.limit,
        hasMore: contentItems.length === query.limit
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Get content by ID
 */
export async function getContentByIdHandler(
  request: FastifyRequest<{ Params: ContentIdParam }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const { id } = request.params;
    const content = await contentService.getContentById(id);
    if (!content) {
      throw new NotFoundError('Content', id);
    }
    return reply.code(200).send({
      data: content,
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Create content
 */
export async function createContentHandler(
  // Define Body generic type based on expected schema
  request: FastifyRequest<{ Body: z.infer<typeof createContentSchema> }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const data = createContentSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;

    // TODO: Implement Vercel Blob integration for media uploads
    // - If server-side upload: Handle file stream, upload, get URL, add to data.mediaUrls
    // - If client-side upload: Validate signed URL / confirm upload completion
    logger.info('TODO: Implement Vercel Blob upload logic here if media is included.');

    const content = await contentService.createContent(userId, data);

    // Award points for content creation
    try {
      await pointsService.awardPoints({
        userId,
        amount: pointsService.getPointsValue('content_creation'), // Get value from config/service
        source: 'content_creation',
        referenceId: content.id,
        description: `Created content: ${content.id}`
      });
    } catch (pointsError) {
      logger.error('Failed to award points for content creation', { userId, contentId: content.id, error: pointsError });
      // Decide if this should fail the request or just log
    }

    return reply.code(201).send({
      data: content,
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Update content
 */
export async function updateContentHandler(
  // Define Body generic type based on expected schema
  request: FastifyRequest<{ Params: ContentIdParam; Body: z.infer<typeof updateContentSchema> }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const { id } = request.params;
    const data = updateContentSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const content = await contentService.updateContent(id, userId, data);
    return reply.code(200).send({
      data: content,
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Delete content
 */
export async function deleteContentHandler(
  request: FastifyRequest<{ Params: ContentIdParam }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const { id } = request.params;
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const deleted = await contentService.deleteContent(id, userId);
    if (!deleted) {
      throw new NotFoundError('Content', id);
    }
    return reply.code(200).send({
      data: { success: true },
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Get comments for content
 */
export async function getContentCommentsHandler(
  request: FastifyRequest<{ Params: ContentIdParam; Querystring: CommentsQuery }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const { id } = request.params;
    const query = commentsQuerySchema.parse(request.query);
    const comments = await contentService.getContentComments(id, {
      limit: query.limit,
      offset: query.offset,
      threaded: query.threaded,
      includeDeleted: query.includeDeleted
    });
    return reply.code(200).send({
      data: comments,
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
      pagination: {
        limit: query.limit,
        offset: query.offset,
        // nextOffset: query.offset + comments.length // Adjust as needed
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Create comment for content
 */
export async function createCommentHandler(
  // Define Body generic type based on expected schema (adjust if needed)
  request: FastifyRequest<{ Params: ContentIdParam; Body: { comment_text: string; parent_id?: string | null } }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const { id } = request.params;
    // Validate the necessary fields from the body using the imported schema parts
    // We expect 'comment_text' and optionally 'parent_id' from the client
    const bodyValidationSchema = z.object({
        comment_text: createCommentSchema.shape.comment_text,
        parent_id: createCommentSchema.shape.parent_id.optional()
    });
    const bodyData = bodyValidationSchema.parse(request.body);

    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    // Construct the full data object for the service
    const commentData = {
        comment_text: bodyData.comment_text,
        parent_id: bodyData.parent_id,
        content_id: id,
        user_id: userId
    };
    const comment = await contentService.createComment(userId, commentData);

    // Award points for commenting
    try {
      await pointsService.awardPoints({
        userId,
        amount: pointsService.getPointsValue('comment'), // Get value from config/service
        source: 'comment',
        referenceId: comment.id, // Reference the comment ID
        description: `Commented on content: ${id}` // Reference the content ID
      });
    } catch (pointsError) {
      logger.error('Failed to award points for comment creation', { userId, contentId: id, commentId: comment.id, error: pointsError });
      // Decide if this should fail the request or just log
    }

    return reply.code(201).send({
      data: comment,
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Update comment
 */
export async function updateCommentHandler(
  // Define Body generic type based on expected schema
  request: FastifyRequest<{ Params: CommentIdParam; Body: z.infer<typeof updateCommentSchema> }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const { commentId } = request.params;
    const data = updateCommentSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const comment = await contentService.updateComment(commentId, userId, data);
    return reply.code(200).send({
      data: comment,
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Delete comment
 */
export async function deleteCommentHandler(
  request: FastifyRequest<{ Params: CommentIdParam }>,
  reply: FastifyReply
) {
  const contentService = getContentService(request);
  try {
    const { commentId } = request.params;
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const deleted = await contentService.deleteComment(commentId, userId);
    if (!deleted) {
      throw new NotFoundError('Comment', commentId);
    }
    return reply.code(200).send({
      data: { success: true },
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

// --- Handlers from feed-controller.ts ---

// Helper to get feedService from the request instance
function getFeedService(request: FastifyRequest): any { // Use 'any' for now, assuming decoration
    // @ts-ignore - Assuming feedService is decorated onto the fastify instance
    if (!request.server.feedService) {
        throw new Error('FeedService not found on Fastify instance');
    }
    // @ts-ignore
    return request.server.feedService;
}

/**
 * Get feed by type
 */
export async function getFeedHandler(
  request: FastifyRequest<{ Params: { type: string }; Querystring: FeedQuery }>,
  reply: FastifyReply
) {
  const feedService = getFeedService(request); // Get service instance
  try {
    const { type } = request.params;

    // Validate feed type
    const feedType = validateFeedType(type);

    // Parse and validate query params
    const query = feedQuerySchema.parse(request.query); // Use feedQuerySchema

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
    // @ts-ignore - Assuming request.user is populated
    if (feedType === 'personal' && !request.user) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString(), requestId: request.id },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required for personal feed' }]
      });
    }

    // Use authenticated user ID for personal feed if not specified
    // @ts-ignore - Assuming request.user is populated
    if (feedType === 'personal' && !options.userId && request.user) {
      // @ts-ignore
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
     if (error instanceof z.ZodError) {
        return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Validate feed type (Helper function moved here)
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

// --- Handlers from search-controller.ts ---

// Helper to get searchService from the request instance
function getSearchService(request: FastifyRequest): any { // Use 'any' for now, assuming decoration
    // @ts-ignore - Assuming searchService is decorated onto the fastify instance
    if (!request.server.searchService) {
        throw new Error('SearchService not found on Fastify instance');
    }
    // @ts-ignore
    return request.server.searchService;
}

/**
 * Search content
 */
export async function searchContentHandler(
  request: FastifyRequest<{ Querystring: SearchQuery }>,
  reply: FastifyReply
) {
  const searchService = getSearchService(request);
  try {
    // Parse and validate query params
    const query = searchQuerySchema.parse(request.query);

    // Build filter object
    const filter = {
      contentType: query.contentType,
      categoryId: query.categoryId,
      tagId: query.tagId,
      userId: query.userId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined
    };

    // Search content
    const searchResults = await searchService.searchContent(
      query.q,
      filter,
      query.limit,
      query.offset
    );

    // Get filter options for the search query
    const filterOptions = await searchService.getSearchFilters(query.q);

    // Return search results
    return reply.code(200).send({
      data: searchResults,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        query: query.q,
        totalResults: searchResults.length, // This might be inaccurate if pagination happens server-side
        filters: filterOptions
      },
      pagination: {
        limit: query.limit,
        offset: query.offset,
        // nextOffset: query.offset + searchResults.length // Adjust as needed
      }
    });
  } catch (error) {
     if (error instanceof z.ZodError) {
        return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestionsHandler(
  request: FastifyRequest<{ Querystring: SuggestionQuery }>,
  reply: FastifyReply
) {
  const searchService = getSearchService(request);
  try {
    // Parse and validate query params
    const query = suggestionQuerySchema.parse(request.query);

    // Get suggestions
    const suggestions = await searchService.getSuggestions(query.q, query.limit);

    // Return suggestions
    return reply.code(200).send({
      data: suggestions,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        query: query.q
      }
    });
  } catch (error) {
     if (error instanceof z.ZodError) {
        return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}


// TODO: Add handlers from other controllers (taxonomy, moderation, analytics)
