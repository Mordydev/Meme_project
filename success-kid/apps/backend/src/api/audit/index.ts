/**
 * Audit API Routes
 * 
 * Routes for audit and reconciliation endpoints
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { validate } from '../../middleware/validation';
import { checkAdminAccess } from '../../middleware/auth';
import {
  runReconciliation,
  getDiscrepancies,
  resolveDiscrepancy,
  runSystemAudit,
  getAuditSummary
} from './handlers';

// Schema for date range
const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string()
});

// Schema for discrepancy query
const discrepancyQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  types: z.string().optional(),
  resolved: z.enum(['true', 'false']).optional(),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .pipe(z.number().int().positive().optional()),
  offset: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .pipe(z.number().int().min(0).optional())
});

// Schema for discrepancy ID
const discrepancyIdSchema = z.object({
  id: z.string()
});

// Schema for resolution
const resolutionSchema = z.object({
  action: z.enum(['reprocess', 'mark_resolved', 'refund', 'manual_update']),
  notes: z.string().min(5),
  updatedStatus: z.string().optional()
});

// Schema for audit summary query
const auditSummaryQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Routes plugin
const auditRoutes: FastifyPluginAsync = async (fastify) => {
  // All audit routes require admin access
  fastify.addHook('preHandler', checkAdminAccess('audit:admin'));
  
  /**
   * POST /api/v1/admin/audit/reconciliation
   * Run reconciliation for a time period
   */
  fastify.post(
    '/admin/audit/reconciliation',
    {
      preHandler: [
        validate(dateRangeSchema)
      ]
    },
    runReconciliation
  );
  
  /**
   * GET /api/v1/admin/audit/discrepancies
   * Get discrepancies
   */
  fastify.get(
    '/admin/audit/discrepancies',
    {
      preHandler: [
        validate(discrepancyQuerySchema, { source: 'query' })
      ]
    },
    getDiscrepancies
  );
  
  /**
   * POST /api/v1/admin/audit/discrepancies/:id/resolve
   * Resolve a discrepancy
   */
  fastify.post(
    '/admin/audit/discrepancies/:id/resolve',
    {
      preHandler: [
        validate(discrepancyIdSchema, { source: 'params' }),
        validate(resolutionSchema)
      ]
    },
    resolveDiscrepancy
  );
  
  /**
   * POST /api/v1/admin/audit/system
   * Run system audit
   */
  fastify.post(
    '/admin/audit/system',
    {
      preHandler: [
        validate(dateRangeSchema)
      ]
    },
    runSystemAudit
  );
  
  /**
   * GET /api/v1/admin/audit/summary
   * Get audit summary
   */
  fastify.get(
    '/admin/audit/summary',
    {
      preHandler: [
        validate(auditSummaryQuerySchema, { source: 'query' })
      ]
    },
    getAuditSummary
  );
};

export default auditRoutes;
