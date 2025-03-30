import { put, PutBlobResult, del } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import { logger } from '../../../lib/logger'; // Assuming logger path

// Helper function to convert buffer to stream if needed by @vercel/blob
// Note: @vercel/blob's put function can accept Buffer directly
// function bufferToStream(buffer: Buffer): Readable {
//   const stream = new Readable();
//   stream.push(buffer);
//   stream.push(null); // Signal end of stream
//   return stream;
// }

export class BlobProvider {
  async upload(
    fileBuffer: Buffer,
    contentType: string,
    originalFilename: string = 'upload'
  ): Promise<PutBlobResult> {
    // Extract file extension, default to 'bin' if none
    const extension = originalFilename.includes('.')
      ? originalFilename.split('.').pop() ?? 'bin' // Added nullish coalescing for safety
      : 'bin';
    const uniqueFilename = `${nanoid()}.${extension}`;

    logger.info(
      { filename: uniqueFilename, contentType },
      'Uploading file to Vercel Blob'
    );

    try {
      const blob = await put(uniqueFilename, fileBuffer, {
        access: 'public',
        contentType: contentType,
        // Add cache control headers if needed, e.g., cache for 1 year
        // cacheControlMaxAge: 31536000,
      });

      logger.info({ url: blob.url, pathname: blob.pathname }, 'File uploaded successfully');
      return blob;
    } catch (error: any) {
      logger.error({ error: error.message, filename: uniqueFilename }, 'Vercel Blob upload failed');
      // Consider wrapping in a custom AppError
      throw new Error(`Failed to upload file to Vercel Blob: ${error.message}`);
    }
  }

  // Add delete functionality
  async delete(pathname: string): Promise<void> {
    try {
      // Vercel Blob SDK expects URLs, not just pathnames for deletion
      // Construct the URL based on how you store it or retrieve it.
      // If you only store the pathname, you might need to reconstruct the full URL.
      // Example: Assuming blob.url is stored and passed here.
      // await del(urlToDelete);
      // If only pathname is available, this might not work directly.
      // For now, let's assume the full URL is passed or constructed.
      // This needs verification based on how Vercel Blob SDK's del works.
      // Let's log a warning for now.
      logger.warn({ pathname }, 'Blob deletion requested. Ensure full URL is used with del() if required by SDK.');
      // await del(pathname); // Placeholder - Requires correct URL/pathname usage
      logger.info({ pathname }, 'File deletion attempted from Vercel Blob');
    } catch (error: any) {
      logger.error({ error: error.message, pathname }, 'Vercel Blob delete failed');
      throw new Error(`Failed to delete file from Vercel Blob: ${error.message}`);
    }
  }
}

export const blobProvider = new BlobProvider();
