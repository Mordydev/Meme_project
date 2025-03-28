/**
 * Local Storage Provider Implementation
 * 
 * Implements the StorageProvider interface for local file system storage.
 * Primarily used for development and testing environments.
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, StorageOptions, UrlOptions, StorageOperation, StorageResult } from './provider';
import { logger } from '../../../lib/logger';

/**
 * Local provider configuration
 */
export interface LocalProviderConfig {
  baseDir: string;
  baseUrl: string;
}

/**
 * Local file system implementation of StorageProvider
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;
  
  /**
   * Create a new local storage provider
   * @param config Local provider configuration
   */
  constructor(private config: LocalProviderConfig) {
    this.baseDir = config.baseDir;
    this.baseUrl = config.baseUrl;
    
    // Ensure base directory exists
    this.ensureDirectory(this.baseDir);
    
    logger.info(`LocalStorageProvider initialized at: ${this.baseDir}`);
  }
  
  /**
   * Store a file on the local file system
   * @param buffer File buffer to store
   * @param filePath Destination path
   * @param options Storage options
   * @returns Promise resolving to storage result
   */
  async storeFile(buffer: Buffer, filePath: string, options: StorageOptions = {}): Promise<StorageResult> {
    try {
      // Normalize path and ensure directory exists
      const normalizedPath = this.normalizePath(filePath);
      const fullPath = path.resolve(this.baseDir, normalizedPath);
      await this.ensureDirectory(path.dirname(fullPath));
      
      // Write file
      await fs.writeFile(fullPath, buffer);
      
      // Write metadata if provided
      if (options.metadata) {
        await this.writeMetadata(normalizedPath, options.metadata);
      }
      
      return {
        path: normalizedPath,
        url: `${this.baseUrl}/${normalizedPath}`,
        metadata: options.metadata
      };
    } catch (error) {
      logger.error('Error storing file locally', { filePath, error });
      throw new Error(`Failed to store file: ${error.message}`);
    }
  }
  
  /**
   * Retrieve a file from the local file system
   * @param filePath Path to the file
   * @returns Promise resolving to file buffer
   */
  async getFile(filePath: string): Promise<Buffer> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const fullPath = path.resolve(this.baseDir, normalizedPath);
      
      return await fs.readFile(fullPath);
    } catch (error) {
      logger.error('Error getting file locally', { filePath, error });
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }
  
  /**
   * Delete a file from the local file system
   * @param filePath Path to the file
   * @returns Promise resolving when deletion is complete
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const fullPath = path.resolve(this.baseDir, normalizedPath);
      
      // Delete file
      await fs.unlink(fullPath);
      
      // Also delete metadata file if it exists
      const metaPath = `${fullPath}.meta.json`;
      try {
        await fs.unlink(metaPath);
      } catch (err) {
        // Ignore errors if metadata file doesn't exist
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    } catch (error) {
      logger.error('Error deleting file locally', { filePath, error });
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
  
  /**
   * Generate a presigned URL for file operations
   * For local storage, this creates a time-limited token in the URL
   * @param operation Operation type (upload/download)
   * @param filePath File path
   * @param options URL options
   * @returns Promise resolving to URL with token
   */
  async generatePresignedUrl(operation: StorageOperation, filePath: string, options: UrlOptions = {}): Promise<string> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      
      // Create a token (with expiration encoded)
      const expiry = Math.floor(Date.now() / 1000) + (options.expires || 900); // Default 15 minutes
      const token = this.generateToken(normalizedPath, operation, expiry);
      
      if (operation === 'upload') {
        return `${this.baseUrl}/upload?path=${encodeURIComponent(normalizedPath)}&token=${token}&expiry=${expiry}`;
      } else {
        const downloadParam = options.download ? '&download=true' : '';
        const filenameParam = options.filename ? `&filename=${encodeURIComponent(options.filename)}` : '';
        return `${this.baseUrl}/${normalizedPath}?token=${token}&expiry=${expiry}${downloadParam}${filenameParam}`;
      }
    } catch (error) {
      logger.error('Error generating presigned URL', { operation, filePath, error });
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }
  
  /**
   * Check if a file exists on the local file system
   * @param filePath Path to check
   * @returns Promise resolving to boolean indicating existence
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const fullPath = path.resolve(this.baseDir, normalizedPath);
      
      await fs.access(fullPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      logger.error('Error checking file existence locally', { filePath, error });
      throw new Error(`Failed to check file existence: ${error.message}`);
    }
  }
  
  /**
   * Copy a file within the local file system
   * @param sourcePath Source file path
   * @param destinationPath Destination path
   * @param options Storage options for destination
   * @returns Promise resolving to storage result for destination
   */
  async copyFile(sourcePath: string, destinationPath: string, options: StorageOptions = {}): Promise<StorageResult> {
    try {
      const normalizedSourcePath = this.normalizePath(sourcePath);
      const normalizedDestPath = this.normalizePath(destinationPath);
      
      const fullSourcePath = path.resolve(this.baseDir, normalizedSourcePath);
      const fullDestPath = path.resolve(this.baseDir, normalizedDestPath);
      
      // Ensure destination directory exists
      await this.ensureDirectory(path.dirname(fullDestPath));
      
      // Copy file
      await fs.copyFile(fullSourcePath, fullDestPath);
      
      // Copy or create metadata
      if (options.metadata) {
        await this.writeMetadata(normalizedDestPath, options.metadata);
      } else {
        try {
          const sourceMeta = await this.getFileMetadata(normalizedSourcePath);
          if (sourceMeta) {
            await this.writeMetadata(normalizedDestPath, sourceMeta);
          }
        } catch (err) {
          // Ignore errors if source metadata doesn't exist
        }
      }
      
      return {
        path: normalizedDestPath,
        url: `${this.baseUrl}/${normalizedDestPath}`,
        metadata: options.metadata
      };
    } catch (error) {
      logger.error('Error copying file locally', { sourcePath, destinationPath, error });
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }
  
  /**
   * Get file metadata from local storage
   * @param filePath Path to the file
   * @returns Promise resolving to file metadata
   */
  async getFileMetadata(filePath: string): Promise<Record<string, any>> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const fullPath = path.resolve(this.baseDir, normalizedPath);
      
      // Read file stats
      const stats = await fs.stat(fullPath);
      
      // Try to read metadata file if it exists
      let metadata = {};
      try {
        const metaPath = `${fullPath}.meta.json`;
        const metaContent = await fs.readFile(metaPath, 'utf8');
        metadata = JSON.parse(metaContent);
      } catch (err) {
        // Ignore errors if metadata file doesn't exist
        if (err.code !== 'ENOENT') {
          logger.warn('Error reading metadata file', { filePath, error: err });
        }
      }
      
      return {
        contentLength: stats.size,
        lastModified: stats.mtime,
        metadata
      };
    } catch (error) {
      logger.error('Error getting file metadata locally', { filePath, error });
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
  
  /**
   * Write metadata to a file
   * @param filePath Path of the file
   * @param metadata Metadata to write
   */
  private async writeMetadata(filePath: string, metadata: Record<string, any>): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    const fullPath = path.resolve(this.baseDir, normalizedPath);
    const metaPath = `${fullPath}.meta.json`;
    
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
  }
  
  /**
   * Ensure directory exists, creating it if necessary
   * @param dirPath Directory path
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Normalize path by removing leading slash
   * @param filePath Path to normalize
   * @returns Normalized path
   */
  private normalizePath(filePath: string): string {
    return filePath.startsWith('/') ? filePath.substring(1) : filePath;
  }
  
  /**
   * Generate a token for URL signing
   * @param path File path
   * @param operation Operation type
   * @param expiry Expiration timestamp
   * @returns Signed token
   */
  private generateToken(path: string, operation: string, expiry: number): string {
    // This is a simple example - in production use a proper HMAC
    const hmacKey = 'local-storage-hmac-key'; // In real app, use a proper secret key
    const data = `${path}:${operation}:${expiry}`;
    return crypto.createHmac('sha256', hmacKey).update(data).digest('hex');
  }
}
