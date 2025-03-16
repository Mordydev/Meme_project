/**
 * Authentication API Handlers
 * 
 * Handlers for authentication and user management endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendError } from '../../lib/response';
import { authService } from '../../services/auth-service';
import { sessionService } from '../../services/session-service';
import { logger } from '../../lib/logger';
import { ValidationError, NotFoundError } from '../../errors';
import { verifyClerkJWT } from '../../auth/clerk';
import { auditService } from '../../auth/audit/service';
import { AuditEventType } from '../../auth/audit/events';
import { 
  sendEmailVerification, 
  verifyEmail,
  sendPasswordReset,
  resetPassword
} from '../../auth/verification';
import { onboardingService } from '../../auth/onboarding/service';
import { OnboardingStepType } from '../../auth/onboarding/steps';

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate a user and return a token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/loginRequestSchema'
 *     responses:
 *       200:
 *         description: Login successful
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
 *                         email:
 *                           type: string
 */
export async function loginHandler(
  request: FastifyRequest<{ Body: { email: string; password: string; } }>,
  reply: FastifyReply
) {
  try {
    // For Clerk integration, we expect an authorization token
    // This handler is to support non-Clerk authentication methods
    // and to provide a consistent API interface

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Handle Clerk token authentication
      const token = authHeader.split(' ')[1];
      const ipAddress = request.ip;
      const userAgent = request.headers['user-agent'];
      
      const clerkUser = await verifyClerkJWT(token);
      if (!clerkUser) {
        // Log failed login attempt
        await auditService.logEvent({
          type: AuditEventType.USER_LOGIN_FAILED,
          ip: ipAddress,
          userAgent,
          metadata: {
            reason: 'Invalid Clerk token'
          }
        });
        
        return sendError(reply, [
          { code: 'AUTH_ERROR', message: 'Authentication failed' }
        ], 401);
      }
      
      // Authenticate with our service
      const result = await authService.authenticateWithClerk(
        token, 
        ipAddress, 
        userAgent
      );
      
      if (!result) {
        // Log failed login attempt
        await auditService.logEvent({
          type: AuditEventType.USER_LOGIN_FAILED,
          ip: ipAddress,
          userAgent,
          metadata: {
            reason: 'Failed to authenticate with Clerk'
          }
        });
        
        return sendError(reply, [
          { code: 'AUTH_ERROR', message: 'Authentication failed' }
        ], 401);
      }
      
      // Log successful login
      await auditService.logEvent({
        type: AuditEventType.USER_LOGIN,
        userId: result.user.id,
        ip: ipAddress,
        userAgent,
        metadata: {
          authProvider: 'clerk',
          isNewUser: result.isNewUser
        }
      });
      
      // If this is a new user, initialize onboarding
      if (result.isNewUser) {
        await onboardingService.initializeOnboarding(result.user.id);
      }
      
      // Add auth cookies
      const cookieHeaders = sessionService.createAuthCookies(result.tokens);
      Object.entries(cookieHeaders).forEach(([key, value]) => {
        reply.header(key, value);
      });
      
      return sendSuccess(reply, {
        ...result.tokens,
        user: {
          id: result.user.id,
          display_name: result.user.display_name,
          email: result.user.email
        },
        is_new_user: result.isNewUser,
        onboarding_complete: !result.isNewUser && 
          await onboardingService.isOnboardingComplete(result.user.id)
      });
    }
    
    // Email/password login flow is a fallback if we're not using Clerk
    // This would be replaced with your actual authentication logic
    const { email, password } = request.body;
    logger.debug('Email/password login attempt', { email });
    
    // Log attempt
    await auditService.logEvent({
      type: AuditEventType.USER_LOGIN_FAILED,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        reason: 'Password-based login not implemented',
        email
      }
    });
    
    // Placeholder authentication - in production, implement password validation
    // against securely stored credentials
    return sendError(reply, [
      { 
        code: 'AUTH_METHOD_NOT_SUPPORTED', 
        message: 'Password-based login is not yet implemented'
      }
    ], 400);
  } catch (error) {
    logger.error('Login error', { error });
    
    // Log error
    await auditService.logEvent({
      type: AuditEventType.USER_LOGIN_FAILED,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        reason: 'Error processing login',
        error: error.message
      }
    });
    
    return sendError(reply, [{ code: 'AUTH_ERROR', message: 'Authentication failed' }], 401);
  }
}

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/registerRequestSchema'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         display_name:
 *                           type: string
 */
export async function registerHandler(
  request: FastifyRequest<{
    Body: { email: string; password: string; username: string; }
  }>,
  reply: FastifyReply
) {
  try {
    const { email, password, username } = request.body;
    
    // Log registration attempt
    await auditService.logEvent({
      type: AuditEventType.USER_REGISTERED,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        email,
        username
      }
    });
    
    // With Clerk integration, we don't typically handle registration directly
    // Instead, Clerk manages the registration and we create a user in our system
    // when they first authenticate with a Clerk JWT
    
    // However, we can implement a registration endpoint for non-Clerk flows
    // or to pre-register a user in our system
    
    // For now, this is just a placeholder that will forward to Clerk
    return sendSuccess(reply, {
      message: 'Please register using the Clerk authentication service',
      redirect_url: 'https://clerk.success-kid.com/sign-up'
    }, 200);
  } catch (error) {
    logger.error('Registration error', { error });
    
    // Log error
    await auditService.logEvent({
      type: AuditEventType.USER_REGISTERED,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        error: error.message,
        status: 'failed'
      }
    });
    
    if (error instanceof ValidationError) {
      return sendError(reply, [{ code: 'VALIDATION_ERROR', message: error.message }], 400);
    }
    
    return sendError(reply, [{ code: 'REGISTRATION_ERROR', message: 'Registration failed' }], 500);
  }
}

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh authentication tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *             required:
 *               - refresh_token
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
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
 */
export async function refreshTokenHandler(
  request: FastifyRequest<{ Body: { refresh_token?: string } }>,
  reply: FastifyReply
) {
  try {
    // Get refresh token from request body or cookie
    let refreshToken = request.body.refresh_token;
    
    // If not in body, try to get from cookie
    if (!refreshToken && request.cookies.refresh_token) {
      refreshToken = request.cookies.refresh_token;
    }
    
    if (!refreshToken) {
      return sendError(reply, [{ 
        code: 'MISSING_REFRESH_TOKEN', 
        message: 'Refresh token is required' 
      }], 400);
    }
    
    // Refresh the tokens
    const tokens = await sessionService.refreshTokens(refreshToken);
    
    if (!tokens) {
      return sendError(reply, [{ 
        code: 'INVALID_REFRESH_TOKEN', 
        message: 'Invalid or expired refresh token' 
      }], 401);
    }
    
    // Add auth cookies
    const cookieHeaders = sessionService.createAuthCookies(tokens);
    Object.entries(cookieHeaders).forEach(([key, value]) => {
      reply.header(key, value);
    });
    
    // Log token refresh
    await auditService.logEvent({
      type: AuditEventType.SESSION_REFRESHED,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    });
    
    return sendSuccess(reply, tokens);
  } catch (error) {
    logger.error('Token refresh error', { error });
    return sendError(reply, [{ code: 'REFRESH_ERROR', message: 'Failed to refresh tokens' }], 500);
  }
}

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out a user by invalidating their session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: all_devices
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Whether to log out from all devices
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 */
export async function logoutHandler(
  request: FastifyRequest<{ Querystring: { all_devices?: boolean } }>,
  reply: FastifyReply
) {
  try {
    // Get session ID from token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no token, just return success (idempotent logout)
      return sendSuccess(reply, { success: true });
    }
    
    const token = authHeader.split(' ')[1];
    const verification = await sessionService.verifyToken(token);
    
    if (!verification.valid || !verification.payload) {
      // If invalid token, just return success (idempotent logout)
      return sendSuccess(reply, { success: true });
    }
    
    const sessionId = verification.payload.jti;
    const userId = verification.payload.sub;
    
    // Log logout action
    await auditService.logEvent({
      type: AuditEventType.USER_LOGOUT,
      userId,
      sessionId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        all_devices: request.query.all_devices || false
      }
    });
    
    // Check if we should log out from all devices
    if (request.query.all_devices) {
      await authService.logoutAll(userId, sessionId);
    } else {
      await authService.logout(sessionId);
    }
    
    // Clear auth cookies
    const cookieHeaders = sessionService.createLogoutCookies();
    Object.entries(cookieHeaders).forEach(([key, value]) => {
      reply.header(key, value);
    });
    
    return sendSuccess(reply, { success: true });
  } catch (error) {
    logger.error('Logout error', { error });
    return sendError(reply, [{ code: 'LOGOUT_ERROR', message: 'Error during logout' }], 500);
  }
}

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         display_name:
 *                           type: string
 *                         email:
 *                           type: string
 */
export async function getCurrentUserHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // User should be attached to request by auth middleware
    if (!request.user) {
      return sendError(reply, [
        { code: 'UNAUTHORIZED', message: 'Authentication required' }
      ], 401);
    }
    
    // Get user permissions and roles
    const roles = await authService.getUserRoles(request.user.id);
    const permissions = await authService.getUserPermissions(request.user.id);
    
    // Get onboarding status
    const onboardingProgress = await onboardingService.getProgress(request.user.id);
    const onboardingComplete = await onboardingService.isOnboardingComplete(request.user.id);
    const onboardingPercentage = await onboardingService.getCompletionPercentage(request.user.id);
    
    return sendSuccess(reply, {
      user: {
        id: request.user.id,
        display_name: request.user.display_name,
        email: request.user.email,
        roles: roles.map(r => r.name),
        permissions: permissions.map(p => `${p.resource}:${p.action}`)
      },
      onboarding: {
        complete: onboardingComplete,
        percentage: onboardingPercentage,
        current_step: onboardingProgress?.currentStep,
        completed_steps: onboardingProgress?.completedSteps || []
      }
    });
  } catch (error) {
    logger.error('Error getting current user', { error });
    return sendError(reply, [{ code: 'USER_ERROR', message: 'Error retrieving user data' }], 500);
  }
}

/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Send verification email
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
export async function sendVerificationEmailHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      return sendError(reply, [
        { code: 'UNAUTHORIZED', message: 'Authentication required' }
      ], 401);
    }
    
    const success = await sendEmailVerification(request.user.id, request.user.email);
    
    if (success) {
      // Log email verification sent
      await auditService.logEvent({
        type: AuditEventType.EMAIL_VERIFICATION_SENT,
        userId: request.user.id,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        metadata: {
          email: request.user.email
        }
      });
      
      return sendSuccess(reply, {
        success: true,
        message: 'Verification email sent successfully'
      });
    } else {
      return sendError(reply, [
        { code: 'EMAIL_ERROR', message: 'Failed to send verification email' }
      ], 500);
    }
  } catch (error) {
    logger.error('Error sending verification email', { error });
    return sendError(reply, [
      { code: 'EMAIL_ERROR', message: 'Failed to send verification email' }
    ], 500);
  }
}

/**
 * @openapi
 * /api/v1/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email with token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
export async function verifyEmailHandler(
  request: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply
) {
  try {
    const { token } = request.params;
    
    const success = await verifyEmail(token);
    
    if (success) {
      // Log email verification
      await auditService.logEvent({
        type: AuditEventType.EMAIL_VERIFIED,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });
      
      // Complete the email verification step in onboarding
      // Note: We don't have user ID here as the token verification doesn't return it
      // In a real implementation, we would extract the user ID from the token or result
      
      return sendSuccess(reply, {
        success: true,
        message: 'Email verified successfully'
      });
    } else {
      return sendError(reply, [
        { code: 'INVALID_TOKEN', message: 'Invalid or expired verification token' }
      ], 400);
    }
  } catch (error) {
    logger.error('Error verifying email', { error });
    return sendError(reply, [
      { code: 'VERIFICATION_ERROR', message: 'Failed to verify email' }
    ], 500);
  }
}

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
export async function forgotPasswordHandler(
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
) {
  try {
    const { email } = request.body;
    
    // Log password reset attempt
    await auditService.logEvent({
      type: AuditEventType.PASSWORD_RESET_REQUESTED,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        email
      }
    });
    
    const success = await sendPasswordReset(email);
    
    // Always return success even if the email doesn't exist
    // This prevents user enumeration
    return sendSuccess(reply, {
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    logger.error('Error sending password reset', { error });
    
    // Still return success to prevent user enumeration
    return sendSuccess(reply, {
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  }
}

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - token
 *               - password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
export async function resetPasswordHandler(
  request: FastifyRequest<{ Body: { token: string; password: string } }>,
  reply: FastifyReply
) {
  try {
    const { token, password } = request.body;
    
    // Validate password
    if (password.length < 8) {
      return sendError(reply, [
        { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters long' }
      ], 400);
    }
    
    const success = await resetPassword(token, password);
    
    if (success) {
      // Log password reset
      await auditService.logEvent({
        type: AuditEventType.PASSWORD_RESET_COMPLETED,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });
      
      return sendSuccess(reply, {
        success: true,
        message: 'Password reset successfully'
      });
    } else {
      return sendError(reply, [
        { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' }
      ], 400);
    }
  } catch (error) {
    logger.error('Error resetting password', { error });
    return sendError(reply, [
      { code: 'RESET_ERROR', message: 'Failed to reset password' }
    ], 500);
  }
}
