/**
 * Moderation API Handlers
 * 
 * Handlers for content moderation API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { validate } from '../../../middleware/validation';
import { z } from 'zod';
import { logger } from '../../../lib/logger';
import { ReportReasonEnum, ReportTargetTypeEnum } from '../../../models/content-report';
import { NotFoundError } from '../../../errors/api-errors';

// Request validation schemas
export const reportContentSchema = z.object({
  target_id: z.string().uuid(),
  target_type: ReportTargetTypeEnum,
  reason: ReportReasonEnum,
  description: z.string().max(1000).optional()
});

export const reportQueueQuerySchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']).optional(),
  target_type: ReportTargetTypeEnum.optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional()
});

export const reviewReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  resolution_notes: z.string().max(1000).optional()
});

export const reportParamsSchema = z.object({
  id: z.string().uuid()
});

/**
 * Report content
 */
export async function reportContent(
  request: FastifyRequest<{ Body: z.infer<typeof reportContentSchema> }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ 
        error: 'Authentication required' 
      });
    }
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const { target_id, target_type, reason, description } = request.body;
    
    const report = await contentService.reportContent(
      userId,
      target_id,
      target_type,
      reason,
      description
    );
    
    return reply.code(201).send({
      data: report,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error reporting content', { 
      error, 
      userId: request.user?.id, 
      body: request.body 
    });
    throw error;
  }
}

/**
 * Get report queue
 * This is an admin-only endpoint
 */
export async function getReportQueue(
  request: FastifyRequest<{ Querystring: z.infer<typeof reportQueueQuerySchema> }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ 
        error: 'Authentication required' 
      });
    }
    
    // TODO: Add proper admin permission check
    // For now, we'll just allow it for any authenticated user
    
    const { status = 'pending', target_type, limit = 20, offset = 0 } = request.query;
    
    // Get repository directly since ContentService doesn't expose this method
    const contentReportRepository = request.diContainer.resolve('db').repositories.contentReports;
    
    const reports = await contentReportRepository.getReportQueue({
      status,
      target_type,
      limit,
      offset
    });
    
    // Get pending count
    const pendingCount = await contentReportRepository.countPendingReports();
    
    return reply.send({
      data: reports,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        pendingCount
      }
    });
  } catch (error) {
    logger.error('Error getting report queue', { 
      error, 
      userId: request.user?.id, 
      query: request.query 
    });
    throw error;
  }
}

/**
 * Review report
 * This is an admin-only endpoint
 */
export async function reviewReport(
  request: FastifyRequest<{ 
    Params: z.infer<typeof reportParamsSchema>;
    Body: z.infer<typeof reviewReportSchema>;
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ 
        error: 'Authentication required' 
      });
    }
    
    // TODO: Add proper admin permission check
    // For now, we'll just allow it for any authenticated user
    
    const { id } = request.params;
    const { status, resolution_notes } = request.body;
    
    // Get repository directly since ContentService doesn't expose this method
    const contentReportRepository = request.diContainer.resolve('db').repositories.contentReports;
    
    const report = await contentReportRepository.reviewReport(
      id,
      userId,
      {
        status,
        resolution_notes
      }
    );
    
    if (!report) {
      throw new NotFoundError('Report');
    }
    
    return reply.send({
      data: report,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error reviewing report', { 
      error, 
      userId: request.user?.id, 
      reportId: request.params.id, 
      body: request.body 
    });
    throw error;
  }
}
