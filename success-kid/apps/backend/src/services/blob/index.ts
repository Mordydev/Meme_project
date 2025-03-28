import { put, del, list, PutBlobResult } from '@vercel/blob';
import { Logger } from 'pino'; // Assuming pino logger is used

// Placeholder for the actual logger import path
// If the logger is structured differently, this import needs adjustment.
// Example assumes logger is exported from a central lib directory.
let logger: Logger;
try {
  // Adjust this path based on your actual logger location
  // Using require for CommonJS compatibility and adding .js extension
  const loggerModule = require('../../lib/logger.js');
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../../lib/logger.js', using console.", e);
  logger = console as any; // Fallback to console if logger import fails
}


export interface BlobOptions {
  contentType: string;
  access: 'public'; // Vercel Blob access level - restricting to 'public' based on TS error
  addRandomSuffix?: boolean;
  cacheControlMaxAge?: number;
}

export class BlobService {
  // Define allowed MIME types and max size
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly maxSizeBytes = 5 * 1024 * 1024; // 5MB limit as per plan

  /**
   * Uploads a file buffer to Vercel Blob storage.
   * @param buffer The file content as a Buffer.
   * @param filename The original filename.
   * @param options Blob storage options (contentType, access, etc.).
   * @param userId The ID of the user uploading the file, used for path organization.
   * @returns A promise resolving to the PutBlobResult from Vercel Blob.
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    options: BlobOptions,
    userId: string
  ): Promise<PutBlobResult> {
    try {
      // --- Validation ---
      // Check content type
      if (!this.allowedTypes.includes(options.contentType)) {
        logger.warn('Unsupported file type attempt', { userId, filename, contentType: options.contentType });
        throw new Error(`Unsupported file type. Allowed types: ${this.allowedTypes.join(', ')}`);
      }

      // Check file size
      if (buffer.length > this.maxSizeBytes) {
        logger.warn('File size exceeded limit', { userId, filename, size: buffer.length, maxSize: this.maxSizeBytes });
        throw new Error(`File exceeds maximum size of ${this.maxSizeBytes / (1024 * 1024)}MB.`);
      }

      // --- Path Generation ---
      // Sanitize filename to prevent path traversal or invalid characters
      const sanitizedFilename = this.sanitizeFilename(filename);
      // Create a structured path: userId/timestamp-filename
      const path = `${userId}/${Date.now()}-${sanitizedFilename}`;

      // --- Upload ---
      logger.info('Uploading file to blob storage', { userId, path, size: buffer.length, contentType: options.contentType });

      const result = await put(path, buffer, {
        contentType: options.contentType,
        access: 'public', // Hardcoding to 'public' as required by the library type
        addRandomSuffix: options.addRandomSuffix ?? false, // Default to false as per plan
        cacheControlMaxAge: options.cacheControlMaxAge ?? 3600, // Default cache age (1 hour)
        // Ensure the BLOB_READ_WRITE_TOKEN is implicitly used by the @vercel/blob package
        // It reads the token from process.env.BLOB_READ_WRITE_TOKEN
      });

      logger.info('File uploaded successfully to blob storage', { userId, path, url: result.url, size: buffer.length });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('File upload to blob storage failed', {
        userId,
        filename,
        contentType: options.contentType,
        error: errorMessage,
      });
      // Re-throw a more user-friendly error or handle appropriately
      throw new Error(`File upload failed: ${errorMessage}`);
    }
  }

  /**
   * Deletes a file from Vercel Blob storage.
   * @param url The URL of the blob to delete.
   * @returns A promise resolving when the deletion is complete.
   */
  async deleteFile(url: string): Promise<void> {
    try {
      logger.info('Attempting to delete blob', { url });
      await del(url); // Requires the full URL
      logger.info('Blob deleted successfully', { url });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Blob deletion failed', { url, error: errorMessage });
      throw new Error(`Failed to delete file: ${errorMessage}`);
    }
  }

  /**
   * Lists files in Vercel Blob storage, optionally filtered by a prefix.
   * @param prefix An optional prefix to filter the listing (e.g., a userId).
   * @returns A promise resolving to the list result from Vercel Blob.
   */
  async listFiles(prefix?: string) {
     try {
       logger.info('Listing blobs', { prefix });
       const results = await list({ prefix });
       logger.info(`Found ${results.blobs.length} blobs`, { prefix });
       return results;
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       logger.error('Failed to list blobs', { prefix, error: errorMessage });
       throw new Error(`Failed to list files: ${errorMessage}`);
     }
  }


  /**
   * Sanitizes a filename to remove potentially harmful characters
   * and replace spaces or multiple underscores.
   * @param filename The original filename.
   * @returns A sanitized filename suitable for use in paths.
   */
  private sanitizeFilename(filename: string): string {
    // Remove characters not typically allowed in filenames/paths
    // Replace spaces and multiple underscores with a single underscore
    return filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Allow letters, numbers, dot, hyphen, underscore
      .replace(/_{2,}/g, '_');          // Collapse multiple underscores
  }
}

// Export a singleton instance for easy use across the application
export const blobService = new BlobService();
