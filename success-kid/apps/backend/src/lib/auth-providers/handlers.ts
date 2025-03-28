import { FastifyRequest, FastifyReply } from 'fastify';
import { authProviderService, AuthProvider } from './service';
import { logger } from '../../lib/logger';
import { UnauthorizedError, ValidationError, ForbiddenError } from '../../lib/errors';
import { securityAuditService, AuthEvent } from '../security/audit-service';

/**
 * Handler to get linked identities for current user
 */
export async function getUserIdentitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Get all identities for the user
    const identities = await authProviderService.getUserIdentities(request.user.id);
    
    return {
      data: {
        identities
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error getting user identities', { error });
    
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new Error('Failed to retrieve identity information');
  }
}

/**
 * Handler to unlink an identity (e.g., social login)
 */
export async function unlinkIdentityHandler(
  request: FastifyRequest<{
    Body: {
      provider: AuthProvider;
    };
  }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const { provider } = request.body;
    
    if (!provider) {
      throw new ValidationError('Provider is required');
    }
    
    // Get all identities for the user
    const identities = await authProviderService.getUserIdentities(request.user.id);
    
    // Make sure user has more than one identity - can't unlink the last one
    if (identities.length <= 1) {
      throw new ForbiddenError('Cannot unlink the only identity - add another provider first');
    }
    
    // Make sure user has the identity they're trying to unlink
    const hasIdentity = identities.some(identity => identity.provider === provider);
    
    if (!hasIdentity) {
      throw new ValidationError(`You don't have a linked ${provider} identity`);
    }
    
    // Unlink the identity
    await authProviderService.unlinkIdentity(request.user.id, provider);
    
    // Log the action
    await securityAuditService.logAuthEvent(
      AuthEvent.ACCOUNT_UPDATE,
      {
        userId: request.user.id,
        action: 'unlink_identity',
        provider
      }
    );
    
    return {
      data: {
        success: true,
        provider
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error unlinking identity', { error });
    
    if (error instanceof UnauthorizedError || 
        error instanceof ValidationError || 
        error instanceof ForbiddenError) {
      throw error;
    }
    
    throw new Error('Failed to unlink identity');
  }
}

/**
 * Handler to get a user's primary identity
 */
export async function getPrimaryIdentityHandler(
  request: FastifyRequest<{
    Params: { userId: string };
  }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const { userId } = request.params;
    
    // Users can only view their own primary identity unless they're admins
    if (userId !== request.user.id && request.user.role !== 'admin') {
      throw new ForbiddenError('Cannot access another user\'s identity information');
    }
    
    // Get primary identity
    const identity = await authProviderService.getPrimaryIdentity(userId);
    
    if (!identity) {
      throw new ValidationError('User has no identity information');
    }
    
    return {
      data: {
        identity
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error getting primary identity', { error });
    
    if (error instanceof UnauthorizedError || 
        error instanceof ValidationError || 
        error instanceof ForbiddenError) {
      throw error;
    }
    
    throw new Error('Failed to retrieve identity information');
  }
}
