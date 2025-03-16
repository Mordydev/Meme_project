/**
 * Analytics Controller
 * 
 * Handles API endpoints for content analytics
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ContentAnalyticsService, TimeFrame } from '../../../services/content/analytics/content-analytics-service';
import { logger } from '../../../lib/logger';
import { handleApiError } from '../../../errors/handlers';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../errors';

// Query params schema for content metrics
const contentMetricsQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'year', 'all']).default('month')
});

// Query params schema for user metrics
const userMetricsQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'year', 'all']).default('month')
});

// Query params schema for trending topics
const trendingTopicsQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month']).default('day'),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

// View tracking body schema
const viewTrackingSchema = z.object({
  contentId: z.string().uuid(),
  sessionId: z.string().optional(),
  sourceType: z.string().optional(),
  referrer: z.string().optional()
});

/**
 * Track content view
 */
export const trackContentView = (analyticsService: ContentAnalyticsService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const data = viewTrackingSchema.parse(request.body);
      
      // Track view
      const tracked = await analyticsService.trackView({
        contentId: data.contentId,
        userId: request.user?.id,
        sessionId: data.sessionId,
        sourceType: data.sourceType,
        referrer: data.referrer
      });
      
      // Return result
      return reply.code(200).send({
        data: { tracked },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get content metrics
 */
export const getContentMetrics = (analyticsService: ContentAnalyticsService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Parse and validate query params
      const query = contentMetricsQuerySchema.parse(request.query);
      
      // Get metrics
      const metrics = await analyticsService.getContentMetrics(id, query.timeframe);
      
      // Return metrics
      return reply.code(200).send({
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          timeframe: query.timeframe
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get user engagement metrics
 */
export const getUserEngagementMetrics = (analyticsService: ContentAnalyticsService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if requesting user is the profile owner or admin
      if (request.user.id !== id && !request.user.isAdmin) {
        throw new ForbiddenError('You can only view your own engagement metrics');
      }
      
      // Parse and validate query params
      const query = userMetricsQuerySchema.parse(request.query);
      
      // Get metrics
      const metrics = await analyticsService.getUserEngagementMetrics(id, query.timeframe);
      
      // Return metrics
      return reply.code(200).send({
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          timeframe: query.timeframe
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get trending topics
 */
export const getTrendingTopics = (analyticsService: ContentAnalyticsService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse and validate query params
      const query = trendingTopicsQuerySchema.parse(request.query);
      
      // Get trending topics
      const topics = await analyticsService.getTrendingTopics(query.timeframe, query.limit);
      
      // Return topics
      return reply.code(200).send({
        data: topics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          timeframe: query.timeframe
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};
