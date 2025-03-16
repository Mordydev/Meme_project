/**
 * Storage Service
 * 
 * Factory to create appropriate storage provider based on configuration
 */
import path from 'path';
import { StorageProvider } from './storage-provider';
import { LocalStorageProvider } from './local-storage-provider';
import { S3StorageProvider, S3Config } from './s3-storage-provider';
import { StorageOptions } from '../../../models/media/media';
import { logger } from '../../../lib/logger';

/**
 * Storage provider type
 */
export enum StorageProviderType {
  LOCAL = 'local',
  S3 = 's3',
}

/**
 * Storage service configuration
 */
export interface StorageServiceConfig {
  provider: StorageProviderType;
  s3?: S3Config;
  local?: {
    basePath: string;
    baseUrl: string;
  };
}

/**
 * Storage service class
 */
export class StorageService {
  private provider: StorageProvider;
  
  constructor(config: StorageServiceConfig) {
    this.provider = this.createProvider(config);
    logger.info(`Initialized ${config.provider} storage provider`);
  }
  
  /**
   * Create storage provider based on configuration
   */
  private createProvider(config: StorageServiceConfig): StorageProvider {
    switch (config.provider) {
      case StorageProviderType.S3:
        if (!config.s3) {
          throw new Error('S3 configuration is required for S3 storage provider');
        }
        return new S3StorageProvider(config.s3);
        
      case StorageProviderType.LOCAL:
      default:
        if (!config.local) {
          // Default local configuration if not provided
          const basePath = path.join(process.cwd(), 'uploads');
          const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
          
          return new LocalStorageProvider(basePath, baseUrl);
        }
        return new LocalStorageProvider(config.local.basePath, config.local.baseUrl);
    }
  }
  
  /**
   * Store a file
   */
  async storeFile(buffer: Buffer, filePath: string, options?: StorageOptions) {
    return this.provider.storeFile(buffer, filePath, options);
  }
  
  /**
   * Get a file
   */
  async getFile(filePath: string) {
    return this.provider.getFile(filePath);
  }
  
  /**
   * Delete a file
   */
  async deleteFile(filePath: string) {
    return this.provider.deleteFile(filePath);
  }
  
  /**
   * Generate a presigned URL
   */
  async generatePresignedUrl(operation: 'upload' | 'download', filePath: string, options?: any) {
    return this.provider.generatePresignedUrl(operation, filePath, options);
  }
  
  /**
   * Check if a file exists
   */
  async fileExists(filePath: string) {
    return this.provider.fileExists(filePath);
  }
  
  /**
   * Move a file
   */
  async moveFile(sourcePath: string, destinationPath: string) {
    return this.provider.moveFile(sourcePath, destinationPath);
  }
  
  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string) {
    return this.provider.getFileMetadata(filePath);
  }
  
  /**
   * Get a public URL for a file
   */
  getPublicUrl(filePath: string) {
    return this.provider.getPublicUrl(filePath);
  }
}
