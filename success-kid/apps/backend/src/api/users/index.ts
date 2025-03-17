/**
 * User API Routes
 * 
 * Registers all user-related routes
 */
import { FastifyInstance } from 'fastify';
import { registerProfileRoutes } from './profile';
import { registerWalletRoutes } from './wallet';

/**
 * Register all user routes
 */
export function registerUserRoutes(fastify: FastifyInstance) {
  // Register profile routes
  registerProfileRoutes(fastify);
  
  // Register wallet routes
  registerWalletRoutes(fastify);
}
