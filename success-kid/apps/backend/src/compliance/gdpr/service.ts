/**
 * GDPR Service
 * 
 * This module provides a service for GDPR compliance features.
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';
import { ComplianceError } from '../../security/errors';
import { processDataExport } from './export';
import { processDataDeletion } from './deletion';
import { recordConsentAction, withdrawConsentAction } from './consent';

/**
 * Data subject request type
 */
export enum RequestType {
  ACCESS = 'access',
  DELETION = 'deletion',
  RECTIFICATION = 'rectification',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection',
  PORTABILITY = 'portability'
}

/**
 * Data subject request status
 */
export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

/**
 * Data subject request
 */
export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: Date;
  completedAt?: Date;
  data?: any;
  notes?: string;
}

/**
 * Data category
 */
export interface DataCategory {
  type: string;
  description: string;
  purpose: string;
  retention: string;
  locationDescription: string;
}

/**
 * Export result
 */
export interface ExportResult {
  exportId: string;
  fileSize: number;
  fileFormat: string;
  downloadUrl: string;
  expiresAt: Date;
}

/**
 * Deletion result
 */
export interface DeletionResult {
  success: boolean;
  deletedCategories: string[];
  retainedCategories?: string[];
  retentionReasons?: Record<string, string>;
}

/**
 * Consent record
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  source: string;
  expiresAt?: Date;
}

/**
 * GDPR Service
 */
export class GdprService {
  // In-memory storage for data subject requests (would be a database in production)
  private requests: DataSubjectRequest[] = [];
  
  /**
   * Create a data subject request
   */
  async createDataRequest(userId: string, type: RequestType): Promise<DataSubjectRequest> {
    try {
      // Create request record
      const request: DataSubjectRequest = {
        id: uuidv4(),
        userId,
        type,
        status: RequestStatus.PENDING,
        createdAt: new Date()
      };
      
      // Store request
      this.requests.push(request);
      
      // Audit request creation
      await auditService.logEvent({
        userId,
        action: 'gdpr.request_created',
        resource: AuditResource.USER,
        resourceId: userId,
        ip: 'system',
        status: 'success',
        metadata: {
          requestId: request.id,
          requestType: type
        }
      });
      
      logger.info(`Created GDPR ${type} request for user ${userId}`, { requestId: request.id });
      
      return request;
    } catch (error) {
      logger.error('Error creating data subject request', { error, userId, type });
      throw new ComplianceError('Failed to create data subject request');
    }
  }
  
  /**
   * Get data request status
   */
  async getDataRequestStatus(requestId: string): Promise<DataSubjectRequest> {
    try {
      const request = this.requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new ComplianceError(`Request not found: ${requestId}`);
      }
      
      return request;
    } catch (error) {
      logger.error('Error getting data request status', { error, requestId });
      throw new ComplianceError('Failed to get data request status');
    }
  }
  
  /**
   * Process data export request
   */
  async processDataExport(userId: string): Promise<ExportResult> {
    try {
      logger.info(`Processing data export for user ${userId}`);
      
      // Create a request
      const request = await this.createDataRequest(userId, RequestType.ACCESS);
      
      // Update status to processing
      request.status = RequestStatus.PROCESSING;
      
      // Process export
      const result = await processDataExport(userId);
      
      // Update request status
      request.status = RequestStatus.COMPLETED;
      request.completedAt = new Date();
      request.data = {
        exportId: result.exportId,
        downloadUrl: result.downloadUrl
      };
      
      // Audit export completion
      await auditService.logEvent({
        userId,
        action: 'gdpr.export_completed',
        resource: AuditResource.USER,
        resourceId: userId,
        ip: 'system',
        status: 'success',
        metadata: {
          requestId: request.id,
          exportId: result.exportId
        }
      });
      
      logger.info(`Completed data export for user ${userId}`, { 
        requestId: request.id,
        exportId: result.exportId
      });
      
      return result;
    } catch (error) {
      logger.error('Error processing data export', { error, userId });
      throw new ComplianceError('Failed to process data export');
    }
  }
  
  /**
   * Process data deletion request
   */
  async processDataDeletion(userId: string): Promise<DeletionResult> {
    try {
      logger.info(`Processing data deletion for user ${userId}`);
      
      // Create a request
      const request = await this.createDataRequest(userId, RequestType.DELETION);
      
      // Update status to processing
      request.status = RequestStatus.PROCESSING;
      
      // Process deletion
      const result = await processDataDeletion(userId);
      
      // Update request status
      request.status = RequestStatus.COMPLETED;
      request.completedAt = new Date();
      request.data = {
        deletedCategories: result.deletedCategories,
        retainedCategories: result.retainedCategories
      };
      
      // Audit deletion completion
      await auditService.logEvent({
        userId,
        action: 'gdpr.deletion_completed',
        resource: AuditResource.USER,
        resourceId: userId,
        ip: 'system',
        status: 'success',
        metadata: {
          requestId: request.id,
          deletedCategories: result.deletedCategories
        }
      });
      
      logger.info(`Completed data deletion for user ${userId}`, { 
        requestId: request.id,
        deletedCategories: result.deletedCategories
      });
      
      return result;
    } catch (error) {
      logger.error('Error processing data deletion', { error, userId });
      throw new ComplianceError('Failed to process data deletion');
    }
  }
  
  /**
   * Get user data categories
   */
  async getUserDataCategories(userId: string): Promise<DataCategory[]> {
    try {
      // Return data category mapping for the platform
      return [
        {
          type: 'profile',
          description: 'User profile information',
          purpose: 'To identify the user and provide personalized services',
          retention: '24 months after account closure',
          locationDescription: 'Main database'
        },
        {
          type: 'authentication',
          description: 'Authentication records and login history',
          purpose: 'To secure user accounts and prevent unauthorized access',
          retention: '12 months after account closure',
          locationDescription: 'Authentication system'
        },
        {
          type: 'points',
          description: 'Point transactions and balances',
          purpose: 'To track user engagement and reward activities',
          retention: '7 years due to financial record requirements',
          locationDescription: 'Points transaction database'
        },
        {
          type: 'content',
          description: 'User-generated content and activity',
          purpose: 'To provide community platform functionality',
          retention: 'Until deletion request or account closure',
          locationDescription: 'Content database'
        },
        {
          type: 'wallet',
          description: 'Wallet connection records',
          purpose: 'To enable token redemption and blockchain interaction',
          retention: '7 years due to financial record requirements',
          locationDescription: 'Wallet service'
        },
        {
          type: 'analytics',
          description: 'Usage analytics and platform activity',
          purpose: 'To improve services and analyze platform usage',
          retention: '25 months in identifiable form',
          locationDescription: 'Analytics platform'
        }
      ];
    } catch (error) {
      logger.error('Error getting user data categories', { error, userId });
      throw new ComplianceError('Failed to get user data categories');
    }
  }
  
  /**
   * Record user consent
   */
  async recordConsent(userId: string, purpose: string, granted: boolean): Promise<ConsentRecord> {
    try {
      return await recordConsentAction(userId, purpose, granted);
    } catch (error) {
      logger.error('Error recording consent', { error, userId, purpose });
      throw new ComplianceError('Failed to record consent');
    }
  }
  
  /**
   * Withdraw user consent
   */
  async withdrawConsent(userId: string, purpose: string): Promise<void> {
    try {
      await withdrawConsentAction(userId, purpose);
    } catch (error) {
      logger.error('Error withdrawing consent', { error, userId, purpose });
      throw new ComplianceError('Failed to withdraw consent');
    }
  }
}

// Export singleton instance
export const gdprService = new GdprService();
