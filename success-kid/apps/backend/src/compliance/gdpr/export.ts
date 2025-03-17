/**
 * Data Export Service
 * 
 * Handles data exports for GDPR compliance
 */
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../lib/logger';
import { db } from '../../lib/db';
import { ExportResult } from './types';
import { encryptionService } from '../../security/encryption';
import { piiService } from '../../security/pii';

// Constants
const EXPORT_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const EXPORT_BASE_PATH = process.env.DATA_EXPORT_PATH || '/tmp/data-exports';

/**
 * Data Export Service Class
 */
export class DataExportService {
  /**
   * Create a data export for a user
   * 
   * @param userId User ID
   * @param data Data to export
   * @returns Export result
   */
  async createDataExport(userId: string, data: any): Promise<ExportResult> {
    try {
      // Generate export ID
      const exportId = randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + EXPORT_TTL * 1000);
      
      // Ensure export directory exists
      const userExportDir = path.join(EXPORT_BASE_PATH, userId);
      await this.ensureDirectoryExists(userExportDir);
      
      // Create export file path
      const filePath = path.join(userExportDir, `${exportId}.json`);
      
      // Process data for export
      const processedData = await this.processDataForExport(data);
      
      // Write data to file
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(processedData, null, 2),
        'utf8'
      );
      
      // Get file size
      const stats = await fs.promises.stat(filePath);
      
      // Create download URL
      const downloadUrl = await this.generateDownloadUrl(userId, exportId);
      
      // Record export in database
      await db.query(
        `INSERT INTO data_exports (
          id, user_id, file_path, file_size, created_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          exportId,
          userId,
          filePath,
          stats.size,
          now,
          expiresAt
        ]
      );
      
      logger.info('Data export created', {
        userId,
        exportId,
        fileSize: stats.size
      });
      
      return {
        exportId,
        fileSize: stats.size,
        fileFormat: 'json',
        downloadUrl,
        expiresAt
      };
    } catch (error) {
      logger.error('Error creating data export', { error, userId });
      throw new Error('Failed to create data export');
    }
  }
  
  /**
   * Process data for export
   * 
   * @param data Raw data to process
   * @returns Processed data
   */
  private async processDataForExport(data: any): Promise<any> {
    try {
      // Copy data to avoid modifying original
      const processedData = JSON.parse(JSON.stringify(data));
      
      // Add export metadata
      processedData._metadata = {
        exportTimestamp: new Date().toISOString(),
        exportFormat: 'JSON',
        dataController: 'Success Kid Community Platform',
        privacyPolicyUrl: 'https://success-kid.com/privacy'
      };
      
      return processedData;
    } catch (error) {
      logger.error('Error processing data for export', { error });
      throw error;
    }
  }
  
  /**
   * Generate a secure download URL for an export
   * 
   * @param userId User ID
   * @param exportId Export ID
   * @returns Download URL
   */
  private async generateDownloadUrl(userId: string, exportId: string): Promise<string> {
    // In a real implementation, this would generate a secure, time-limited URL
    // For now, return a placeholder URL
    return `/api/v1/gdpr/export/${exportId}/download`;
  }
  
  /**
   * Get an export by ID
   * 
   * @param exportId Export ID
   * @returns Export record or null if not found
   */
  async getExport(exportId: string): Promise<any | null> {
    try {
      const result = await db.query(
        'SELECT * FROM data_exports WHERE id = $1',
        [exportId]
      );
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting export', { error, exportId });
      return null;
    }
  }
  
  /**
   * Check if an export is still valid (not expired)
   * 
   * @param exportId Export ID
   * @returns Whether export is valid
   */
  async isExportValid(exportId: string): Promise<boolean> {
    try {
      const export_ = await this.getExport(exportId);
      
      if (!export_) {
        return false;
      }
      
      const now = new Date();
      return export_.expires_at > now;
    } catch (error) {
      logger.error('Error checking export validity', { error, exportId });
      return false;
    }
  }
  
  /**
   * Get export file path
   * 
   * @param exportId Export ID
   * @returns File path or null if export not found
   */
  async getExportFilePath(exportId: string): Promise<string | null> {
    try {
      const export_ = await this.getExport(exportId);
      
      if (!export_) {
        return null;
      }
      
      return export_.file_path;
    } catch (error) {
      logger.error('Error getting export file path', { error, exportId });
      return null;
    }
  }
  
  /**
   * Delete expired exports
   * 
   * @returns Number of exports deleted
   */
  async deleteExpiredExports(): Promise<number> {
    try {
      const now = new Date();
      
      // Get expired exports
      const result = await db.query(
        'SELECT * FROM data_exports WHERE expires_at < $1',
        [now]
      );
      
      let deletedCount = 0;
      
      // Delete each expired export
      for (const row of result.rows) {
        try {
          // Delete file
          await fs.promises.unlink(row.file_path);
          
          // Delete from database
          await db.query(
            'DELETE FROM data_exports WHERE id = $1',
            [row.id]
          );
          
          deletedCount++;
        } catch (error) {
          logger.error('Error deleting expired export', {
            error,
            exportId: row.id,
            filePath: row.file_path
          });
        }
      }
      
      logger.info('Deleted expired exports', { count: deletedCount });
      
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting expired exports', { error });
      return 0;
    }
  }
  
  /**
   * Ensure a directory exists
   * 
   * @param dirPath Directory path
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error('Error creating directory', { error, dirPath });
      throw new Error(`Failed to create directory: ${dirPath}`);
    }
  }
}

// Export singleton instance
export const exportService = new DataExportService();
