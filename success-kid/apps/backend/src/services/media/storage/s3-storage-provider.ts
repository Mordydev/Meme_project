/**
 * S3 Storage Provider
 * 
 * Implements StorageProvider interface using AWS S3 or compatible services
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider, StorageResult, UrlOptions } from './storage-provider';
import { StorageOptions } from '../../../models/media/media';
import { logger } from '../../../lib/logger';
import { NotFoundError } from '../../../errors/api-errors';

export interface S3Config {
  endpoint?: string;
  region: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
  cdnBaseUrl?: string;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucketName: string;
  private cdnBaseUrl?: string;
  
  constructor(config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle,
    });
    
    this.bucketName = config.bucketName;
    this.cdnBaseUrl = config.cdnBaseUrl;
  }
  
  /**
   * Store a file in S3
   */
  async storeFile(buffer: Buffer, path: string, options: StorageOptions = {}): Promise<StorageResult> {
    try {
      const { contentType, metadata = {}, cacheControl, acl = 'private' } = options;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl,
        Metadata: metadata,
        ACL: acl,
      });
      
      const response = await this.client.send(command);
      
      return {
        path,
        url: this.getPublicUrl(path),
        size: buffer.length,
        etag: response.ETag?.replace(/"/g, ''), // Remove quotes from ETag
      };
    } catch (error) {
      logger.error('Failed to store file in S3', { error, path });
      throw error;
    }
  }
  
  /**
   * Get a file from S3
   */
  async getFile(path: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });
      
      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new NotFoundError(`File not found: ${path}`);
      }
      
      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      // Handle specific S3 errors
      if ((error as any).name === 'NoSuchKey') {
        throw new NotFoundError(`File not found: ${path}`);
      }
      
      logger.error('Failed to get file from S3', { error, path });
      throw error;
    }
  }
  
  /**
   * Delete a file from S3
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });
      
      await this.client.send(command);
    } catch (error) {
      logger.error('Failed to delete file from S3', { error, path });
      throw error;
    }
  }
  
  /**
   * Generate a presigned URL for direct operations with S3
   */
  async generatePresignedUrl(
    operation: 'upload' | 'download',
    path: string,
    options: UrlOptions = {}
  ): Promise<string> {
    try {
      const expires = options.expires || 3600; // Default 1 hour
      
      if (operation === 'upload') {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: path,
          ContentType: options.contentType,
        });
        
        return getSignedUrl(this.client, command, { expiresIn: expires });
      } else {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: path,
          ResponseContentDisposition: options.contentDisposition === 'attachment' && options.filename
            ? `attachment; filename="${options.filename}"`
            : undefined,
        });
        
        return getSignedUrl(this.client, command, { expiresIn: expires });
      }
    } catch (error) {
      logger.error('Failed to generate presigned URL', { error, path, operation });
      throw error;
    }
  }
  
  /**
   * Check if a file exists in S3
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      // Return false if object doesn't exist
      if ((error as any).name === 'NotFound' || (error as any).name === 'NoSuchKey') {
        return false;
      }
      
      // Rethrow other errors
      logger.error('Failed to check if file exists in S3', { error, path });
      throw error;
    }
  }
  
  /**
   * Move/Rename a file in S3
   */
  async moveFile(sourcePath: string, destinationPath: string): Promise<StorageResult> {
    try {
      // In S3, moving is copying + deleting
      const copyCommand = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourcePath}`,
        Key: destinationPath,
      });
      
      const response = await this.client.send(copyCommand);
      
      // Delete the source object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: sourcePath,
      });
      
      await this.client.send(deleteCommand);
      
      // Get file metadata
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: destinationPath,
      });
      
      const metadata = await this.client.send(headCommand);
      
      return {
        path: destinationPath,
        url: this.getPublicUrl(destinationPath),
        size: metadata.ContentLength || 0,
        etag: response.CopyObjectResult?.ETag?.replace(/"/g, ''),
      };
    } catch (error) {
      logger.error('Failed to move file in S3', { error, sourcePath, destinationPath });
      throw error;
    }
  }
  
  /**
   * Get file metadata from S3
   */
  async getFileMetadata(path: string): Promise<Record<string, any>> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });
      
      const response = await this.client.send(command);
      
      return {
        size: response.ContentLength,
        etag: response.ETag?.replace(/"/g, ''),
        lastModified: response.LastModified,
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (error) {
      if ((error as any).name === 'NotFound' || (error as any).name === 'NoSuchKey') {
        throw new NotFoundError(`File not found: ${path}`);
      }
      
      logger.error('Failed to get file metadata from S3', { error, path });
      throw error;
    }
  }
  
  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): string {
    // If CDN base URL is configured, use it
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${path}`;
    }
    
    // Otherwise, use the S3 URL format
    return `https://${this.bucketName}.s3.${this.client.config.region}.amazonaws.com/${path}`;
  }
}
