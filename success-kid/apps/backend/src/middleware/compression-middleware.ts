/**
 * Response Compression Middleware
 * 
 * Automatically compresses API responses to reduce bandwidth usage and 
 * improve transfer times, especially on mobile networks.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger';

// Size threshold for compression in bytes (compress responses larger than 1KB)
const COMPRESSION_THRESHOLD = 1024;

// Content types to compress
const COMPRESSIBLE_CONTENT_TYPES = [
  'application/json',
  'application/javascript',
  'text/plain',
  'text/html',
  'text/css',
  'text/xml',
  'application/xml',
  'application/x-javascript',
  'application/xhtml+xml'
];

/**
 * Determines if a response should be compressed based on size and content type
 */
function shouldCompress(request: FastifyRequest, contentType: string, contentLength: number): boolean {
  // Skip compression for certain user agents (if needed)
  const userAgent = request.headers['user-agent'] || '';
  if (userAgent.includes('MSIE 6') || userAgent.includes('Mozilla/4.0')) {
    return false;
  }

  // Check content size is above threshold
  if (contentLength < COMPRESSION_THRESHOLD) {
    return false;
  }

  // Check if content type is compressible
  return COMPRESSIBLE_CONTENT_TYPES.some(type => contentType.includes(type));
}

/**
 * Middleware to automatically compress responses
 */
export function compressionMiddleware(request: FastifyRequest, reply: FastifyReply, done: () => void): void {
  // Store original send function
  const originalSend = reply.send;

  // Override send function to handle compression
  reply.send = function(payload) {
    // For string or Buffer payloads, check size and content type
    if (payload) {
      const contentType = reply.getHeader('content-type') as string || 'application/json';
      const contentLength = typeof payload === 'string' 
        ? Buffer.byteLength(payload, 'utf8')
        : payload instanceof Buffer 
          ? payload.length 
          : Buffer.byteLength(JSON.stringify(payload), 'utf8');

      if (shouldCompress(request, contentType, contentLength)) {
        // Set compression header
        reply.compress(payload);
      }
    }

    // Call original send
    return originalSend.call(this, payload);
  };

  done();
}

// Register this middleware globally
export function registerCompressionMiddleware(fastify: any): void {
  fastify.addHook('onRequest', compressionMiddleware);
  logger.info('Compression middleware registered');
}
