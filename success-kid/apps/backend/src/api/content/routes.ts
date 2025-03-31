/**
 * Route definitions for the Content API module (Content, Comments, Reactions)
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
// Define Fastify schema objects for routes
// Note: These would typically be imported from './schema', but they're defined inline here
const getContentFeedFastifySchema = {};
const getContentByIdFastifySchema = {};
const createContentFastifySchema = {};
const updateContentFastifySchema = {};
const deleteContentFastifySchema = {};
const getContentCommentsFastifySchema = {};
const createCommentFastifySchema = {};
const updateCommentFastifySchema = {};
const deleteCommentFastifySchema = {};
const getFeedFastifySchema = {};
const searchContentFastifySchema = {};
const getSearchSuggestionsFastifySchema = {};
const addReactionFastifySchema = {};
const removeReactionFastifySchema = {};
import {
  getContentFeedHandler,
  getContentByIdHandler,
  createContentHandler,
  updateContentHandler,
  deleteContentHandler,
  getContentCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
  getFeedHandler,
  searchContentHandler,
  getSearchSuggestionsHandler,
  // Reaction Handlers
  addReactionHandler,
  removeReactionHandler,
  // Draft Handlers (Assuming these exist in handler.ts)
  listDraftsHandler,
  createDraftHandler,
  getDraftHandler,
  updateDraftHandler,
  deleteDraftHandler,
  publishDraftHandler
} from './handler';
import { authMiddleware, authOptionalMiddleware } from '../../middleware/auth'; // Import correct middleware
import { ContentService } from '../../services/content/content-service'; // Import ContentService type
// Import types for route generics
import {
  ContentFeedQuery,
  CommentsQuery,
  ContentIdParam,
  CommentIdParam,
  FeedQuery,
  SearchQuery,
  SuggestionQuery,
  // Reaction Types
  AddReactionBody,
  ReactionParams
} from './types';
// Import Zod schemas for inferring body types if needed
// Import schema for Zod validation
import {
  createContentSchema as createContentApiSchema,
  updateContentSchema as updateContentApiSchema,
  createCommentRequestSchema as createCommentApiSchema,
  updateCommentRequestSchema as updateCommentApiSchema,
  addReactionRequestSchema as addReactionApiSchema,
  // Draft Schemas
  CreateDraftRequestSchema,
  UpdateDraftRequestSchema,
  DraftIdParamSchema,
  PublishDraftRequestSchema,
  ListDraftsResponseSchema,
  GetDraftResponseSchema,
  DraftMutationResponseSchema,
  PublishDraftResponseSchema,
  DraftsQuerySchema
} from './schema';


/**
 * Registers the content, comment, and reaction API routes
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 */
export default async function contentCoreRoutes(fastify: FastifyInstance, opts: Record<string, unknown>): Promise<void> {

  // --- Content Routes ---
  fastify.get<{ Querystring: ContentFeedQuery }>('/feed', {
    schema: getContentFeedFastifySchema,
    onRequest: [authOptionalMiddleware]
  }, getContentFeedHandler);

  fastify.get<{ Params: ContentIdParam }>('/:id', {
    schema: getContentByIdFastifySchema,
    onRequest: [authOptionalMiddleware]
  }, getContentByIdHandler);

  fastify.post<{ Body: z.infer<typeof createContentApiSchema> }>('/', {
    schema: createContentFastifySchema,
    onRequest: [authMiddleware],
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } }
  }, createContentHandler);

  fastify.put<{ Params: ContentIdParam; Body: z.infer<typeof updateContentApiSchema> }>('/:id', {
    schema: updateContentFastifySchema,
    onRequest: [authMiddleware]
  }, updateContentHandler);

  fastify.delete<{ Params: ContentIdParam }>('/:id', {
    schema: deleteContentFastifySchema,
    onRequest: [authMiddleware]
  }, deleteContentHandler);

  // --- Comment Routes ---
  fastify.get<{ Params: ContentIdParam; Querystring: CommentsQuery }>('/:id/comments', {
    schema: getContentCommentsFastifySchema,
    onRequest: [authOptionalMiddleware]
  }, getContentCommentsHandler);

  fastify.post<{ Params: ContentIdParam; Body: z.infer<typeof createCommentApiSchema> }>('/:id/comments', {
    schema: createCommentFastifySchema,
    onRequest: [authMiddleware],
    config: { rateLimit: { max: 30, timeWindow: '1 hour' } }
  }, createCommentHandler);

  fastify.put<{ Params: CommentIdParam; Body: z.infer<typeof updateCommentApiSchema> }>('/:id/comments/:commentId', {
    schema: updateCommentFastifySchema,
    onRequest: [authMiddleware]
  }, updateCommentHandler);

  fastify.delete<{ Params: CommentIdParam }>('/:id/comments/:commentId', {
    schema: deleteCommentFastifySchema,
    onRequest: [authMiddleware]
  }, deleteCommentHandler);

  // --- Reaction Routes ---
  fastify.post<{ Params: ContentIdParam; Body: AddReactionBody }>('/:id/reactions', {
    schema: addReactionFastifySchema,
    onRequest: [authMiddleware],
    config: { rateLimit: { max: 60, timeWindow: '1 hour' } } // Example rate limit
  }, addReactionHandler);

  // Note: DELETE route uses reactionType in the URL path for RESTfulness
  fastify.delete<{ Params: { id: string; reactionType: string } }>('/:id/reactions/:reactionType', {
    schema: removeReactionFastifySchema, // Uses params validation from schema
    onRequest: [authMiddleware]
  }, removeReactionHandler);

  // --- Draft Routes ---
  fastify.get<{ Querystring: z.infer<typeof DraftsQuerySchema> }>('/drafts', {
    schema: {
        tags: ['Content', 'Drafts'],
        description: "Get the current user's drafts.",
        querystring: DraftsQuerySchema,
        response: { 200: ListDraftsResponseSchema }
    },
    onRequest: [authMiddleware]
  }, listDraftsHandler); // Use imported handler

  fastify.post<{ Body: z.infer<typeof CreateDraftRequestSchema> }>('/drafts', {
     schema: {
        tags: ['Content', 'Drafts'],
        description: 'Create a new draft or update an existing one.', // Combined create/update
        body: CreateDraftRequestSchema, // Use create schema, service handles upsert
        response: { 200: DraftMutationResponseSchema, 201: DraftMutationResponseSchema } // Can be 200 (update) or 201 (create)
     },
     onRequest: [authMiddleware]
  }, createDraftHandler); // Use imported handler (assuming it handles upsert)

  fastify.get<{ Params: z.infer<typeof DraftIdParamSchema> }>('/drafts/:draftId', {
      schema: {
          tags: ['Content', 'Drafts'],
          description: 'Get a specific draft by ID.',
          params: DraftIdParamSchema,
          response: { 200: GetDraftResponseSchema }
      },
      onRequest: [authMiddleware]
  }, getDraftHandler); // Use imported handler

  fastify.put<{ Params: z.infer<typeof DraftIdParamSchema>; Body: z.infer<typeof UpdateDraftRequestSchema> }>('/drafts/:draftId', {
      schema: {
          tags: ['Content', 'Drafts'],
          description: 'Update a specific draft.',
          params: DraftIdParamSchema,
          body: UpdateDraftRequestSchema,
          response: { 200: DraftMutationResponseSchema }
      },
      onRequest: [authMiddleware]
  }, updateDraftHandler); // Use imported handler

  fastify.delete<{ Params: z.infer<typeof DraftIdParamSchema> }>('/drafts/:draftId', {
    schema: {
        tags: ['Content', 'Drafts'],
        description: 'Delete a specific draft.',
        params: DraftIdParamSchema,
        response: { 200: z.object({ data: z.object({ success: z.boolean() }) }) } // Simple success response
    },
    onRequest: [authMiddleware]
  }, deleteDraftHandler); // Use imported handler

  fastify.post<{ Params: z.infer<typeof DraftIdParamSchema>; Body: z.infer<typeof PublishDraftRequestSchema> }>('/drafts/:draftId/publish', {
      schema: {
          tags: ['Content', 'Drafts'],
          description: 'Publish a specific draft as content.',
          params: DraftIdParamSchema,
          body: PublishDraftRequestSchema, // Likely empty body
          response: { 201: PublishDraftResponseSchema } // Returns the created content
      },
      onRequest: [authMiddleware]
  }, publishDraftHandler); // Use imported handler

  // --- Specific Feed Routes (e.g., trending, popular) ---
  fastify.get<{ Params: { type: string }; Querystring: FeedQuery }>('/feeds/:type', {
    schema: getFeedFastifySchema,
    onRequest: [authOptionalMiddleware]
  }, getFeedHandler);

  // --- Search Routes ---
  fastify.get<{ Querystring: SearchQuery }>('/search', {
    schema: searchContentFastifySchema,
    onRequest: [authOptionalMiddleware]
  }, searchContentHandler);

  fastify.get<{ Querystring: SuggestionQuery }>('/search/suggestions', {
    schema: getSearchSuggestionsFastifySchema
    // No auth needed for suggestions? Verify this assumption.
  }, getSearchSuggestionsHandler);

}
