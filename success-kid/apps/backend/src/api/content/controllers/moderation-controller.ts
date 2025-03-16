/**
 * Moderation Controller
 * 
 * Handles API endpoints for content moderation
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ModerationService } from '../../../services/moderation/moderation-service';
import { 
  createReportSchema, 
  reportResolutionSchema,
  ReportStatus
} from '../../../models/entities/moderation/report.model';
import { logger } from '../../../lib/logger';
import { handleApiError } from '../../../errors/handlers';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../errors';

// Query params schema for moderation queue
const moderationQueueQuerySchema = z.object({
  status: z.string().optional(),
  entityType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

/**
 * Report content
 */
export const reportContent = (moderationService: ModerationService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const bodyData = createReportSchema.omit({ reporter_id: true }).parse(request.body);
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Create report data with reporter ID
      const reportData = {
        ...bodyData,
        reporter_id: userId
      };
      
      // Create report
      const report = await moderationService.createReport(reportData);
      
      // Return created report
      return reply.code(201).send({
        data: report,
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
 * Get moderation queue (moderators/admins only)
 */
export const getModerationQueue = (moderationService: ModerationService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if user is moderator or admin
      if (!request.user.isModerator && !request.user.isAdmin) {
        throw new ForbiddenError('Only moderators and administrators can access the moderation queue');
      }
      
      // Parse and validate query params
      const query = moderationQueueQuerySchema.parse(request.query);
      
      // Get reports with details
      const reports = await moderationService.getModerationQueue({
        status: query.status as ReportStatus,
        entityType: query.entityType,
        limit: query.limit,
        offset: query.offset
      });
      
      // Return reports
      return reply.code(200).send({
        data: reports,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: {
          limit: query.limit,
          offset: query.offset,
          nextOffset: query.offset + reports.length
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get report counts by status (moderators/admins only)
 */
export const getReportCounts = (moderationService: ModerationService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if user is moderator or admin
      if (!request.user.isModerator && !request.user.isAdmin) {
        throw new ForbiddenError('Only moderators and administrators can access report counts');
      }
      
      // Get report counts
      const counts = await moderationService.getReportCounts();
      
      // Return counts
      return reply.code(200).send({
        data: counts,
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
 * Update report status (moderators/admins only)
 */
export const updateReportStatus = (moderationService: ModerationService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if user is moderator or admin
      if (!request.user.isModerator && !request.user.isAdmin) {
        throw new ForbiddenError('Only moderators and administrators can update report status');
      }
      
      // Validate request body
      const data = z.object({ status: z.enum(['pending', 'reviewing', 'resolved', 'rejected']) }).parse(request.body);
      
      // Update report status
      const report = await moderationService.updateReportStatus(id, data.status);
      
      if (!report) {
        throw new NotFoundError('Report', id);
      }
      
      // Return updated report
      return reply.code(200).send({
        data: report,
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
 * Resolve report (moderators/admins only)
 */
export const resolveReport = (moderationService: ModerationService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if user is moderator or admin
      if (!request.user.isModerator && !request.user.isAdmin) {
        throw new ForbiddenError('Only moderators and administrators can resolve reports');
      }
      
      // Validate request body
      const resolution = reportResolutionSchema.parse(request.body);
      
      // Resolve report
      const result = await moderationService.resolveReport(id, request.user.id, resolution);
      
      // Return result
      return reply.code(200).send({
        data: result,
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
 * Reject report (moderators/admins only)
 */
export const rejectReport = (moderationService: ModerationService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if user is moderator or admin
      if (!request.user.isModerator && !request.user.isAdmin) {
        throw new ForbiddenError('Only moderators and administrators can reject reports');
      }
      
      // Validate request body
      const data = z.object({ notes: z.string().optional() }).parse(request.body);
      
      // Reject report
      const report = await moderationService.rejectReport(id, request.user.id, data.notes);
      
      if (!report) {
        throw new NotFoundError('Report', id);
      }
      
      // Return updated report
      return reply.code(200).send({
        data: report,
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
