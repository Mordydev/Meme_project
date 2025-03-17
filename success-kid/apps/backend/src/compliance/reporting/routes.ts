/**
 * Compliance Reporting Routes
 * 
 * API routes for compliance reporting
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { checkAdminAccess } from '../../middleware/auth';
import { reportingService } from './service';
import { Period, ReportFilter, ExportFormat } from './types';
import { logger } from '../../lib/logger';

/**
 * Register compliance reporting routes with Fastify
 * 
 * @param fastify Fastify instance
 */
export async function reportingRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply admin access check to all routes
  fastify.addHook('preHandler', checkAdminAccess('compliance'));
  
  /**
   * Get all compliance frameworks
   */
  fastify.get('/frameworks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const frameworks = reportingService.getFrameworks();
      
      return {
        data: frameworks,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error getting compliance frameworks', { error });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get compliance frameworks'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Get a specific compliance framework
   */
  fastify.get<{
    Params: {
      frameworkId: string;
    };
  }>('/frameworks/:frameworkId', async (request, reply) => {
    try {
      const framework = reportingService.getFramework(request.params.frameworkId);
      
      if (!framework) {
        return reply.code(404).send({
          data: null,
          errors: [{
            code: 'NOT_FOUND',
            message: 'Compliance framework not found'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      return {
        data: framework,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error getting compliance framework', {
        error,
        frameworkId: request.params.frameworkId
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get compliance framework'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Generate a compliance report
   */
  fastify.post<{
    Body: {
      data: {
        type: string;
        period: Period;
      };
    };
  }>('/reports', async (request, reply) => {
    try {
      const { type, period } = request.body.data;
      
      // Parse date strings to Date objects if needed
      const parsedPeriod = {
        start: period.start instanceof Date ? period.start : new Date(period.start),
        end: period.end instanceof Date ? period.end : new Date(period.end)
      };
      
      const report = await reportingService.generateReport(type, parsedPeriod);
      
      return {
        data: report,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error generating compliance report', {
        error,
        type: request.body.data.type,
        period: request.body.data.period
      });
      
      const errorMessage = error.message || 'Failed to generate compliance report';
      
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'REPORT_GENERATION_ERROR',
          message: errorMessage
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Get a report by ID
   */
  fastify.get<{
    Params: {
      reportId: string;
    };
  }>('/reports/:reportId', async (request, reply) => {
    try {
      const report = await reportingService.getReportById(request.params.reportId);
      
      if (!report) {
        return reply.code(404).send({
          data: null,
          errors: [{
            code: 'NOT_FOUND',
            message: 'Compliance report not found'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      return {
        data: report,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error getting compliance report', {
        error,
        reportId: request.params.reportId
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get compliance report'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * List reports
   */
  fastify.get<{
    Querystring: {
      type?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      limit?: number;
      offset?: number;
    };
  }>('/reports', async (request, reply) => {
    try {
      const filter: ReportFilter = {};
      
      // Apply query filters
      if (request.query.type) {
        filter.type = request.query.type;
      }
      
      if (request.query.startDate) {
        filter.startDate = new Date(request.query.startDate);
      }
      
      if (request.query.endDate) {
        filter.endDate = new Date(request.query.endDate);
      }
      
      if (request.query.status) {
        filter.status = request.query.status as any;
      }
      
      if (request.query.limit) {
        filter.limit = request.query.limit;
      }
      
      if (request.query.offset) {
        filter.offset = request.query.offset;
      }
      
      const reports = await reportingService.listReports(filter);
      
      return {
        data: reports,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error listing compliance reports', {
        error,
        query: request.query
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to list compliance reports'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Export a report
   */
  fastify.get<{
    Params: {
      reportId: string;
    };
    Querystring: {
      format: ExportFormat;
    };
  }>('/reports/:reportId/export', async (request, reply) => {
    try {
      const { reportId } = request.params;
      const format = request.query.format || 'pdf';
      
      const exportResult = await reportingService.exportReport(reportId, format);
      
      return {
        data: exportResult,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error exporting compliance report', {
        error,
        reportId: request.params.reportId,
        format: request.query.format
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to export compliance report'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Assess compliance for a framework
   */
  fastify.post<{
    Params: {
      frameworkId: string;
    };
  }>('/frameworks/:frameworkId/assess', async (request, reply) => {
    try {
      const { frameworkId } = request.params;
      
      const assessment = await reportingService.assessCompliance(frameworkId);
      
      return {
        data: assessment,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error assessing compliance', {
        error,
        frameworkId: request.params.frameworkId
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to assess compliance'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  fastify.log.info('Compliance reporting routes registered');
}
