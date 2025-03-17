/**
 * Audit API Handlers
 * 
 * Handlers for audit and reconciliation endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { Resolution } from '../../services/audit/reconciliation-service';

/**
 * Run reconciliation for a time period
 * POST /api/v1/admin/audit/reconciliation
 */
export async function runReconciliation(
  request: FastifyRequest<{
    Body: {
      startDate: string;
      endDate: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { startDate, endDate } = request.body;
    
    // Get audit service from container
    const { auditService } = request.diContainer.resolve('services');
    
    // Parse dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Validate date range
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    if (startDateObj > endDateObj) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before end date'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Get reconciliation service
    const reconciliationService = auditService.getReconciliationService();
    
    // Run reconciliation
    const result = await reconciliationService.reconcileRedemptions(startDateObj, endDateObj);
    
    // Return response
    return reply.send({
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error running reconciliation', { error });
    
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to run reconciliation'
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Get discrepancies
 * GET /api/v1/admin/audit/discrepancies
 */
export async function getDiscrepancies(
  request: FastifyRequest<{
    Querystring: {
      startDate?: string;
      endDate?: string;
      types?: string;
      resolved?: string;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { 
      startDate, 
      endDate, 
      types,
      resolved,
      limit,
      offset
    } = request.query;
    
    // Get audit service from container
    const { auditService } = request.diContainer.resolve('services');
    
    // Parse query parameters
    const queryOptions: any = {};
    
    if (startDate) {
      queryOptions.startDate = new Date(startDate);
    }
    
    if (endDate) {
      queryOptions.endDate = new Date(endDate);
    }
    
    if (types) {
      queryOptions.types = types.split(',');
    }
    
    if (resolved !== undefined) {
      queryOptions.resolved = resolved === 'true';
    }
    
    if (limit) {
      queryOptions.limit = parseInt(limit, 10);
    }
    
    if (offset) {
      queryOptions.offset = parseInt(offset, 10);
    }
    
    // Get reconciliation service
    const reconciliationService = auditService.getReconciliationService();
    
    // Get discrepancies
    const discrepancies = await reconciliationService.findDiscrepancies(queryOptions);
    
    // Return response
    return reply.send({
      data: discrepancies,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        count: discrepancies.length
      }
    });
  } catch (error) {
    request.log.error('Error getting discrepancies', { error });
    
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to get discrepancies'
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Resolve a discrepancy
 * POST /api/v1/admin/audit/discrepancies/:id/resolve
 */
export async function resolveDiscrepancy(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: Resolution;
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const resolution = request.body;
    
    // Get audit service from container
    const { auditService } = request.diContainer.resolve('services');
    
    // Get reconciliation service
    const reconciliationService = auditService.getReconciliationService();
    
    // Resolve discrepancy
    const success = await reconciliationService.resolveDiscrepancy(id, resolution);
    
    if (!success) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'RESOLUTION_FAILED',
          message: 'Failed to resolve discrepancy'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Return response
    return reply.send({
      data: {
        success: true,
        discrepancyId: id,
        resolution,
        resolvedAt: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error resolving discrepancy', { error });
    
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to resolve discrepancy'
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Run system audit
 * POST /api/v1/admin/audit/system
 */
export async function runSystemAudit(
  request: FastifyRequest<{
    Body: {
      startDate: string;
      endDate: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { startDate, endDate } = request.body;
    
    // Get audit service from container
    const { auditService } = request.diContainer.resolve('services');
    
    // Parse dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Validate date range
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    if (startDateObj > endDateObj) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before end date'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Run system audit
    const result = await auditService.runSystemAudit(startDateObj, endDateObj);
    
    // Return response
    return reply.send({
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error running system audit', { error });
    
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to run system audit'
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Get audit summary
 * GET /api/v1/admin/audit/summary
 */
export async function getAuditSummary(
  request: FastifyRequest<{
    Querystring: {
      startDate?: string;
      endDate?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { startDate, endDate } = request.query;
    
    // Get audit service from container
    const { auditService } = request.diContainer.resolve('services');
    
    // Default to last 30 days if not specified
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate 
      ? new Date(startDate) 
      : new Date(endDateObj.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Validate date range
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    if (startDateObj > endDateObj) {
      return reply.code(400).send({
        data: null,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Start date must be before end date'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Generate audit summary
    const summary = await auditService.generateAuditSummary(startDateObj, endDateObj);
    
    // Return response
    return reply.send({
      data: summary,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error getting audit summary', { error });
    
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to get audit summary'
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
