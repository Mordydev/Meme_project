/**
 * Route definitions for the Content API module (Content and Comments)
 */
import { FastifyInstance } from 'fastify';
import {
  getContentFeedFastifySchema,
  getContentByIdFastifySchema,
  createContentFastifySchema,
  updateContentFastifySchema,
  deleteContentFastifySchema,
  getContentCommentsFastifySchema,
  createCommentFastifySchema,
  updateCommentFastifySchema,
  deleteCommentFastifySchema,
  // Feed Schema
  getFeedFastifySchema, // Keep this
  // Search Schemas
  searchContentFastifySchema,
  getSearchSuggestionsFastifySchema
  // TODO: Import schemas from other controllers
} from './schema';
import {
  getContentFeedHandler,
  getContentByIdHandler,
  createContentHandler,
  updateContentHandler,
  deleteContentHandler,
  getContentCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler, // Keep one
  // Feed Handler
  getFeedHandler, // Keep this
  // Search Handlers
  searchContentHandler,
  getSearchSuggestionsHandler
  // TODO: Import handlers from other controllers
} from './handler';
import { authMiddleware, authOptionalMiddleware } from '../../middleware/auth'; // Import correct middleware
import { ContentService } from '../../services/content/content-service'; // Import ContentService type
// Import types for route generics
import {
  ContentFeedQuery,
  CommentsQuery,
  ContentIdParam,
  CommentIdParam,
  FeedQuery, // Keep this
  // Search Types
  SearchQuery,
  SuggestionQuery
} from './types';
// Import Zod schemas for inferring body types if needed
import {
  createContentApiSchema, // Corrected import
  updateContentApiSchema, // Corrected import
  createCommentApiSchema,
  updateCommentApiSchema // Corrected import
  // Search Schemas are already imported below
} from './schema';
import { z } from 'zod';

/**
 * Registers the content and comment API routes
 * @param fastify - The Fastify instance
 * @param opts - Plugin options (services will be accessed via fastify instance decoration)
 */
export default async function contentCoreRoutes(fastify: FastifyInstance, opts: Record<string, unknown>): Promise<void> {
  // Services are accessed via request.server.contentService in handlers

  // --- Content Routes ---
  // Changed '/' to '/feed' to align with plan's intent for the main feed endpoint
  fastify.get<{ Querystring: ContentFeedQuery }>('/feed', { 
    schema: getContentFeedFastifySchema, // TODO: Rename schema if needed
    onRequest: [authOptionalMiddleware]
  }, getContentFeedHandler); // Call handler directly

  fastify.get<{ Params: ContentIdParam }>('/:id', {
    schema: getContentByIdFastifySchema,
    onRequest: [authOptionalMiddleware]
  }, getContentByIdHandler); // Call handler directly

  // TODO: Check createContentHandler for Vercel Blob integration and points awarding
  // TODO: Check createContentHandler for Vercel Blob integration and points awarding
  fastify.post<{ Body: z.infer<typeof createContentApiSchema> }>('/', { 
    schema: createContentFastifySchema,
    onRequest: [authMiddleware],
    config: { // Add route-specific rate limit
      rateLimit: {
        max: 10, // Max 10 posts
        timeWindow: '1 hour' // Per hour
      }
    }
  }, createContentHandler); 

  fastify.put<{ Params: ContentIdParam; Body: z.infer<typeof updateContentApiSchema> }>('/:id', { 
    schema: updateContentFastifySchema,
    onRequest: [authMiddleware]
  }, updateContentHandler); // Call handler directly

  fastify.delete<{ Params: ContentIdParam }>('/:id', {
    schema: deleteContentFastifySchema,
    onRequest: [authMiddleware]
  }, deleteContentHandler); // Call handler directly

  // --- Comment Routes ---
  fastify.get<{ Params: ContentIdParam; Querystring: CommentsQuery }>('/:id/comments', {
    schema: getContentCommentsFastifySchema,
    onRequest: [authOptionalMiddleware]
  }, getContentCommentsHandler); // Call handler directly

  // TODO: Check createCommentHandler for points awarding
  fastify.post<{ Params: ContentIdParam; Body: z.infer<typeof createCommentApiSchema> }>('/:id/comments', {
    schema: createCommentFastifySchema,
    onRequest: [authMiddleware],
    config: { // Add route-specific rate limit
      rateLimit: {
        max: 30, // Max 30 comments
        timeWindow: '1 hour' // Per hour
      }
    }
  }, createCommentHandler); 

  fastify.put<{ Params: CommentIdParam; Body: z.infer<typeof updateCommentApiSchema> }>('/:id/comments/:commentId', { 
    schema: updateCommentFastifySchema,
    onRequest: [authMiddleware]
  }, updateCommentHandler); // Call handler directly

  fastify.delete<{ Params: CommentIdParam }>('/:id/comments/:commentId', {
    schema: deleteCommentFastifySchema,
    onRequest: [authMiddleware]
  }, deleteCommentHandler); // Call handler directly

  // --- Reaction Routes (Placeholder) ---
  // TODO: Implement Reaction Schemas and Handlers
  // TODO: Check handlers for points awarding
  // TODO: Add rate limiting for reactions
  fastify.post('/:id/reactions', {
    // schema: addReactionSchema,
    onRequest: [authMiddleware],
    // config: { rateLimit: { max: 60, timeWindow: '1 hour' } }, // Example rate limit
    handler: async (req, reply) => { reply.code(501).send('Not Implemented'); } 
  });

  fastify.delete('/:id/reactions', { // Assuming reaction type/ID is in body or query? Or delete all user reactions? Needs clarification.
    // schema: removeReactionSchema,
    onRequest: [authMiddleware],
    handler: async (req, reply) => { reply.code(501).send('Not Implemented'); } 
  });

  // --- Draft Routes (Placeholder) ---
  // TODO: Implement Draft Schemas and Handlers
  fastify.get('/drafts', {
    // schema: getDraftsSchema,
    onRequest: [authMiddleware],
    handler: async (req, reply) => { reply.code(501).send('Not Implemented'); } 
  });
  
  fastify.post('/drafts', {
    // schema: saveDraftSchema,
    onRequest: [authMiddleware],
    handler: async (req, reply) => { reply.code(501).send('Not Implemented'); } 
  });

  fastify.delete('/drafts/:draftId', { // Assuming draft ID in path
    // schema: deleteDraftSchema,
    onRequest: [authMiddleware],
    handler: async (req, reply) => { reply.code(501).send('Not Implemented'); } 
  });

  // --- Specific Feed Routes (e.g., trending, popular) ---
  // Renamed from /feed/:type to avoid conflict with main /feed
  fastify.get<{ Params: { type: string }; Querystring: FeedQuery }>('/feeds/:type', { 
    schema: getFeedFastifySchema, 
    onRequest: [authOptionalMiddleware]
  }, getFeedHandler); 

  // --- Search Routes ---
  fastify.get<{ Querystring: SearchQuery }>('/search', {
    schema: searchContentFastifySchema,
    onRequest: [authOptionalMiddleware]
  }, searchContentHandler); // Call handler directly

  fastify.get<{ Querystring: SuggestionQuery }>('/search/suggestions', {
    schema: getSearchSuggestionsFastifySchema
    // No auth needed for suggestions? Verify this assumption.
  }, getSearchSuggestionsHandler); // Call handler directly

}
