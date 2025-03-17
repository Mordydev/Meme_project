/**
 * GDPR Data Deletion
 * 
 * This module provides functionality for deleting user data for GDPR compliance.
 */

import { logger } from '../../lib/logger';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';
import { DeletionResult } from './service';

/**
 * Data deletion handler interface
 */
interface DeletionHandler {
  deleteData(userId: string): Promise<boolean>;
  isRetained(userId: string): Promise<boolean>;
  retentionReason(userId: string): Promise<string>;
}

/**
 * Map of deletion handlers for different categories
 */
const deletionHandlers: Record<string, DeletionHandler> = {
  profile: {
    async deleteData(userId: string): Promise<boolean> {
      // Delete user profile data
      // In a real implementation, this would update the database
      logger.info(`Deleting profile data for user ${userId}`);
      return true;
    },
    async isRetained(): Promise<boolean> {
      return false;
    },
    async retentionReason(): Promise<string> {
      return '';
    }
  },
  
  authentication: {
    async deleteData(userId: string): Promise<boolean> {
      // Delete authentication data
      logger.info(`Deleting authentication data for user ${userId}`);
      return true;
    },
    async isRetained(): Promise<boolean> {
      return false;
    },
    async retentionReason(): Promise<string> {
      return '';
    }
  },
  
  points: {
    async deleteData(userId: string): Promise<boolean> {
      // Anonymize points data (can't delete completely due to financial records)
      logger.info(`Anonymizing points data for user ${userId}`);
      return true;
    },
    async isRetained(): Promise<boolean> {
      return true;
    },
    async retentionReason(): Promise<string> {
      return 'Financial records must be retained for 7 years due to regulatory requirements';
    }
  },
  
  content: {
    async deleteData(userId: string): Promise<boolean> {
      // Delete user-generated content
      logger.info(`Deleting content data for user ${userId}`);
      return true;
    },
    async isRetained(): Promise<boolean> {
      return false;
    },
    async retentionReason(): Promise<string> {
      return '';
    }
  },
  
  wallet: {
    async deleteData(userId: string): Promise<boolean> {
      // Anonymize wallet connection data
      logger.info(`Anonymizing wallet data for user ${userId}`);
      return true;
    },
    async isRetained(): Promise<boolean> {
      return true;
    },
    async retentionReason(): Promise<string> {
      return 'Blockchain transaction records must be retained for audit purposes';
    }
  },
  
  analytics: {
    async deleteData(userId: string): Promise<boolean> {
      // Delete personal analytics data
      logger.info(`Deleting analytics data for user ${userId}`);
      return true;
    },
    async isRetained(): Promise<boolean> {
      return false;
    },
    async retentionReason(): Promise<string> {
      return '';
    }
  }
};

/**
 * Process data deletion request
 */
export async function processDataDeletion(userId: string): Promise<DeletionResult> {
  try {
    logger.info(`Processing data deletion for user ${userId}`);
    
    // Get list of data categories
    const categories = [
      'profile',
      'authentication',
      'points',
      'content',
      'wallet',
      'analytics'
    ];
    
    const deletedCategories: string[] = [];
    const retainedCategories: string[] = [];
    const retentionReasons: Record<string, string> = {};
    
    // Process each data category
    for (const category of categories) {
      try {
        // Get deletion handler for this category
        const handler = deletionHandlers[category];
        
        // Check if data must be retained
        const isRetained = await handler.isRetained(userId);
        
        if (isRetained) {
          retainedCategories.push(category);
          retentionReasons[category] = await handler.retentionReason(userId);
          logger.info(`Retaining ${category} data for user ${userId} due to: ${retentionReasons[category]}`);
        } else {
          // Delete data for this category
          const success = await handler.deleteData(userId);
          
          if (success) {
            deletedCategories.push(category);
          }
        }
        
        // Audit the deletion operation
        await auditService.logEvent({
          userId,
          action: AuditAction.ADMIN_ACTION,
          resource: AuditResource.USER,
          resourceId: userId,
          ip: 'system',
          status: 'success',
          metadata: {
            operation: 'data_deletion',
            category,
            deleted: !isRetained
          }
        });
      } catch (error) {
        logger.error(`Error deleting ${category} data`, { error, userId });
      }
    }
    
    logger.info(`Completed data deletion for user ${userId}`, {
      deletedCategories,
      retainedCategories
    });
    
    return {
      success: true,
      deletedCategories,
      retainedCategories,
      retentionReasons
    };
  } catch (error) {
    logger.error('Error processing data deletion', { error, userId });
    throw error;
  }
}
