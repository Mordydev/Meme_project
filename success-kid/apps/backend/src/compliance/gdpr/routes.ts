/**
 * GDPR Routes
 * 
 * API routes for GDPR compliance features
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { gdprService } from './service';
import { consentService } from './consent';
import { exportService } from './export';
import { DataSubjectRequestType } from './types';
import { logger } from '../../lib/logger';

/**
 * Register GDPR routes with Fastify
 * 
 * @param fastify Fastify instance
 */
export async function gdprRoutes(fastify: FastifyInstance): Promise<void> {
  // Apply auth to all routes
  fastify.addHook('preHandler', requireAuth);
  
  /**
   * Get user's data subject requests
   */
  fastify.get('/requests', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const requests = await gdprService.getUserRequests(request.user.id);
      
      return {
        data: requests,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error getting user requests', { error, userId: request.user.id });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get data subject requests'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Create a data subject request
   */
  fastify.post<{
    Body: {
      data: {
        type: DataSubjectRequestType;
        notes?: string;
      };
    };
  }>('/requests', async (request, reply) => {
    try {
      const { type, notes } = request.body.data;
      
      const newRequest = await gdprService.createDataRequest(
        request.user.id,
        type,
        notes
      );
      
      return {
        data: newRequest,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error creating data subject request', {
        error,
        userId: request.user.id,
        requestType: request.body.data.type
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to create data subject request'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Get a data subject request by ID
   */
  fastify.get<{
    Params: {
      requestId: string;
    };
  }>('/requests/:requestId', async (request, reply) => {
    try {
      const dataRequest = await gdprService.getDataRequestById(request.params.requestId);
      
      if (!dataRequest) {
        return reply.code(404).send({
          data: null,
          errors: [{
            code: 'NOT_FOUND',
            message: 'Data subject request not found'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      // Verify user owns this request
      if (dataRequest.userId !== request.user.id) {
        return reply.code(403).send({
          data: null,
          errors: [{
            code: 'FORBIDDEN',
            message: 'Access denied'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      return {
        data: dataRequest,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error getting data subject request', {
        error,
        userId: request.user.id,
        requestId: request.params.requestId
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get data subject request'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Request data export
   */
  fastify.post('/export', async (request, reply) => {
    try {
      // Process data export
      const exportResult = await gdprService.processDataExport(request.user.id);
      
      return {
        data: exportResult,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error processing data export', {
        error,
        userId: request.user.id
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to process data export'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Download data export
   */
  fastify.get<{
    Params: {
      exportId: string;
    };
  }>('/export/:exportId/download', async (request, reply) => {
    try {
      // Get export
      const export_ = await exportService.getExport(request.params.exportId);
      
      if (!export_) {
        return reply.code(404).send({
          data: null,
          errors: [{
            code: 'NOT_FOUND',
            message: 'Export not found'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      // Verify user owns this export
      if (export_.user_id !== request.user.id) {
        return reply.code(403).send({
          data: null,
          errors: [{
            code: 'FORBIDDEN',
            message: 'Access denied'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      // Check if export is still valid
      if (export_.expires_at < new Date()) {
        return reply.code(410).send({
          data: null,
          errors: [{
            code: 'EXPIRED',
            message: 'Export has expired'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      // Send file
      return reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename=data-export-${request.params.exportId}.json`)
        .sendFile(export_.file_path);
    } catch (error) {
      logger.error('Error downloading export', {
        error,
        userId: request.user.id,
        exportId: request.params.exportId
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to download export'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Request account deletion
   */
  fastify.post('/delete-account', async (request, reply) => {
    try {
      // Process account deletion
      const deletionResult = await gdprService.processDataDeletion(request.user.id);
      
      return {
        data: deletionResult,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error processing account deletion', {
        error,
        userId: request.user.id
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to process account deletion'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Get user's data categories
   */
  fastify.get('/data-categories', async (request, reply) => {
    try {
      const categories = await gdprService.getUserDataCategories(request.user.id);
      
      return {
        data: categories,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error getting data categories', {
        error,
        userId: request.user.id
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get data categories'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Get user's consent settings
   */
  fastify.get('/consent', async (request, reply) => {
    try {
      // Get user's consent records
      const consents = await consentService.getUserConsents(request.user.id);
      
      // Get all purposes
      const purposes = consentService.getPurposes();
      
      // Combine data
      const result = purposes.map(purpose => {
        const consent = consents[purpose.id];
        
        return {
          purpose: {
            id: purpose.id,
            name: purpose.name,
            description: purpose.description,
            legalBasis: purpose.legalBasis,
            requiresConsent: purpose.requiresConsent
          },
          consent: consent ? {
            granted: consent.granted,
            timestamp: consent.timestamp,
            source: consent.source,
            version: consent.version
          } : null
        };
      });
      
      return {
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error getting consent settings', {
        error,
        userId: request.user.id
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to get consent settings'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  /**
   * Update consent settings
   */
  fastify.post<{
    Body: {
      data: {
        purpose: string;
        granted: boolean;
      };
    };
  }>('/consent', async (request, reply) => {
    try {
      const { purpose, granted } = request.body.data;
      
      // Record consent
      const consent = await consentService.recordConsent(
        request.user.id,
        purpose,
        granted
      );
      
      return {
        data: consent,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Error updating consent', {
        error,
        userId: request.user.id,
        purpose: request.body.data.purpose,
        granted: request.body.data.granted
      });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to update consent'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
  });
  
  fastify.log.info('GDPR routes registered');
}
