/**
 * Route definitions for the Compliance API module
 */
import { FastifyInstance } from 'fastify';
import {
  createGdprRequestSchema,
  getGdprRequestStatusSchema,
  requestDataExportSchema,
  requestDataDeletionSchema,
  getDataCategoriesSchema,
  manageConsentSchema,
  withdrawConsentSchema,
  generateComplianceReportSchema,
  getComplianceReportSchema,
  listComplianceReportsSchema,
  getComplianceFrameworksSchema,
  assessComplianceSchema
} from './schema';
import {
  createGdprRequestHandler,
  getGdprRequestStatusHandler,
  requestDataExportHandler,
  requestDataDeletionHandler,
  getDataCategoriesHandler,
  manageConsentHandler,
  withdrawConsentHandler,
  generateComplianceReportHandler,
  getComplianceReportHandler,
  listComplianceReportsHandler,
  getComplianceFrameworksHandler,
  assessComplianceHandler
} from './handler';
// Assuming authMiddleware and roleMiddleware are available or registered globally/via plugin
// import { authMiddleware, roleMiddleware } from '../../middleware/auth';

/**
 * Registers the compliance API routes
 * @param fastify - The Fastify instance
 */
export default async function complianceRoutes(fastify: FastifyInstance): Promise<void> {

  // Apply authentication to all routes in this plugin
  // Note: This assumes authMiddleware is available on the fastify instance
  // If not, apply it individually to each route that requires it.
  // fastify.addHook('preHandler', authMiddleware); // Removed as per original index.ts structure

  // --- GDPR Routes ---
  fastify.post('/gdpr/request', {
    schema: createGdprRequestSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, createGdprRequestHandler);

  fastify.get('/gdpr/request/:id', {
    schema: getGdprRequestStatusSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getGdprRequestStatusHandler);

  fastify.post('/gdpr/export', {
    schema: requestDataExportSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, requestDataExportHandler);

  fastify.post('/gdpr/deletion', {
    schema: requestDataDeletionSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, requestDataDeletionHandler);

  fastify.get('/gdpr/categories', {
    schema: getDataCategoriesSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getDataCategoriesHandler);

  fastify.post('/gdpr/consent', {
    schema: manageConsentSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, manageConsentHandler);

  fastify.delete('/gdpr/consent/:purpose', {
    schema: withdrawConsentSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, withdrawConsentHandler);

  // --- Admin Compliance Routes ---
  // Note: Applying roleMiddleware assumes it's available on the fastify instance
  // and properly configured.

  fastify.post('/reports', {
    schema: generateComplianceReportSchema,
    // @ts-ignore
    preHandler: [fastify.authenticate, fastify.roleMiddleware(['admin'])] // Example admin check
  }, generateComplianceReportHandler);

  fastify.get('/reports/:id', {
    schema: getComplianceReportSchema,
    // @ts-ignore
    preHandler: [fastify.authenticate, fastify.roleMiddleware(['admin'])]
  }, getComplianceReportHandler);

  fastify.get('/reports', {
    schema: listComplianceReportsSchema,
    // @ts-ignore
    preHandler: [fastify.authenticate, fastify.roleMiddleware(['admin'])]
  }, listComplianceReportsHandler);

  fastify.get('/frameworks', {
    schema: getComplianceFrameworksSchema,
    // @ts-ignore
    preHandler: [fastify.authenticate, fastify.roleMiddleware(['admin'])]
  }, getComplianceFrameworksHandler);

  fastify.post('/frameworks/:id/assess', {
    schema: assessComplianceSchema,
    // @ts-ignore
    preHandler: [fastify.authenticate, fastify.roleMiddleware(['admin'])]
  }, assessComplianceHandler);
}
