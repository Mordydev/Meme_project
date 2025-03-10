import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthError } from '../lib/errors';

/**
 * Middleware to verify authentication
 * This will extract and verify the session/user from the request
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Extract auth from Clerk middleware
    const { userId } = request.auth || {};
    
    if (!userId) {
      throw new AuthError('Authentication required');
    }
    
    // Add user to request for downstream handlers
    request.userId = userId;
    
    // Optionally fetch full user data
    if (request.query?.includeUser === 'true') {
      const userService = request.server.services.userService;
      request.user = await userService.getById(userId);
    }
    
  } catch (error) {
    throw new AuthError('Authentication failed');
  }
}
