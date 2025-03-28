/**
 * Storage Provider Interface
 * 
 * Defines the interface for storage providers that handle file operations.
 * This allows swapping different storage implementations (S3, local, etc.)
 */

/**
 * Storage operation types for presigned URLs
 */
export type StorageOperation = 'upload' | 'download';

/**
 * Options for storing files
 */
export interface StorageOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
  expires?: number; // Expiration in seconds
}

/**
 * Options for generating presigned URLs
 */
export interface UrlOptions {
  contentType?: string;
  expires?: number; // Expiration in seconds
  maxSize?: number; // Maximum allowed file size in bytes
  metadata?: Record<string, string>;
  download?: boolean; // Force download when accessing URL
  filename?: string; // Custom filename when downloading
}

/**
 * Result of a storage operation
 */
export interface StorageResult {
  path: string;
  url?: string;
  metadata?: Record<string, any>;
}

/**
 * Storage provider interface for file operations
 */
export interface StorageProvider {
  /**
   * Store a file in the storage system
   * @param buffer File buffer to store
   * @param path Destination path in storage
   * @param options Storage options
   * @returns Promise resolving to storage result
   */
  storeFile(buffer: Buffer, path: string, options?: StorageOptions): Promise<StorageResult>;
  
  /**
   * Retrieve a file from storage
   * @param path Path to the file in storage
   * @returns Promise resolving to file buffer
   */
  getFile(path: string): Promise<Buffer>;
  
  /**
   * Delete a file from storage
   * @param path Path to the file in storage
   * @returns Promise resolving when deletion is complete
   */
  deleteFile(path: string): Promise<void>;
  
  /**
   * Generate a presigned URL for direct file operations
   * @param operation Operation type (upload/download)
   * @param path Path in storage
   * @param options URL options
   * @returns Promise resolving to presigned URL
   */
  generatePresignedUrl(operation: StorageOperation, path: string, options?: UrlOptions): Promise<string>;
  
  /**
   * Check if a file exists in storage
   * @param path Path to check
   * @returns Promise resolving to boolean indicating existence
   */
  fileExists(path: string): Promise<boolean>;
  
  /**
   * Copy a file within storage
   * @param sourcePath Source file path
   * @param destinationPath Destination path
   * @param options Storage options for destination
   * @returns Promise resolving to storage result for destination
   */
  copyFile(sourcePath: string, destinationPath: string, options?: StorageOptions): Promise<StorageResult>;
  
  /**
   * Get file metadata from storage
   * @param path Path to the file
   * @returns Promise resolving to file metadata
   */
  getFileMetadata(path: string): Promise<Record<string, any>>;
}
