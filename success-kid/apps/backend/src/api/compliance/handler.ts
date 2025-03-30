/**
 * Request Handlers for the Compliance API module
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { gdprService, RequestType } from '../../compliance/gdpr/service';
import { complianceReportingService } from '../../compliance/reporting/service';
// Assuming authMiddleware and roleMiddleware are applied at the route level or plugin level
// import { authMiddleware, roleMiddleware } from '../../middleware/auth';
import { ValidationError } from '../../errors/base-error'; // Assuming this exists
import {
  GdprRequestBody,
  GdprRequestIdParam,
  ConsentRequestBody,
  ConsentPurposeParam,
  ReportRequestBody,
  ReportIdParam,
  ListReportsQuery,
  FrameworkIdParam
} from './types';

/**
 * Handler for creating GDPR data subject request
 */
export async function createGdprRequestHandler(
  request: FastifyRequest<{ Body: GdprRequestBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    if (!request.user?.id) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { type } = request.body;

    const dataRequest = await gdprService.createDataRequest(request.user.id, type);

    return reply.code(200).send({
      data: {
        id: dataRequest.id,
        type: dataRequest.type,
        status: dataRequest.status,
        createdAt: dataRequest.createdAt.toISOString()
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error creating data subject request', { error });
    // Consider specific error handling, e.g., for validation errors
    return reply.code(500).send({ error: 'Failed to create GDPR request' });
  }
}

/**
 * Handler for getting GDPR data subject request status
 */
export async function getGdprRequestStatusHandler(
  request: FastifyRequest<{ Params: GdprRequestIdParam }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    if (!request.user?.id) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { id } = request.params;

    const dataRequest = await gdprService.getDataRequestStatus(id);

    if (!dataRequest) {
        return reply.code(404).send({ error: 'Request not found' });
    }

    // Ensure user can only access their own requests (or admin)
    // @ts-ignore - Assuming request.user.role exists
    if (dataRequest.userId !== request.user.id && request.user.role !== 'admin') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    return reply.code(200).send({
      data: {
        id: dataRequest.id,
        type: dataRequest.type,
        status: dataRequest.status,
        createdAt: dataRequest.createdAt.toISOString(),
        completedAt: dataRequest.completedAt?.toISOString(),
        data: dataRequest.data // Be cautious about returning sensitive data
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting data subject request', { error });
    return reply.code(500).send({ error: 'Failed to retrieve GDPR request status' });
  }
}

/**
 * Handler for requesting data export
 */
export async function requestDataExportHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    if (!request.user?.id) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Note: This should likely be an async process.
    // Returning 202 Accepted and providing status via getGdprRequestStatusHandler is better.
    const result = await gdprService.processDataExport(request.user.id);

    return reply.code(200).send({ // Consider 202 Accepted
      data: {
        exportId: result.exportId,
        fileSize: result.fileSize,
        fileFormat: result.fileFormat,
        downloadUrl: result.downloadUrl, // Only include if immediately available
        expiresAt: result.expiresAt.toISOString() // Only include if immediately available
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error processing data export', { error });
    return reply.code(500).send({ error: 'Failed to process data export request' });
  }
}

/**
 * Handler for requesting data deletion
 */
export async function requestDataDeletionHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    if (!request.user?.id) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Note: This should likely be an async process.
    // Returning 202 Accepted and providing status via getGdprRequestStatusHandler is better.
    const result = await gdprService.processDataDeletion(request.user.id);

    return reply.code(200).send({ // Consider 202 Accepted
      data: result, // Contains success, deletedCategories, etc.
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error processing data deletion', { error });
    return reply.code(500).send({ error: 'Failed to process data deletion request' });
  }
}

/**
 * Handler for getting data categories
 */
export async function getDataCategoriesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    if (!request.user?.id) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const categories = await gdprService.getUserDataCategories(request.user.id);

    return reply.code(200).send({
      data: categories,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting data categories', { error });
    return reply.code(500).send({ error: 'Failed to retrieve data categories' });
  }
}

/**
 * Handler for managing consent
 */
export async function manageConsentHandler(
  request: FastifyRequest<{ Body: ConsentRequestBody }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    if (!request.user?.id) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { purpose, granted } = request.body;

    const consent = await gdprService.recordConsent(request.user.id, purpose, granted);

    return reply.code(200).send({
      data: {
        id: consent.id,
        purpose: consent.purpose,
        granted: consent.granted,
        timestamp: consent.timestamp.toISOString()
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error recording consent', { error });
    return reply.code(500).send({ error: 'Failed to record consent' });
  }
}

/**
 * Handler for withdrawing consent
 */
export async function withdrawConsentHandler(
  request: FastifyRequest<{ Params: ConsentPurposeParam }>,
  reply: FastifyReply
) {
  try {
    // @ts-ignore - Assuming request.user is populated by authentication middleware
    if (!request.user?.id) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { purpose } = request.params;

    await gdprService.withdrawConsent(request.user.id, purpose);

    return reply.code(200).send({
      data: {
        success: true,
        purpose
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error withdrawing consent', { error });
    return reply.code(500).send({ error: 'Failed to withdraw consent' });
  }
}

// --- Admin Handlers ---

/**
 * Handler for generating compliance report (Admin only)
 */
export async function generateComplianceReportHandler(
  request: FastifyRequest<{ Body: ReportRequestBody }>,
  reply: FastifyReply
) {
  try {
    // Admin check should be done via middleware (roleMiddleware(['admin']))

    const { type, period } = request.body;

    // Parse period dates
    const startDate = new Date(period.start);
    const endDate = new Date(period.end);

    // Validate dates if necessary
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid date format for period');
    }

    // Note: This should likely be an async process.
    // Returning 202 Accepted and providing status via getComplianceReportHandler is better.
    const report = await complianceReportingService.generateReport(type, {
      start: startDate,
      end: endDate
    });

    return reply.code(200).send({ // Consider 202 Accepted
      data: {
        id: report.id,
        type: report.type,
        period: {
          start: report.period.start.toISOString(),
          end: report.period.end.toISOString()
        },
        status: report.status,
        createdAt: report.createdAt.toISOString()
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error generating compliance report', { error });
    return reply.code(500).send({ error: 'Failed to generate compliance report' });
  }
}

/**
 * Handler for getting specific report by ID (Admin only)
 */
export async function getComplianceReportHandler(
  request: FastifyRequest<{ Params: ReportIdParam }>,
  reply: FastifyReply
) {
  try {
    // Admin check should be done via middleware

    const { id } = request.params;

    const report = await complianceReportingService.getReportById(id);

    if (!report) {
        return reply.code(404).send({ error: 'Report not found' });
    }

    return reply.code(200).send({
      data: {
        id: report.id,
        type: report.type,
        period: {
          start: report.period.start.toISOString(),
          end: report.period.end.toISOString()
        },
        status: report.status,
        data: report.data, // Report content
        createdAt: report.createdAt.toISOString()
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting compliance report', { error });
    return reply.code(500).send({ error: 'Failed to retrieve compliance report' });
  }
}

/**
 * Handler for listing reports (Admin only)
 */
export async function listComplianceReportsHandler(
  request: FastifyRequest<{ Querystring: ListReportsQuery }>,
  reply: FastifyReply
) {
  try {
    // Admin check should be done via middleware

    const { type, status, fromDate, toDate } = request.query;

    // Build filter
    const filter: any = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (fromDate) filter.fromDate = new Date(fromDate);
    if (toDate) filter.toDate = new Date(toDate);

    // Validate dates if necessary
    if (filter.fromDate && isNaN(filter.fromDate.getTime())) {
        throw new ValidationError('Invalid fromDate format');
    }
    if (filter.toDate && isNaN(filter.toDate.getTime())) {
        throw new ValidationError('Invalid toDate format');
    }


    const reports = await complianceReportingService.listReports(filter);

    return reply.code(200).send({
      data: reports.map(report => ({
        id: report.id,
        type: report.type,
        period: {
          start: report.period.start.toISOString(),
          end: report.period.end.toISOString()
        },
        status: report.status,
        createdAt: report.createdAt.toISOString()
      })),
      meta: {
        timestamp: new Date().toISOString(),
        total: reports.length // This might need adjustment if pagination is added server-side
      }
    });
  } catch (error) {
    logger.error('Error listing compliance reports', { error });
    return reply.code(500).send({ error: 'Failed to list compliance reports' });
  }
}

/**
 * Handler for getting compliance frameworks (Admin only)
 */
export async function getComplianceFrameworksHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Admin check should be done via middleware

    const frameworks = await complianceReportingService.getFrameworks();

    return reply.code(200).send({
      data: frameworks.map(framework => ({
        id: framework.id,
        name: framework.name,
        version: framework.version,
        description: framework.description,
        enabled: framework.enabled,
        controlCount: framework.controls.length
      })),
      meta: {
        timestamp: new Date().toISOString(),
        total: frameworks.length
      }
    });
  } catch (error) {
    logger.error('Error getting compliance frameworks', { error });
    return reply.code(500).send({ error: 'Failed to retrieve compliance frameworks' });
  }
}

/**
 * Handler for assessing compliance against a framework (Admin only)
 */
export async function assessComplianceHandler(
  request: FastifyRequest<{ Params: FrameworkIdParam }>,
  reply: FastifyReply
) {
  try {
    // Admin check should be done via middleware

    const { id } = request.params;

    // Note: This should likely be an async process.
    // Returning 202 Accepted and providing status via another endpoint might be better.
    const assessment = await complianceReportingService.assessCompliance(id);

    return reply.code(200).send({ // Consider 202 Accepted
      data: {
        frameworkId: assessment.frameworkId,
        frameworkName: assessment.frameworkName,
        timestamp: assessment.timestamp.toISOString(),
        overallScore: assessment.overallScore,
        controlResults: assessment.controlResults,
        gaps: assessment.gaps
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error assessing compliance', { error });
    return reply.code(500).send({ error: 'Failed to assess compliance' });
  }
}
