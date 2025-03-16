/**
 * Authentication Utilities
 * 
 * Utility functions for authentication and authorization
 */
import { FastifyRequest } from 'fastify';

/**
 * Get user ID from request
 * @param request Fastify request
 * @param required Whether the user ID is required
 * @returns User ID or null if not found
 */
export function getUserIdFromRequest(request: FastifyRequest, required: boolean = true): string | null {
  // Check if user is authenticated
  if (request.user && request.user.id) {
    return request.user.id;
  }
  
  // If required, throw error
  if (required) {
    throw new Error('Authentication required');
  }
  
  return null;
}

/**
 * Check if user has admin role
 * @param request Fastify request
 * @returns Whether the user has admin role
 */
export function isAdmin(request: FastifyRequest): boolean {
  return !!request.user?.isAdmin;
}

/**
 * Check if user has specific role
 * @param request Fastify request
 * @param role Role to check
 * @returns Whether the user has the role
 */
export function hasRole(request: FastifyRequest, role: string): boolean {
  return Array.isArray(request.user?.roles) && request.user.roles.includes(role);
}
