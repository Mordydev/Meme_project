/**
 * Request Handlers for the Forum API module
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ForumService } from '../../services/forum/forum-service'; // Assuming service exists
import { logger } from '../../lib/logger';
import { NotFoundError, ValidationError, ForbiddenError } from '../../errors'; // Assuming these exist
import { handleApiError } from '../../errors/handlers'; // Assuming this exists
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
  ReplyContentBody,
  threadListingQuerySchema, // Import Zod schemas for validation
  threadRepliesQuerySchema,
  userThreadsQuerySchema,
  trendingThreadsQuerySchema,
  createThreadApiSchema,
  updateThreadApiSchema,
  replyContentSchema
} from './types';

// Helper to get forumService from the request instance
function getForumService(request: FastifyRequest): any { // Use 'any' for now, assuming decoration
    // @ts-ignore - Assuming forumService is decorated onto the fastify instance
    if (!request.server.forumService) {
        throw new Error('ForumService not found on Fastify instance');
    }
    // @ts-ignore
    return request.server.forumService;
}

// --- Handlers from forum-controller.ts ---

/**
 * Get all forums
 */
export async function getAllForumsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const forums = await forumService.getAllForums();
    return reply.code(200).send({
      data: forums,
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Get forum by slug
 */
export async function getForumBySlugHandler(
  request: FastifyRequest<{ Params: ForumSlugParam }>,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const { slug } = request.params;
    const forum = await forumService.getForumBySlug(slug);
     if (!forum) {
        throw new NotFoundError('Forum', slug);
    }
    return reply.code(200).send({
      data: forum,
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
    return handleApiError(request, reply, error);
  }
}

/**
 * Get category with threads
 */
export async function getCategoryWithThreadsHandler(
  request: FastifyRequest<{ Params: CategoryIdParam; Querystring: ThreadListingQuery }>,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const { id } = request.params;
    const query = threadListingQuerySchema.parse(request.query);
    const category = await forumService.getCategoryWithThreads(id, query);
     if (!category) {
        throw new NotFoundError('Category', id);
    }
    return reply.code(200).send({
      data: category,
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
      pagination: {
        limit: query.limit,
        offset: query.offset,
        nextOffset: query.offset + (category.threads?.length || 0)
      }
    });
  } catch (error) {
     if (error instanceof z.ZodError) {
        return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}

// --- Handlers from thread-controller.ts ---

/**
 * Create a thread
 */
export async function createThreadHandler(
  request: FastifyRequest<{ Body: CreateThreadBody }>,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const data = createThreadApiSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const thread = await forumService.createThread(userId, data);
    return reply.code(201).send({
      data: thread,
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
 * Get thread with replies
 */
export async function getThreadWithRepliesHandler(
  request: FastifyRequest<{ Params: ThreadIdParam; Querystring: ThreadRepliesQuery }>,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const { id } = request.params;
    const query = threadRepliesQuerySchema.parse(request.query);
    const thread = await forumService.getThreadWithReplies(id, query);
     if (!thread) {
        throw new NotFoundError('Thread', id);
    }
    return reply.code(200).send({
      data: thread,
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
      pagination: {
        limit: query.limit,
        offset: query.offset,
        nextOffset: query.offset + (thread.replies?.length || 0)
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
 * Create a reply to a thread
 */
export async function createThreadReplyHandler(
  request: FastifyRequest<{ Params: ThreadIdParam; Body: ReplyContentBody }>,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const { id } = request.params; // Thread ID
    const data = replyContentSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const threadReply = await forumService.createThreadReply(userId, id, data);
    return reply.code(201).send({
      data: threadReply,
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
 * Update a thread
 */
export async function updateThreadHandler(
  request: FastifyRequest<{ Params: ThreadIdParam; Body: UpdateThreadBody }>,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const { id } = request.params;
    const data = updateThreadApiSchema.parse(request.body);
    // @ts-ignore - Assuming request.user is populated
    const userId = request.user.id;
    const thread = await forumService.updateThread(id, userId, data);
    return reply.code(200).send({
      data: thread,
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
 * Get user's threads
 */
export async function getUserThreadsHandler(
  request: FastifyRequest<{ Params: UserIdParam; Querystring: UserThreadsQuery }>,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const { id } = request.params; // User ID
    const query = userThreadsQuerySchema.parse(request.query);

    // Check if requesting own threads or has permission
    // @ts-ignore - Assuming request.user is populated
    if (id !== request.user.id) {
      // Add permission check if necessary
      // For now, assume public viewing is allowed or handled by service
    }

    const threads = await forumService.getUserThreads(id, query);
    return reply.code(200).send({
      data: threads,
      meta: { timestamp: new Date().toISOString(), requestId: request.id },
      pagination: {
        limit: query.limit,
        offset: query.offset,
        nextOffset: query.offset + threads.length
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
 * Get trending threads
 */
export async function getTrendingThreadsHandler(
  request: FastifyRequest<{ Querystring: TrendingThreadsQuery }>,
  reply: FastifyReply
) {
  const forumService = getForumService(request);
  try {
    const query = trendingThreadsQuerySchema.parse(request.query);
    const threads = await forumService.getTrendingThreads(query);
    return reply.code(200).send({
      data: threads,
      meta: { timestamp: new Date().toISOString(), requestId: request.id }
    });
  } catch (error) {
     if (error instanceof z.ZodError) {
        return reply.code(400).send({ errors: error.errors });
    }
    return handleApiError(request, reply, error);
  }
}
