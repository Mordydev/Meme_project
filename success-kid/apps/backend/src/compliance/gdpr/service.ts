/**
 * GDPR Compliance Service
 * 
 * Core service for managing GDPR compliance
 */
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';
import { db } from '../../lib/db';
import { 
  DataSubjectRequest, 
  DataSubjectRequestType, 
  DataSubjectRequestStatus,
  DataCategory,
  ExportResult,
  DeletionResult
} from './types';
import { exportService } from './export';
import { auditService } from '../../auth/audit/service';
import { piiService } from '../../security/pii';

/**
 * Data category definitions
 */
const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'profile',
    name: 'User Profile',
    description: 'Basic user profile information',
    retention: '90 days after account closure',
    legalBasis: 'contract',
    sensitive: false,
    fields: ['name', 'email', 'username', 'avatar', 'bio']
  },
  {
    id: 'authentication',
    name: 'Authentication Data',
    description: 'Data used for authentication',
    retention: '90 days after account closure',
    legalBasis: 'legitimate_interests',
    sensitive: false,
    fields: ['email', 'hashed_password', 'security_questions']
  },
  {
    id: 'communication',
    name: 'Communication Settings',
    description: 'Communication preferences and history',
    retention: '90 days after account closure',
    legalBasis: 'consent',
    sensitive: false,
    fields: ['email_preferences', 'notification_settings']
  },
  {
    id: 'wallet',
    name: 'Wallet Information',
    description: 'Blockchain wallet and transaction data',
    retention: '5 years after last transaction',
    legalBasis: 'contract',
    sensitive: false,
    fields: ['wallet_address', 'wallet_transactions']
  },
  {
    id: 'content',
    name: 'User Generated Content',
    description: 'Content created by the user',
    retention: '90 days after account closure',
    legalBasis: 'contract',
    sensitive: false,
    fields: ['posts', 'comments', 'reactions']
  },
  {
    id: 'activity',
    name: 'Activity Data',
    description: 'User activity and behavior data',
    retention: '24 months',
    legalBasis: 'legitimate_interests',
    sensitive: false,
    fields: ['login_history', 'page_views', 'feature_usage']
  }
];

/**
 * GDPR Service Class
 */
export class GdprService {
  private dataCategories: DataCategory[] = DATA_CATEGORIES;
  
  /**
   * Create a data subject request
   * 
   * @param userId User ID
   * @param type Request type
   * @param notes Optional notes
   * @returns Created request
   */
  async createDataRequest(
    userId: string,
    type: DataSubjectRequestType,
    notes?: string
  ): Promise<DataSubjectRequest> {
    try {
      // Generate ID
      const id = randomUUID();
      const now = new Date();
      
      // Create request in database
      const result = await db.query(
        `INSERT INTO data_subject_requests (
          id, user_id, type, status, created_at, updated_at, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          id,
          userId,
          type,
          DataSubjectRequestStatus.PENDING,
          now,
          now,
          notes || null
        ]
      );
      
      // Log the request creation in audit log
      await auditService.logEvent({
        type: 'DATA_SUBJECT_REQUEST_CREATED',
        userId,
        metadata: {
          requestId: id,
          requestType: type
        },
        severity: 'INFO'
      });
      
      logger.info('Data subject request created', {
        userId,
        requestId: id,
        type
      });
      
      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        type: result.rows[0].type,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        notes: result.rows[0].notes
      };
    } catch (error) {
      logger.error('Error creating data subject request', { error, userId, type });
      throw new Error('Failed to create data subject request');
    }
  }
  
  /**
   * Get a data subject request by ID
   * 
   * @param requestId Request ID
   * @returns Data subject request or null if not found
   */
  async getDataRequestById(requestId: string): Promise<DataSubjectRequest | null> {
    try {
      const result = await db.query(
        'SELECT * FROM data_subject_requests WHERE id = $1',
        [requestId]
      );
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        type: result.rows[0].type,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        completedAt: result.rows[0].completed_at,
        data: result.rows[0].data,
        notes: result.rows[0].notes
      };
    } catch (error) {
      logger.error('Error getting data subject request', { error, requestId });
      throw new Error('Failed to get data subject request');
    }
  }
  
  /**
   * Get requests for a user
   * 
   * @param userId User ID
   * @returns Array of user's data subject requests
   */
  async getUserRequests(userId: string): Promise<DataSubjectRequest[]> {
    try {
      const result = await db.query(
        'SELECT * FROM data_subject_requests WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at,
        data: row.data,
        notes: row.notes
      }));
    } catch (error) {
      logger.error('Error getting user data subject requests', { error, userId });
      throw new Error('Failed to get user data subject requests');
    }
  }
  
  /**
   * Update request status
   * 
   * @param requestId Request ID
   * @param status New status
   * @param data Optional data to store with the request
   * @returns Updated request
   */
  async updateRequestStatus(
    requestId: string,
    status: DataSubjectRequestStatus,
    data?: any
  ): Promise<DataSubjectRequest> {
    try {
      const updates: any = {
        status,
        updated_at: new Date()
      };
      
      // Add completed_at date if completed or rejected
      if (status === DataSubjectRequestStatus.COMPLETED || status === DataSubjectRequestStatus.REJECTED) {
        updates.completed_at = new Date();
      }
      
      // Add data if provided
      if (data) {
        updates.data = JSON.stringify(data);
      }
      
      // Build SQL query dynamically
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      
      const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
      
      const result = await db.query(
        `UPDATE data_subject_requests 
         SET ${setClause} 
         WHERE id = $1 
         RETURNING *`,
        [requestId, ...values]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Request not found: ${requestId}`);
      }
      
      // Log the status update in audit log
      await auditService.logEvent({
        type: 'DATA_SUBJECT_REQUEST_UPDATED',
        userId: result.rows[0].user_id,
        metadata: {
          requestId,
          status,
          previousStatus: result.rows[0].status
        },
        severity: 'INFO'
      });
      
      logger.info('Data subject request updated', {
        requestId,
        status
      });
      
      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        type: result.rows[0].type,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        completedAt: result.rows[0].completed_at,
        data: result.rows[0].data,
        notes: result.rows[0].notes
      };
    } catch (error) {
      logger.error('Error updating data subject request', { error, requestId, status });
      throw new Error('Failed to update data subject request');
    }
  }
  
  /**
   * Process a data export request
   * 
   * @param userId User ID
   * @returns Export result
   */
  async processDataExport(userId: string): Promise<ExportResult> {
    try {
      // Create request if it doesn't exist
      let request = await this.findActiveRequest(userId, DataSubjectRequestType.ACCESS);
      
      if (!request) {
        request = await this.createDataRequest(userId, DataSubjectRequestType.ACCESS);
      }
      
      // Update request status
      await this.updateRequestStatus(request.id, DataSubjectRequestStatus.PROCESSING);
      
      // Get all user data
      const userData = await this.collectUserData(userId);
      
      // Process export with export service
      const exportResult = await exportService.createDataExport(userId, userData);
      
      // Update request status
      await this.updateRequestStatus(
        request.id, 
        DataSubjectRequestStatus.COMPLETED,
        { exportId: exportResult.exportId }
      );
      
      // Log export completion
      await auditService.logEvent({
        type: 'DATA_EXPORT_COMPLETED',
        userId,
        metadata: {
          requestId: request.id,
          exportId: exportResult.exportId,
          fileSize: exportResult.fileSize
        },
        severity: 'INFO'
      });
      
      logger.info('Data export processed', { userId, exportId: exportResult.exportId });
      
      return exportResult;
    } catch (error) {
      logger.error('Error processing data export', { error, userId });
      throw new Error('Failed to process data export');
    }
  }
  
  /**
   * Process a data deletion request
   * 
   * @param userId User ID
   * @returns Deletion result
   */
  async processDataDeletion(userId: string): Promise<DeletionResult> {
    try {
      // Create request if it doesn't exist
      let request = await this.findActiveRequest(userId, DataSubjectRequestType.DELETION);
      
      if (!request) {
        request = await this.createDataRequest(userId, DataSubjectRequestType.DELETION);
      }
      
      // Update request status
      await this.updateRequestStatus(request.id, DataSubjectRequestStatus.PROCESSING);
      
      // Get data categories
      const categories = await this.getUserDataCategories(userId);
      
      // Initialize result
      const result: DeletionResult = {
        userId,
        success: true,
        deletedCategories: [],
        errors: [],
        completedAt: new Date()
      };
      
      // Process each category
      for (const category of categories) {
        try {
          await this.deleteDataCategory(userId, category.id);
          result.deletedCategories.push(category.id);
        } catch (error) {
          logger.error('Error deleting data category', { error, userId, category: category.id });
          
          result.errors.push({
            category: category.id,
            error: error.message || 'Unknown error'
          });
          
          result.success = false;
        }
      }
      
      // Update request status
      await this.updateRequestStatus(
        request.id,
        result.success ? DataSubjectRequestStatus.COMPLETED : DataSubjectRequestStatus.PROCESSING,
        result
      );
      
      // Log deletion completion
      await auditService.logEvent({
        type: 'DATA_DELETION_COMPLETED',
        userId,
        metadata: {
          requestId: request.id,
          success: result.success,
          deletedCategories: result.deletedCategories,
          errors: result.errors
        },
        severity: 'INFO'
      });
      
      logger.info('Data deletion processed', {
        userId,
        success: result.success,
        deletedCategories: result.deletedCategories.length
      });
      
      return result;
    } catch (error) {
      logger.error('Error processing data deletion', { error, userId });
      throw new Error('Failed to process data deletion');
    }
  }
  
  /**
   * Get data categories for a user
   * 
   * @param userId User ID
   * @returns Array of data categories
   */
  async getUserDataCategories(userId: string): Promise<DataCategory[]> {
    // In a real implementation, this would check which categories actually
    // have data for this user. For now, return all categories.
    return this.dataCategories;
  }
  
  /**
   * Collect all user data for export
   * 
   * @param userId User ID
   * @returns Collected user data
   */
  private async collectUserData(userId: string): Promise<Record<string, any>> {
    try {
      const userData: Record<string, any> = {
        metadata: {
          exportDate: new Date().toISOString(),
          userId
        }
      };
      
      // Get each category of user data
      for (const category of this.dataCategories) {
        try {
          const categoryData = await this.collectCategoryData(userId, category.id);
          
          if (categoryData) {
            userData[category.id] = categoryData;
          }
        } catch (error) {
          logger.error('Error collecting category data', { error, userId, category: category.id });
          // Continue with other categories
        }
      }
      
      return userData;
    } catch (error) {
      logger.error('Error collecting user data', { error, userId });
      throw new Error('Failed to collect user data');
    }
  }
  
  /**
   * Collect data for a specific category
   * 
   * @param userId User ID
   * @param categoryId Category ID
   * @returns Category data or null if none
   */
  private async collectCategoryData(
    userId: string,
    categoryId: string
  ): Promise<any | null> {
    // This would be implemented with category-specific data collection logic
    // For now, return placeholder data
    
    switch (categoryId) {
      case 'profile':
        // Get user profile data
        const profileResult = await db.query(
          'SELECT * FROM user_profiles WHERE user_id = $1',
          [userId]
        );
        
        if (profileResult.rowCount > 0) {
          return profileResult.rows[0];
        }
        break;
        
      case 'authentication':
        // Get authentication data (exclude sensitive fields)
        const authResult = await db.query(
          'SELECT id, user_id, auth_provider, created_at, last_login FROM user_auth WHERE user_id = $1',
          [userId]
        );
        
        if (authResult.rowCount > 0) {
          return authResult.rows;
        }
        break;
        
      case 'content':
        // Get user content
        const contentResult = await db.query(
          'SELECT * FROM content WHERE user_id = $1',
          [userId]
        );
        
        if (contentResult.rowCount > 0) {
          return contentResult.rows;
        }
        break;
        
      // Additional categories would be handled here
    }
    
    return null;
  }
  
  /**
   * Delete data for a specific category
   * 
   * @param userId User ID
   * @param categoryId Category ID
   */
  private async deleteDataCategory(userId: string, categoryId: string): Promise<void> {
    // This would be implemented with category-specific deletion logic
    // For now, log intent but don't actually delete
    
    logger.info('Would delete data category', { userId, categoryId });
    
    // In a real implementation:
    switch (categoryId) {
      case 'profile':
        // Delete user profile data
        await db.query(
          'DELETE FROM user_profiles WHERE user_id = $1',
          [userId]
        );
        break;
        
      case 'content':
        // Delete user content
        await db.query(
          'DELETE FROM content WHERE user_id = $1',
          [userId]
        );
        break;
        
      // Additional categories would be handled here
    }
  }
  
  /**
   * Find an active request of a specific type
   * 
   * @param userId User ID
   * @param type Request type
   * @returns Active request or null if none
   */
  private async findActiveRequest(
    userId: string,
    type: DataSubjectRequestType
  ): Promise<DataSubjectRequest | null> {
    try {
      const result = await db.query(
        `SELECT * FROM data_subject_requests 
         WHERE user_id = $1 
         AND type = $2 
         AND status IN ($3, $4) 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [
          userId,
          type,
          DataSubjectRequestStatus.PENDING,
          DataSubjectRequestStatus.PROCESSING
        ]
      );
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        type: result.rows[0].type,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        completedAt: result.rows[0].completed_at,
        data: result.rows[0].data,
        notes: result.rows[0].notes
      };
    } catch (error) {
      logger.error('Error finding active request', { error, userId, type });
      return null;
    }
  }
}

// Export singleton instance
export const gdprService = new GdprService();
