/**
 * Wallet Authentication Handler
 * 
 * Handles authentication via blockchain wallet (Phantom)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendError } from '../../lib/response';
import { authService } from '../../services/auth-service';
import { walletService } from '../../services/wallet-service';
import { sessionService } from '../../services/session-service';
import { logger } from '../../lib/logger';
import { ValidationError, NotFoundError, UnauthorizedError } from '../../errors';
import { auditService } from '../../auth/audit';
import { AuditEventType } from '../../auth/audit/events';
import { onboardingService } from '../../auth/onboarding/service';

/**
 * @openapi
 * /api/v1/auth/wallet:
 *   post:
 *     summary: Authenticate a user using a wallet signature
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   walletAddress:
 *                     type: string
 *                   signature:
 *                     type: string
 *                   sessionId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Successfully authenticated with wallet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     expires_in:
 *                       type: number
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         display_name:
 *                           type: string
 *                         wallet:
 *                           type: object
 *                           properties:
 *                             address:
 *                               type: string
 *                             connected:
 *                               type: boolean
 */
export async function walletAuthHandler(
  request: FastifyRequest<{
    Body: {
      data: {
        walletAddress: string;
        signature: string;
        sessionId: string;
      }
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { walletAddress, signature, sessionId } = request.body.data;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];
    
    // Log authentication attempt
    await auditService.logEvent({
      type: AuditEventType.USER_LOGIN_ATTEMPT,
      ip: ipAddress,
      userAgent,
      metadata: {
        method: 'wallet',
        walletAddress: walletAddress.slice(0, 8) + '...'
      }
    });
    
    // Verify the wallet signature
    const verificationResult = await walletService.verifySignature(
      walletAddress,
      signature,
      sessionId
    );
    
    if (!verificationResult.valid) {
      // Log failed login attempt
      await auditService.logEvent({
        type: AuditEventType.USER_LOGIN_FAILED,
        ip: ipAddress,
        userAgent,
        metadata: {
          method: 'wallet',
          reason: verificationResult.error || 'Invalid signature',
          walletAddress: walletAddress.slice(0, 8) + '...'
        }
      });
      
      return sendError(reply, [
        { 
          code: 'WALLET_VERIFICATION_FAILED', 
          message: verificationResult.error || 'Failed to verify wallet signature' 
        }
      ], 401);
    }
    
    // Check if the wallet is already associated with a user
    let user = await authService.getUserByWalletAddress(walletAddress);
    let isNewUser = false;
    
    if (!user) {
      // Create a new user with this wallet
      isNewUser = true;
      user = await authService.createUserFromWallet(walletAddress);
      
      // Initialize onboarding for new user
      await onboardingService.initializeOnboarding(user.id);
    }
    
    // Connect wallet if not already connected
    await walletService.connectWalletToUser(user.id, walletAddress);
    
    // Create a session for the user
    const tokens = await authService.createSession(
      user.id,
      ipAddress,
      userAgent
    );
    
    // Log successful login
    await auditService.logEvent({
      type: AuditEventType.USER_LOGIN,
      userId: user.id,
      ip: ipAddress,
      userAgent,
      metadata: {
        method: 'wallet',
        wallet: walletAddress.slice(0, 8) + '...',
        isNewUser
      }
    });
    
    // Add auth cookies
    const cookieHeaders = sessionService.createAuthCookies(tokens);
    Object.entries(cookieHeaders).forEach(([key, value]) => {
      reply.header(key, value);
    });
    
    return sendSuccess(reply, {
      ...tokens,
      user: {
        id: user.id,
        display_name: user.display_name,
        wallet: {
          address: walletAddress,
          connected: true
        }
      },
      is_new_user: isNewUser,
      onboarding_complete: !isNewUser && 
        await onboardingService.isOnboardingComplete(user.id)
    });
  } catch (error) {
    logger.error('Wallet authentication error', { error });
    
    // Log failed login attempt
    await auditService.logEvent({
      type: AuditEventType.USER_LOGIN_FAILED,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        method: 'wallet',
        reason: error.message || 'Error processing wallet authentication'
      }
    });
    
    if (error instanceof ValidationError) {
      return sendError(reply, [
        { code: 'VALIDATION_ERROR', message: error.message }
      ], 400);
    }
    
    if (error instanceof UnauthorizedError) {
      return sendError(reply, [
        { code: 'UNAUTHORIZED', message: error.message }
      ], 401);
    }
    
    return sendError(reply, [
      { code: 'AUTH_ERROR', message: 'Authentication failed' }
    ], 500);
  }
}

/**
 * @openapi
 * /api/v1/auth/wallet/message:
 *   get:
 *     summary: Get a message to sign with wallet
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: Wallet address
 *     responses:
 *       200:
 *         description: Message generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     sessionId:
 *                       type: string
 */
export async function getSigningMessageHandler(
  request: FastifyRequest<{
    Querystring: {
      address: string;
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { address } = request.query;
    
    if (!address) {
      return sendError(reply, [
        { code: 'MISSING_ADDRESS', message: 'Wallet address is required' }
      ], 400);
    }
    
    // Generate a message for the user to sign
    const { message, sessionId } = await walletService.generateSigningMessage(address);
    
    // Log message generation
    await auditService.logEvent({
      type: AuditEventType.WALLET_SIGNING_REQUEST,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        walletAddress: address.slice(0, 8) + '...'
      }
    });
    
    return sendSuccess(reply, {
      message,
      sessionId
    });
  } catch (error) {
    logger.error('Error generating signing message', { error });
    
    return sendError(reply, [
      { code: 'MESSAGE_GENERATION_ERROR', message: 'Failed to generate signing message' }
    ], 500);
  }
}
