/**
 * Authentication Status Handler
 * 
 * Provides current authentication status and profile information
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendError } from '../../lib/response';
import { authService } from '../../services/auth-service';
import { walletService } from '../../services/wallet-service';
import { profileRepository } from '../../repositories';
import { logger } from '../../lib/logger';

/**
 * @openapi
 * /api/v1/auth/status:
 *   get:
 *     summary: Get current authentication status and profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current authentication status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     isAuthenticated:
 *                       type: boolean
 *                     isOnboarded:
 *                       type: boolean
 *                     authProvider:
 *                       type: string
 *                     hasWalletConnected:
 *                       type: boolean
 *                     profile:
 *                       type: object
 */
export async function getAuthStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Default response for unauthenticated users
    let response = {
      isAuthenticated: false,
      isOnboarded: false,
      authProvider: null,
      hasWalletConnected: false,
      profile: null
    };
    
    // Check if user is authenticated
    if (request.user) {
      // User is authenticated, add details
      const userId = request.user.id;
      
      // Get profile for onboarding status
      const profile = await profileRepository.findByUserId(userId);
      const isOnboarded = Boolean(
        profile && 
        profile.username && 
        profile.created_at
      );
      
      // Check for wallet connections
      const hasWalletConnected = await walletService.hasVerifiedWallet(userId);
      
      // Get auth provider (from user record)
      const user = await authService.getUserById(userId);
      const authProvider = user?.auth_provider || null;
      
      // Build profile data
      const profileData = profile ? {
        id: profile.user_id,
        username: profile.username,
        displayName: user?.display_name || 'User',
        avatar: profile.avatar_url,
        bio: profile.bio,
        level: profile.level,
        wallet: hasWalletConnected ? {
          connected: true,
          // Note: For security, we don't return the actual wallet address here
        } : {
          connected: false
        },
        joinedAt: profile.created_at
      } : null;
      
      // Update response
      response = {
        isAuthenticated: true,
        isOnboarded,
        authProvider,
        hasWalletConnected,
        profile: profileData
      };
    }
    
    return sendSuccess(reply, response);
  } catch (error) {
    logger.error('Error getting auth status', { error });
    return sendError(reply, [
      { code: 'STATUS_ERROR', message: 'Error retrieving authentication status' }
    ], 500);
  }
}
