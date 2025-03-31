/**
 * Request Handlers for the Content API module (Content, Comments, Reactions)
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { enhancedPointsService as pointsService, contentService, feedService } from '../../services'; // Import services
import { draftService } from '../../services/content/drafts/draft-service'; // Correct path
import { searchService } from '../../services/content/search/search-service'; // For search
import { reactionService } from '../../services/content/reaction/reaction-service'; // Import ReactionService
import {
  createContentSchema,
  updateContentSchema,
  ContentType,
  // ContentListItem // Defined in repository for now, maybe move later
} from '../../models/entities/content.model';
import {
  createCommentSchema,
  updateCommentSchema
} from '../../models/entities/comment.model';
import { logger } from '../../lib/logger';
import { AppError, ValidationError, NotFoundError, ForbiddenError } from '../../lib/errors'; // Keep corrected path for errors
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
  SuggestionQuery, // Added import
  // Reaction Types
  AddReactionBody,
  ReactionParams
  // Remove Draft types from this import as they are defined inline below
} from './types';
import {
  FeedQuerySchema as contentFeedQuerySchema,
  CommentsQuerySchema as commentsQuerySchema,
  FeedQuerySchema as feedQuerySchema, // Added import
  // createCommentSchema as createCommentApiSchema - Create locally below
  // Reaction Schemas
  addReactionRequestSchema as addReactionApiSchema,
  ReactionTypeParamSchema as reactionParamsSchema,
  // Draft Schemas
  DraftsQuerySchema,
  CreateDraftRequestSchema,
  UpdateDraftRequestSchema,
  DraftIdParamSchema,
  PublishDraftRequestSchema
} from './schema'; // Import Zod schemas
// Define the search query schemas here since they're not exported from types.ts
const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(50).default(20).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  contentType: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
});

const suggestionQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(10).default(5).optional()
});

// Create the missing createCommentApiSchema
const createCommentApiSchema = z.object({
  commentText: z.string().min(1).max(1000),
  parentId: z.string().uuid().nullable().optional()
});
import { ContentListItem } from '../../repositories/content-repository'; // Import from repository
import { Draft } from '../../database/schema/drafts'; // Import Draft type for mapping

// Remove helper functions, import/use services directly

/**
 * Get content feed (Uses FeedService)
 */
export async function getContentFeedHandler(
  request: FastifyRequest<{ Querystring: ContentFeedQuery }>,
  reply: FastifyReply
) {
  try {
    // Use the correct schema for parsing ContentFeedQuery
    const query = contentFeedQuerySchema.parse(request.query);
    const options = {
      limit: query.limit,
      cursor: query.cursor, // Use cursor instead of lastId
      lastCreatedAt: query.cursor ? new Date(query.cursor) : undefined, // Use cursor as lastCreatedAt
      type: query.type,
      categoryId: query.categoryId,
      userId: query.userId,
      tags: query.tags, // Pass tags if needed by feedService
      sortBy: query.sortBy // Pass sortBy if needed
    };
    // Use imported feedService directly
    const contentItems = await feedService.getFeed(options);
    return reply.code(200).send({
      data: contentItems,
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
      pagination: {
        cursor: contentItems.length > 0 ? contentItems[contentItems.length - 1].id : null, // Use cursor instead of lastId
        // Ensure createdAt exists before accessing
        lastCreatedAt: contentItems.length > 0 ? contentItems[contentItems.length - 1].createdAt?.toISOString() : null,
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
 * Get content by ID (Uses ContentService)
 */
export async function getContentByIdHandler(
  request: FastifyRequest<{ Params: ContentIdParam }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const content = await contentService.getContentById(id); // Use imported contentService
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
 * Create content (Uses ContentService)
 */
export async function createContentHandler(
  request: FastifyRequest<{ Body: z.infer<typeof createContentSchema> }>,
  reply: FastifyReply
) {
  try {
    const data = createContentSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;

    // TODO: Implement Vercel Blob integration for media uploads
    logger.info('TODO: Implement Vercel Blob upload logic here if media is included.');

    const content = await contentService.createContent(userId, data); // Use imported contentService

    // Points awarding is handled within contentService.createContent now

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
 * Update content (Uses ContentService)
 */
export async function updateContentHandler(
  request: FastifyRequest<{ Params: ContentIdParam; Body: z.infer<typeof updateContentSchema> }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const data = updateContentSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const content = await contentService.updateContent(id, userId, data); // Use imported contentService
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
 * Delete content (Uses ContentService)
 */
export async function deleteContentHandler(
  request: FastifyRequest<{ Params: ContentIdParam }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const deleted = await contentService.deleteContent(id, userId); // Use imported contentService
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
 * Get comments for content (Uses ContentService)
 */
export async function getContentCommentsHandler(
  request: FastifyRequest<{ Params: ContentIdParam; Querystring: CommentsQuery }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const query = commentsQuerySchema.parse(request.query);
    const comments = await contentService.getContentComments(id, { // Use imported contentService
      limit: query.limit,
      offset: query.offset,
      threaded: query.threaded
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
 * Create comment for content (Uses ContentService)
 */
export async function createCommentHandler(
  request: FastifyRequest<{ Params: ContentIdParam; Body: { commentText: string; parentId?: string | null } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;

    // Parse directly with the API schema to validate the provided input
    const apiValidationResult = createCommentApiSchema.safeParse(request.body);

    if (!apiValidationResult.success) {
        throw new ValidationError('Invalid comment data', apiValidationResult.error.flatten().fieldErrors);
    }

    // Construct complete DTO for service with contentId and userId
    const serviceData = {
        contentId: id,
        userId: userId,
        commentText: apiValidationResult.data.commentText,
        parentId: apiValidationResult.data.parentId,
        // Add metadata field with empty default to match schema
        metadata: {}
    };

    // Call service with complete data
    const comment = await contentService.createComment(userId, serviceData);

    // Points awarding is handled within contentService.createComment

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
 * Update comment (Uses ContentService)
 */
export async function updateCommentHandler(
  request: FastifyRequest<{ Params: CommentIdParam; Body: z.infer<typeof updateCommentSchema> }>,
  reply: FastifyReply
) {
  try {
    const { commentId } = request.params;
    const data = updateCommentSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const comment = await contentService.updateComment(commentId, userId, data); // Use imported contentService
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
 * Delete comment (Uses ContentService)
 */
export async function deleteCommentHandler(
  request: FastifyRequest<{ Params: CommentIdParam }>,
  reply: FastifyReply
) {
  try {
    const { commentId } = request.params;
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const deleted = await contentService.deleteComment(commentId, userId); // Use imported contentService
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

// --- Handlers from feed-controller.ts (Now uses FeedService) ---

/**
 * Get feed by type (Uses FeedService)
 */
export async function getFeedHandler(
  request: FastifyRequest<{ Params: { type: string }; Querystring: FeedQuery }>,
  reply: FastifyReply
) {
  try {
    const { type } = request.params;
    const feedType = validateFeedType(type); // Use helper function
    const query = feedQuerySchema.parse(request.query);

    // Build options object for FeedService
    const options = {
      limit: query.limit,
      cursor: query.cursor, // Use cursor instead of lastId
      lastCreatedAt: query.cursor ? new Date(query.cursor) : undefined, // Use cursor as lastCreatedAt
      type: query.type, // Use type instead of contentType
      categoryId: query.categoryId,
      tags: query.tags, // Use tags array instead of tagId
      userId: query.userId,
      timeframe: query.timeframe,
      sortBy: query.sortBy // Pass sortBy
    };

    // @ts-ignore - Assuming request.user is populated
    if (feedType === 'personal' && !request.user) {
      return reply.code(401).send({
        data: null,
        meta: { timestamp: new Date().toISOString(), requestId: request.id },
        errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required for personal feed' }]
      });
    }
    // @ts-ignore - Assuming request.user is populated
    if (feedType === 'personal' && !options.userId && request.user) {
      // @ts-ignore
      options.userId = request.user.id;
    }

    // Use imported feedService directly
    const contentItems = await feedService.getFeed(options); // Pass options directly

    return reply.code(200).send({
      data: contentItems,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        feedType
      },
      pagination: {
        cursor: contentItems.length > 0 ? contentItems[contentItems.length - 1].id : null, // Use cursor instead of lastId
        // Ensure createdAt exists before accessing
        lastCreatedAt: contentItems.length > 0 ? contentItems[contentItems.length - 1].createdAt?.toISOString() : null,
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
 * Validate feed type (Helper function)
 */
function validateFeedType(type: string): FeedType {
  const validTypes: FeedType[] = ['latest', 'trending', 'popular', 'featured', 'discussed', 'personal'];
  if (validTypes.includes(type as FeedType)) {
    return type as FeedType;
  }
  logger.warn(`Invalid feed type requested: ${type}, defaulting to latest`);
  return 'latest';
}

// --- Handlers from search-controller.ts (Now uses SearchService) ---

/**
 * Search content (Uses SearchService)
 */
export async function searchContentHandler(
  request: FastifyRequest<{ Querystring: SearchQuery }>,
  reply: FastifyReply
) {
  try {
    const query = searchQuerySchema.parse(request.query);
    const filter = {
      contentType: query.contentType,
      categoryId: query.categoryId,
      tagId: query.tagId,
      userId: query.userId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined
    };

    // Use imported searchService directly
    const searchResults = await searchService.searchContent(
      query.q,
      filter,
      query.limit,
      query.offset
    );
    const filterOptions = await searchService.getSearchFilters(query.q);

    return reply.code(200).send({
      data: searchResults,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        query: query.q,
        totalResults: searchResults.length, // Placeholder, might need total count from service
        filters: filterOptions
      },
      pagination: {
        limit: query.limit,
        offset: query.offset,
        // hasMore: query.offset + searchResults.length < totalCount // Needs total count
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
 * Get search suggestions (Uses SearchService)
 */
export async function getSearchSuggestionsHandler(
  request: FastifyRequest<{ Querystring: SuggestionQuery }>,
  reply: FastifyReply
) {
  try {
    const query = suggestionQuerySchema.parse(request.query);
    // Use imported searchService directly
    const suggestions = await searchService.getSuggestions(query.q, query.limit);

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

// --- Reaction Handlers ---

/**
 * Add reaction to content (Uses ReactionService)
 */
export async function addReactionHandler(
  request: FastifyRequest<{ Params: ContentIdParam; Body: AddReactionBody }>,
  reply: FastifyReply
) {
  try {
    const { id: contentId } = request.params;
    const { reactionType } = addReactionApiSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;

    const addedReaction = await reactionService.addReaction(userId, contentId, reactionType);

    if (addedReaction) {
      return reply.code(201).send({
        data: { success: true },
        meta: { timestamp: new Date().toISOString(), requestId: request.id }
      });
    } else {
      // Reaction already existed or user reacted to own content
      return reply.code(200).send({
        data: { success: true, message: 'Reaction already exists or self-reaction ignored.' },
        meta: { timestamp: new Date().toISOString(), requestId: request.id }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Remove reaction from content (Uses ReactionService)
 */
export async function removeReactionHandler(
  request: FastifyRequest<{ Params: { id: string; reactionType: string } }>, // Use inline params type
  reply: FastifyReply
) {
  try {
    // Validate params using an inline schema or pre-validation hook
    const paramsSchema = z.object({ id: z.string().uuid(), reactionType: z.string() });
    const { id: contentId, reactionType } = paramsSchema.parse(request.params);

    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;

    const removed = await reactionService.removeReaction(userId, contentId, reactionType);

    if (!removed) {
      // Could be 404 if reaction never existed, or just 200 if idempotent removal is desired
      logger.info(`Reaction not found or already removed`, { userId, contentId, reactionType });
    }

    return reply.code(200).send({
      data: { success: removed }, // Indicate if removal happened
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
     if (error instanceof z.ZodError) {
        return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

// --- Draft Handlers ---

/**
 * List user's drafts
 */
 // Define Draft types inline using imported Zod schemas
 type DraftsQuery = z.infer<typeof DraftsQuerySchema>;
 type DraftIdParam = z.infer<typeof DraftIdParamSchema>;
 type CreateDraftBody = z.infer<typeof CreateDraftRequestSchema>;
 type UpdateDraftBody = z.infer<typeof UpdateDraftRequestSchema>;
 type PublishDraftBody = z.infer<typeof PublishDraftRequestSchema>;

export async function listDraftsHandler(
  request: FastifyRequest<{ Querystring: DraftsQuery }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const query = DraftsQuerySchema.parse(request.query);

    // TODO: Implement pagination in DraftService.getUserDrafts
    // TODO: Implement pagination in DraftService.getUserDrafts
    const drafts: Draft[] = await draftService.getUserDrafts(userId); // Add type annotation

    // Map to response schema (DraftListItemSchema)
    const responseData = drafts.map((d: Draft) => ({ // Use imported Draft type
        id: d.id,
        type: d.type,
        updatedAt: d.updatedAt,
        previewText: d.contentText?.substring(0, 100) // Example preview
    }));

    return reply.code(200).send({
      data: responseData,
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
      // pagination: { ... } // Add pagination info when implemented
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

/**
 * Create or update a draft (Upsert logic likely in service)
 */
export async function createDraftHandler(
  request: FastifyRequest<{ Body: CreateDraftBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const data = CreateDraftRequestSchema.parse(request.body);

    // Assuming service handles upsert based on whether an ID is implicitly passed or logic inside
    // Or, perhaps separate POST (create) and PUT (update) handlers are better REST practice
    // For now, assuming createDraft handles creation/initial save
    const draft = await draftService.createDraft(userId, data);

    return reply.code(201).send({ // Use 201 Created
      data: draft,
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
 * Get a specific draft
 */
export async function getDraftHandler(
  request: FastifyRequest<{ Params: DraftIdParam }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const { draftId } = DraftIdParamSchema.parse(request.params);

    const draft = await draftService.getDraftById(draftId, userId);
    if (!draft) {
      throw new NotFoundError('Draft', draftId);
    }

    return reply.code(200).send({
      data: draft,
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
 * Update a specific draft
 */
export async function updateDraftHandler(
  request: FastifyRequest<{ Params: DraftIdParam; Body: UpdateDraftBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const { draftId } = DraftIdParamSchema.parse(request.params);
    const data = UpdateDraftRequestSchema.parse(request.body);

    const draft = await draftService.updateDraft(draftId, userId, data);
     if (!draft) { // Service might return null if not found or not authorized
      throw new NotFoundError('Draft', draftId);
    }

    return reply.code(200).send({
      data: draft,
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
 * Delete a specific draft
 */
export async function deleteDraftHandler(
  request: FastifyRequest<{ Params: DraftIdParam }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const { draftId } = DraftIdParamSchema.parse(request.params);

    const deleted = await draftService.deleteDraft(draftId, userId);
    if (!deleted) {
      throw new NotFoundError('Draft', draftId);
    }

    return reply.code(200).send({
      data: { success: true },
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
 * Publish a draft as content
 */
export async function publishDraftHandler(
  request: FastifyRequest<{ Params: DraftIdParam; Body: PublishDraftBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const { draftId } = DraftIdParamSchema.parse(request.params);
    // Body might be empty, parse just in case
    const body = PublishDraftRequestSchema.parse(request.body);

    const content = await draftService.publishDraft(draftId, userId);
    if (!content) {
        // Handle cases where publish might fail (e.g., draft not found, validation issues on publish)
        throw new AppError('Failed to publish draft', 'PUBLISH_ERROR', 400);
    }

    return reply.code(201).send({ // Return 201 Created for the new content resource
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

// TODO: Add handlers from other controllers (taxonomy, moderation, analytics)
