/**
 * Route definitions for the Forum API module
 */
import { FastifyInstance } from 'fastify';
import {
  getAllForumsFastifySchema,
  getForumBySlugFastifySchema,
  getCategoryWithThreadsFastifySchema,
  createThreadFastifySchema,
  getThreadWithRepliesFastifySchema,
  createThreadReplyFastifySchema,
  updateThreadFastifySchema,
  getUserThreadsFastifySchema,
  getTrendingThreadsFastifySchema
} from './schema';
import {
  getAllForumsHandler,
  getForumBySlugHandler,
  getCategoryWithThreadsHandler,
  createThreadHandler,
  getThreadWithRepliesHandler,
  createThreadReplyHandler,
  updateThreadHandler,
  getUserThreadsHandler,
  getTrendingThreadsHandler
} from './handler';
import {
  ForumSlugParam,
  CategoryIdParam,
  ThreadIdParam,
  UserIdParam,
  ThreadListingQuery,
  ThreadRepliesQuery,
  UserThreadsQuery,
  TrendingThreadsQuery,
  CreateThreadBody,
  UpdateThreadBody,
  ReplyContentBody
} from './types';
import { authMiddleware as authenticate } from '../../middleware/auth'; // Assuming this is the correct import
import { z } from 'zod';

/**
 * Registers the forum API routes
 * @param fastify - The Fastify instance
 */
export default async function forumApiRoutes(fastify: FastifyInstance): Promise<void> {
  // Note: Assumes ForumService is decorated onto fastify instance as fastify.forumService

  // Get all forums
  fastify.get('/forums', { schema: getAllForumsFastifySchema }, getAllForumsHandler);

  // Get forum by slug
  fastify.get<{ Params: ForumSlugParam }>('/forums/:slug', { schema: getForumBySlugFastifySchema }, getForumBySlugHandler);

  // Get category with threads
  fastify.get<{ Params: CategoryIdParam; Querystring: ThreadListingQuery }>('/categories/:id/threads', { schema: getCategoryWithThreadsFastifySchema }, getCategoryWithThreadsHandler);

  // Create a thread (requires authentication)
  fastify.post<{ Body: CreateThreadBody }>('/threads', {
    schema: createThreadFastifySchema,
    onRequest: [authenticate]
  }, createThreadHandler);

  // Get thread with replies
  fastify.get<{ Params: ThreadIdParam; Querystring: ThreadRepliesQuery }>('/threads/:id', { schema: getThreadWithRepliesFastifySchema }, getThreadWithRepliesHandler);

  // Create a reply to a thread (requires authentication)
  fastify.post<{ Params: ThreadIdParam; Body: ReplyContentBody }>('/threads/:id/replies', {
    schema: createThreadReplyFastifySchema,
    onRequest: [authenticate]
  }, createThreadReplyHandler);

  // Update a thread (requires authentication)
  fastify.put<{ Params: ThreadIdParam; Body: UpdateThreadBody }>('/threads/:id', {
    schema: updateThreadFastifySchema,
    onRequest: [authenticate]
  }, updateThreadHandler);

  // Get user's threads (requires authentication)
  fastify.get<{ Params: UserIdParam; Querystring: UserThreadsQuery }>('/users/:id/threads', {
    schema: getUserThreadsFastifySchema,
    onRequest: [authenticate]
  }, getUserThreadsHandler);

  // Get trending threads
  fastify.get<{ Querystring: TrendingThreadsQuery }>('/trending-threads', { schema: getTrendingThreadsFastifySchema }, getTrendingThreadsHandler);
}
