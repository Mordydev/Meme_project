/**
 * Storage Provider Interface
 * 
 * Defines the contract for media storage providers
 */
import { StorageOptions } from '../../../models/media/media';

/**
 * StorageResult interface for store operation results
 */
export interface StorageResult {
  path: string;
  url?: string;
  size: number;
  etag?: string;
}

/**
 * UrlOptions interface for URL generation
 */
export interface UrlOptions {
  /**
   * Expiration time in seconds
   */
  expires?: number;
  /**
   * Content type for uploads
   */
  contentType?: string;
  /**
   * Suggest filename for downloads
   */
  filename?: string;
  /**
   * Content disposition for downloads
   */
  contentDisposition?: 'inline' | 'attachment';
}

/**
 * Storage provider interface
 */
export interface StorageProvider {
  /**
   * Store a file in storage
   * @param buffer File buffer
   * @param path Destination path
   * @param options Storage options
   */
  storeFile(buffer: Buffer, path: string, options?: StorageOptions): Promise<StorageResult>;
  
  /**
   * Get a file from storage
   * @param path File path
   */
  getFile(path: string): Promise<Buffer>;
  
  /**
   * Delete a file from storage
   * @param path File path
   */
  deleteFile(path: string): Promise<void>;
  
  /**
   * Generate a presigned URL for direct operations
   * @param operation Operation type
   * @param path File path
   * @param options URL options
   */
  generatePresignedUrl(
    operation: 'upload' | 'download',
    path: string,
    options?: UrlOptions
  ): Promise<string>;
  
  /**
   * Check if a file exists
   * @param path File path
   */
  fileExists(path: string): Promise<boolean>;
  
  /**
   * Move/Rename a file
   * @param sourcePath Source path
   * @param destinationPath Destination path
   */
  moveFile(sourcePath: string, destinationPath: string): Promise<StorageResult>;
  
  /**
   * Get file metadata
   * @param path File path
   */
  getFileMetadata(path: string): Promise<Record<string, any>>;
  
  /**
   * Get public URL for a file
   * @param path File path
   */
  getPublicUrl(path: string): string;
}
