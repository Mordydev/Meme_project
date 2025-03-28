/**
 * S3 Storage Provider Implementation
 * 
 * Implements the StorageProvider interface for Amazon S3 or compatible services.
 */
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider, StorageOptions, UrlOptions, StorageOperation, StorageResult } from './provider';
import { logger } from '../../../lib/logger';

/**
 * S3 provider configuration
 */
export interface S3ProviderConfig {
  region: string;
  bucket: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle?: boolean;
  baseUrl?: string;
}

/**
 * S3 implementation of StorageProvider
 */
export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private baseUrl?: string;
  
  /**
   * Create a new S3 storage provider
   * @param config S3 configuration
   */
  constructor(private config: S3ProviderConfig) {
    this.bucket = config.bucket;
    this.baseUrl = config.baseUrl;
    
    // Initialize S3 client
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: config.credentials,
      forcePathStyle: config.forcePathStyle || false
    });
    
    logger.info(`S3StorageProvider initialized for bucket: ${this.bucket}`);
  }
  
  /**
   * Store a file in S3
   * @param buffer File buffer to store
   * @param path Destination path in S3
   * @param options Storage options
   * @returns Promise resolving to storage result
   */
  async storeFile(buffer: Buffer, path: string, options: StorageOptions = {}): Promise<StorageResult> {
    try {
      // Remove leading slash if present
      const key = path.startsWith('/') ? path.substring(1) : path;
      
      // Upload parameters
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
        Metadata: options.metadata,
        ACL: options.public ? 'public-read' : undefined
      };
      
      // Upload file to S3
      await this.client.send(new PutObjectCommand(params));
      
      // Generate URL
      let url = undefined;
      if (this.baseUrl) {
        url = `${this.baseUrl}/${key}`;
      } else if (options.public) {
        url = `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
      }
      
      return {
        path: key,
        url,
        metadata: options.metadata
      };
    } catch (error) {
      logger.error('Error storing file in S3', { path, error });
      throw new Error(`Failed to store file: ${error.message}`);
    }
  }
  
  /**
   * Retrieve a file from S3
   * @param path Path to the file in S3
   * @returns Promise resolving to file buffer
   */
  async getFile(path: string): Promise<Buffer> {
    try {
      // Remove leading slash if present
      const key = path.startsWith('/') ? path.substring(1) : path;
      
      // Get object parameters
      const params = {
        Bucket: this.bucket,
        Key: key
      };
      
      // Get file from S3
      const { Body } = await this.client.send(new GetObjectCommand(params));
      
      // Convert to buffer
      if (!Body) {
        throw new Error('Empty response body');
      }
      
      // Convert stream to buffer
      return Buffer.from(await Body.transformToByteArray());
    } catch (error) {
      logger.error('Error getting file from S3', { path, error });
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }
  
  /**
   * Delete a file from S3
   * @param path Path to the file in S3
   * @returns Promise resolving when deletion is complete
   */
  async deleteFile(path: string): Promise<void> {
    try {
      // Remove leading slash if present
      const key = path.startsWith('/') ? path.substring(1) : path;
      
      // Delete object parameters
      const params = {
        Bucket: this.bucket,
        Key: key
      };
      
      // Delete file from S3
      await this.client.send(new DeleteObjectCommand(params));
    } catch (error) {
      logger.error('Error deleting file from S3', { path, error });
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
  
  /**
   * Generate a presigned URL for direct file operations
   * @param operation Operation type (upload/download)
   * @param path Path in S3
   * @param options URL options
   * @returns Promise resolving to presigned URL
   */
  async generatePresignedUrl(operation: StorageOperation, path: string, options: UrlOptions = {}): Promise<string> {
    try {
      // Remove leading slash if present
      const key = path.startsWith('/') ? path.substring(1) : path;
      
      // Set expiration (default: 15 minutes)
      const expiresIn = options.expires || 15 * 60;
      
      if (operation === 'upload') {
        // Create command for PUT operation
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: options.contentType,
          Metadata: options.metadata
        });
        
        // Generate presigned URL for upload
        return getSignedUrl(this.client, command, { expiresIn });
      } else {
        // Create command for GET operation
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ResponseContentDisposition: options.download 
            ? `attachment; filename="${options.filename || path.split('/').pop()}"` 
            : undefined
        });
        
        // Generate presigned URL for download
        return getSignedUrl(this.client, command, { expiresIn });
      }
    } catch (error) {
      logger.error('Error generating presigned URL', { operation, path, error });
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }
  
  /**
   * Check if a file exists in S3
   * @param path Path to check
   * @returns Promise resolving to boolean indicating existence
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      // Remove leading slash if present
      const key = path.startsWith('/') ? path.substring(1) : path;
      
      // Head object parameters
      const params = {
        Bucket: this.bucket,
        Key: key
      };
      
      // Check if file exists by trying to get its metadata
      await this.client.send(new HeadObjectCommand(params));
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      logger.error('Error checking file existence in S3', { path, error });
      throw new Error(`Failed to check file existence: ${error.message}`);
    }
  }
  
  /**
   * Copy a file within S3
   * @param sourcePath Source file path
   * @param destinationPath Destination path
   * @param options Storage options for destination
   * @returns Promise resolving to storage result for destination
   */
  async copyFile(sourcePath: string, destinationPath: string, options: StorageOptions = {}): Promise<StorageResult> {
    try {
      // Remove leading slashes if present
      const sourceKey = sourcePath.startsWith('/') ? sourcePath.substring(1) : sourcePath;
      const destinationKey = destinationPath.startsWith('/') ? destinationPath.substring(1) : destinationPath;
      
      // Copy parameters
      const params = {
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
        ContentType: options.contentType,
        Metadata: options.metadata,
        MetadataDirective: options.metadata ? 'REPLACE' : 'COPY',
        ACL: options.public ? 'public-read' : undefined
      };
      
      // Copy file in S3
      await this.client.send(new CopyObjectCommand(params));
      
      // Generate URL
      let url = undefined;
      if (this.baseUrl) {
        url = `${this.baseUrl}/${destinationKey}`;
      } else if (options.public) {
        url = `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${destinationKey}`;
      }
      
      return {
        path: destinationKey,
        url,
        metadata: options.metadata
      };
    } catch (error) {
      logger.error('Error copying file in S3', { sourcePath, destinationPath, error });
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }
  
  /**
   * Get file metadata from S3
   * @param path Path to the file
   * @returns Promise resolving to file metadata
   */
  async getFileMetadata(path: string): Promise<Record<string, any>> {
    try {
      // Remove leading slash if present
      const key = path.startsWith('/') ? path.substring(1) : path;
      
      // Head object parameters
      const params = {
        Bucket: this.bucket,
        Key: key
      };
      
      // Get file metadata from S3
      const response = await this.client.send(new HeadObjectCommand(params));
      
      // Extract metadata
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        eTag: response.ETag,
        metadata: response.Metadata
      };
    } catch (error) {
      logger.error('Error getting file metadata from S3', { path, error });
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}
