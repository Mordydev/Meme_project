/**
 * Response Formatter Middleware
 * 
 * Ensures all API responses follow the standard format defined in the API Guidelines.
 * This middleware wraps all responses in the standard format:
 * {
 *   data: <response payload>,
 *   meta: {
 *     timestamp: <ISO date>,
 *     requestId: <request ID>
 *   },
 *   pagination?: {
 *     page: <page number>,
 *     pageSize: <page size>,
 *     totalItems: <total items>,
 *     totalPages: <total pages>
 *   }
 * }
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger';

/**
 * Response formatter middleware
 * Standardizes API response format across all endpoints
 */
export async function responseFormatter(request: FastifyRequest, reply: FastifyReply) {
  // Store original send function to capture and format response
  const originalSend = reply.send;
  
  // Override send to format response
  reply.send = function(payload) {
    // Skip formatting if:
    // 1. Response is already formatted (has data and meta properties)
    // 2. Response is a raw buffer (like file downloads)
    // 3. Response is null or undefined
    if (
      !payload ||
      (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) ||
      Buffer.isBuffer(payload) ||
      reply.getHeader('content-type')?.toString().includes('application/octet-stream')
    ) {
      return originalSend.call(this, payload);
    }
    
    // Format the response
    const formattedPayload = {
      data: payload,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
    
    // Handle pagination if provided in request query
    const query = request.query as any;
    if (query && query.page && query.pageSize && Array.isArray(payload)) {
      // Extract pagination data from query and payload
      const page = parseInt(query.page) || 1;
      const pageSize = parseInt(query.pageSize) || 20;
      
      // Check if reply has custom headers for pagination
      const totalItems = parseInt(reply.getHeader('x-total-items')?.toString() || '0');
      
      if (totalItems > 0) {
        // Add pagination info to response
        (formattedPayload as any).pagination = {
          page,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize)
        };
        
        // Remove custom header since it's now in the payload
        reply.removeHeader('x-total-items');
      }
    }
    
    // Log formatted response (excluding sensitive data)
    logger.debug('Response formatted', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      hasData: !!formattedPayload.data,
      requestId: request.id
    });
    
    // Send formatted response
    return originalSend.call(this, formattedPayload);
  };
}

/**
 * Function to set pagination headers for response formatting
 * @param reply Fastify reply object
 * @param totalItems Total number of items
 */
export function setPaginationHeaders(reply: FastifyReply, totalItems: number) {
  reply.header('x-total-items', totalItems.toString());
}
