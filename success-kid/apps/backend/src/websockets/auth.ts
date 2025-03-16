/**
 * WebSocket Authentication Utilities
 * 
 * Functions for authenticating WebSocket connections
 */
import { FastifyRequest } from 'fastify';
import { IncomingMessage } from 'http';
import { URLSearchParams } from 'url';
import { logger } from '../lib/logger';

/**
 * Extract bearer token from WebSocket request
 * 
 * @param request WebSocket upgrade request
 * @returns Bearer token or null if not found
 */
export function extractToken(request: IncomingMessage): string | null {
  try {
    // Extract from query parameter
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (token) {
      return token;
    }
    
    // Extract from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  } catch (error) {
    logger.error('WebSocket auth error extracting token', { error });
    return null;
  }
}

/**
 * Authenticate WebSocket connection
 * 
 * Verifies the token and returns user ID if valid.
 * 
 * @param request Fastify request object from WebSocket upgrade
 * @returns User ID if authenticated, null otherwise
 */
export function authenticateWebSocketConnection(request: FastifyRequest): string | null {
  try {
    // Get user from Fastify authentication (assuming JWT auth plugin is used)
    if (request.user && request.user.id) {
      return request.user.id;
    }
    
    // For now, return null as not authenticated
    // This will be enhanced when a proper auth system is implemented
    return null;
  } catch (error) {
    logger.error('WebSocket authentication error', { error });
    return null;
  }
}

/**
 * Mock authentication for development environment
 * 
 * @param token The auth token to verify
 * @returns User ID if token is valid, null otherwise
 */
export function mockAuthenticateToken(token: string): string | null {
  // This is only for development - NOT FOR PRODUCTION
  if (process.env.NODE_ENV !== 'production' && token === 'dev-token') {
    return 'test-user-id';
  }
  
  return null;
}
