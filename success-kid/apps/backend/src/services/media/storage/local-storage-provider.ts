/**
 * Local Storage Provider
 * 
 * Implements StorageProvider interface using local filesystem
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, StorageResult, UrlOptions } from './storage-provider';
import { StorageOptions } from '../../../models/media/media';
import { logger } from '../../../lib/logger';
import { NotFoundError } from '../../../errors/api-errors';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private baseUrl: string;
  
  constructor(basePath: string, baseUrl: string) {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
    
    // Ensure the base directory exists
    this.ensureDirectoryExists(this.basePath)
      .catch(err => logger.error('Failed to create base storage directory', { error: err }));
  }
  
  /**
   * Store a file in the local filesystem
   */
  async storeFile(buffer: Buffer, filePath: string, options?: StorageOptions): Promise<StorageResult> {
    try {
      const fullPath = this.getFullPath(filePath);
      
      // Ensure the directory exists
      await this.ensureDirectoryExists(path.dirname(fullPath));
      
      // Write the file
      await fs.writeFile(fullPath, buffer);
      
      // Generate a simple ETag (hash of the file)
      const etag = crypto.createHash('md5').update(buffer).digest('hex');
      
      return {
        path: filePath,
        url: this.getPublicUrl(filePath),
        size: buffer.length,
        etag
      };
    } catch (error) {
      logger.error('Failed to store file locally', { error, path: filePath });
      throw error;
    }
  }
  
  /**
   * Get a file from the local filesystem
   */
  async getFile(filePath: string): Promise<Buffer> {
    try {
      const fullPath = this.getFullPath(filePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath, fs.constants.R_OK);
      } catch (err) {
        throw new NotFoundError(`File not found: ${filePath}`);
      }
      
      // Read the file
      return fs.readFile(fullPath);
    } catch (error) {
      logger.error('Failed to get file from local storage', { error, path: filePath });
      throw error;
    }
  }
  
  /**
   * Delete a file from the local filesystem
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = this.getFullPath(filePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath, fs.constants.W_OK);
      } catch (err) {
        // If file doesn't exist, consider delete successful
        return;
      }
      
      // Delete the file
      await fs.unlink(fullPath);
    } catch (error) {
      logger.error('Failed to delete file from local storage', { error, path: filePath });
      throw error;
    }
  }
  
  /**
   * Generate a presigned URL for direct operations
   * For local storage, we just generate a URL with a time-limited token
   */
  async generatePresignedUrl(
    operation: 'upload' | 'download',
    filePath: string,
    options?: UrlOptions
  ): Promise<string> {
    try {
      const expires = options?.expires || 3600; // Default 1 hour
      
      // For local storage, generate a token that will be validated by the API
      const timestamp = Math.floor(Date.now() / 1000) + expires;
      const data = `${operation}:${filePath}:${timestamp}`;
      const token = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
        .update(data)
        .digest('hex');
      
      // Build the URL
      const url = new URL(`${this.baseUrl}/api/v1/media/presigned`);
      url.searchParams.append('path', filePath);
      url.searchParams.append('operation', operation);
      url.searchParams.append('expires', timestamp.toString());
      url.searchParams.append('token', token);
      
      if (options?.contentType) {
        url.searchParams.append('contentType', options.contentType);
      }
      
      if (options?.filename) {
        url.searchParams.append('filename', options.filename);
      }
      
      if (options?.contentDisposition) {
        url.searchParams.append('contentDisposition', options.contentDisposition);
      }
      
      return url.toString();
    } catch (error) {
      logger.error('Failed to generate presigned URL', { error, path: filePath, operation });
      throw error;
    }
  }
  
  /**
   * Check if a file exists in the local filesystem
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(filePath);
      
      try {
        await fs.access(fullPath, fs.constants.R_OK);
        return true;
      } catch (err) {
        return false;
      }
    } catch (error) {
      logger.error('Failed to check if file exists', { error, path: filePath });
      throw error;
    }
  }
  
  /**
   * Move/Rename a file in the local filesystem
   */
  async moveFile(sourcePath: string, destinationPath: string): Promise<StorageResult> {
    try {
      const sourceFullPath = this.getFullPath(sourcePath);
      const destFullPath = this.getFullPath(destinationPath);
      
      // Ensure the destination directory exists
      await this.ensureDirectoryExists(path.dirname(destFullPath));
      
      // Check if source file exists
      try {
        await fs.access(sourceFullPath, fs.constants.R_OK);
      } catch (err) {
        throw new NotFoundError(`Source file not found: ${sourcePath}`);
      }
      
      // Move the file
      await fs.rename(sourceFullPath, destFullPath);
      
      // Get file stats
      const stats = await fs.stat(destFullPath);
      
      return {
        path: destinationPath,
        url: this.getPublicUrl(destinationPath),
        size: stats.size
      };
    } catch (error) {
      logger.error('Failed to move file', { error, sourcePath, destinationPath });
      throw error;
    }
  }
  
  /**
   * Get file metadata from the local filesystem
   */
  async getFileMetadata(filePath: string): Promise<Record<string, any>> {
    try {
      const fullPath = this.getFullPath(filePath);
      
      // Check if file exists
      try {
        await fs.access(fullPath, fs.constants.R_OK);
      } catch (err) {
        throw new NotFoundError(`File not found: ${filePath}`);
      }
      
      // Get file stats
      const stats = await fs.stat(fullPath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime
      };
    } catch (error) {
      logger.error('Failed to get file metadata', { error, path: filePath });
      throw error;
    }
  }
  
  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    // For local storage, return a URL to the media serving endpoint
    return `${this.baseUrl}/api/v1/media/serve/${encodeURIComponent(filePath)}`;
  }
  
  /**
   * Helper method to ensure a directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore error if directory already exists
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  /**
   * Helper method to get full path
   */
  private getFullPath(filePath: string): string {
    // Sanitize path to prevent path traversal attacks
    const sanitizedPath = filePath.replace(/\.\.\//g, '').replace(/\.\./g, '');
    return path.join(this.basePath, sanitizedPath);
  }
}
