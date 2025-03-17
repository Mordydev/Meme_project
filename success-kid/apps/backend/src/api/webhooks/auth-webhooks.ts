/**
 * Authentication Webhook Handlers
 * 
 * Processes authentication webhooks from Clerk and triggers relevant
 * WebSocket notifications and system events.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { eventBus, EventType } from '../../lib/event-bus';
import { connectionRegistry } from '../../websockets/connection-registry';
import { presenceService, PresenceStatus } from '../../presence/service';
import { monitoringService } from '../../monitoring/service';

/**
 * Register auth webhook handlers
 * 
 * @param fastify Fastify instance
 */
export default async function authWebhookHandlers(fastify: FastifyInstance): Promise<void> {
  // Verify webhook secret
  const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  // Webhook endpoint for Clerk authentication events
  fastify.post('/webhooks/clerk', {
    config: {
      rawBody: true // Need raw body for signature verification
    },
    schema: {
      // Webhook endpoints don't need schema validation as they use a signature verification mechanism
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify webhook signature if we have a secret
      if (clerkWebhookSecret) {
        // Get signature from headers
        const signature = request.headers['clerk-signature'] as string;
        
        if (!signature) {
          logger.warn('Missing Clerk signature header');
          return reply.status(401).send({ error: 'Unauthorized' });
        }
        
        // Verify signature (implementation depends on Clerk's verification method)
        const isValid = verifyClerkSignature(
          request.rawBody as string,
          signature,
          clerkWebhookSecret
        );
        
        if (!isValid) {
          logger.warn('Invalid Clerk signature');
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      }
      
      // Get webhook data
      const webhookData = request.body;
      const { type, data } = webhookData;
      
      // Process based on event type
      switch (type) {
        case 'user.created':
          await handleUserCreated(data);
          break;
        
        case 'user.updated':
          await handleUserUpdated(data);
          break;
        
        case 'user.deleted':
          await handleUserDeleted(data);
          break;
        
        case 'session.created':
          await handleSessionCreated(data);
          break;
        
        case 'session.removed':
          await handleSessionRemoved(data);
          break;
        
        default:
          logger.debug('Unhandled Clerk webhook event', { type });
      }
      
      // Track webhook processing
      monitoringService.recordMetric('auth.webhook.processed', 1, { type });
      
      // Return success
      return reply.status(200).send({ success: true });
    } catch (error) {
      logger.error('Error processing Clerk webhook', { error });
      
      // Track error
      monitoringService.recordMetric('auth.webhook.error', 1);
      
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

/**
 * Handler for user creation events
 * 
 * @param data Webhook data
 */
async function handleUserCreated(data: any): Promise<void> {
  try {
    const userId = data.id;
    const userEmail = getUserEmail(data);
    
    logger.info('New user created', { userId, email: userEmail });
    
    // Emit event for user creation
    eventBus.publish('user.created', {
      userId,
      email: userEmail,
      firstName: data.first_name,
      lastName: data.last_name,
      createdAt: data.created_at
    });
    
    // Track new user registration
    monitoringService.recordMetric('user.created', 1);
  } catch (error) {
    logger.error('Error handling user created webhook', { error, data });
  }
}

/**
 * Handler for user update events
 * 
 * @param data Webhook data
 */
async function handleUserUpdated(data: any): Promise<void> {
  try {
    const userId = data.id;
    
    logger.info('User updated', { userId });
    
    // Emit event for user update
    eventBus.publish('user.updated', {
      userId,
      email: getUserEmail(data),
      firstName: data.first_name,
      lastName: data.last_name,
      updatedAt: data.updated_at
    });
    
    // Notify user's active connections about profile update
    if (connectionRegistry.isUserConnected(userId)) {
      // Send profile update notification
      connectionRegistry.sendToUser(userId, {
        type: 'user.profile.updated',
        payload: {
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    logger.error('Error handling user updated webhook', { error, data });
  }
}

/**
 * Handler for user deletion events
 * 
 * @param data Webhook data
 */
async function handleUserDeleted(data: any): Promise<void> {
  try {
    const userId = data.id;
    
    logger.info('User deleted', { userId });
    
    // Emit event for user deletion
    eventBus.publish('user.deleted', {
      userId,
      deletedAt: new Date().toISOString()
    });
    
    // Close any active connections for this user
    const connectionIds = connectionRegistry.getConnectionIds(userId);
    
    connectionIds.forEach(connectionId => {
      connectionRegistry.remove(connectionId);
    });
    
    // Update presence to offline
    await presenceService.updatePresence(userId, PresenceStatus.OFFLINE, {
      reason: 'account_deleted'
    });
    
    // Track user deletion
    monitoringService.recordMetric('user.deleted', 1);
  } catch (error) {
    logger.error('Error handling user deleted webhook', { error, data });
  }
}

/**
 * Handler for session creation events
 * 
 * @param data Webhook data
 */
async function handleSessionCreated(data: any): Promise<void> {
  try {
    const userId = data.user_id;
    const sessionId = data.id;
    
    logger.info('User session created', { userId, sessionId });
    
    // Emit event for session creation
    eventBus.publish('user.session.created', {
      userId,
      sessionId,
      createdAt: data.created_at
    });
    
    // Update presence if not already online
    if (!connectionRegistry.isUserConnected(userId)) {
      await presenceService.updatePresence(userId, PresenceStatus.ONLINE, {
        source: 'login',
        sessionId
      });
    }
    
    // Track new session
    monitoringService.recordMetric('user.session.created', 1);
  } catch (error) {
    logger.error('Error handling session created webhook', { error, data });
  }
}

/**
 * Handler for session removal events
 * 
 * @param data Webhook data
 */
async function handleSessionRemoved(data: any): Promise<void> {
  try {
    const userId = data.user_id;
    const sessionId = data.id;
    
    logger.info('User session removed', { userId, sessionId });
    
    // Emit event for session removal
    eventBus.publish('user.session.removed', {
      userId,
      sessionId,
      removedAt: new Date().toISOString()
    });
    
    // Don't update presence to offline immediately - WebSocket connections
    // might still be active from other sessions
    
    // If no active WebSocket connections, update presence to offline
    if (!connectionRegistry.isUserConnected(userId)) {
      await presenceService.updatePresence(userId, PresenceStatus.OFFLINE, {
        source: 'logout',
        sessionId
      });
    }
  } catch (error) {
    logger.error('Error handling session removed webhook', { error, data });
  }
}

/**
 * Get user email from webhook data
 * 
 * @param data Webhook data
 * @returns User email or undefined
 */
function getUserEmail(data: any): string | undefined {
  if (!data || !data.email_addresses || !Array.isArray(data.email_addresses)) {
    return undefined;
  }
  
  // Find primary email
  const primaryEmail = data.email_addresses.find((email: any) => email.id === data.primary_email_address_id);
  
  if (primaryEmail) {
    return primaryEmail.email_address;
  }
  
  // Fall back to first email
  if (data.email_addresses.length > 0) {
    return data.email_addresses[0].email_address;
  }
  
  return undefined;
}

/**
 * Verify Clerk webhook signature
 * 
 * @param payload Raw webhook payload
 * @param signature Signature from headers
 * @param secret Webhook secret
 * @returns Whether signature is valid
 */
function verifyClerkSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // This is a simplified implementation - actual implementation would use crypto
    // and follow Clerk's verification method
    
    // In a production environment, use Clerk's recommended verification method:
    // https://clerk.dev/docs/integration/webhooks
    
    return true; // Mock implementation - replace with actual verification
  } catch (error) {
    logger.error('Error verifying Clerk signature', { error });
    return false;
  }
}
