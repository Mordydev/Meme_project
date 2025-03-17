/**
 * Clerk Webhook Handler
 * 
 * Processes webhook events from Clerk to synchronize user data
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../../config/environment';
import { logger } from '../../lib/logger';
import { ClerkWebhookHeaders, ClerkWebhookType } from './types';
import { userRepository } from '../../repositories';
import { profileRepository } from '../../repositories';
import { auditLogger } from '../audit/audit-logger';

/**
 * Verify Clerk webhook signature
 */
function verifyClerkWebhookSignature(
  payload: string,
  headers: ClerkWebhookHeaders
): boolean {
  try {
    const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      logger.error('CLERK_WEBHOOK_SECRET is not configured');
      return false;
    }
    
    const signatureHeader = headers['svix-signature'];
    
    // Check if the signature header exists
    if (!signatureHeader) {
      logger.error('No svix-signature header provided');
      return false;
    }
    
    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    
    // Check if required headers exist
    if (!svixId || !svixTimestamp) {
      logger.error('Missing required Svix headers');
      return false;
    }
    
    // Create message to verify
    const message = `${svixId}.${svixTimestamp}.${payload}`;
    
    // Parse signature list
    const signatures = signatureHeader.split(' ').map(sig => {
      const [version, signature] = sig.split(',');
      return { version, signature };
    });
    
    // Find latest v1 signature
    const v1Signature = signatures
      .filter(sig => sig.version === 'v1')
      .pop();
    
    if (!v1Signature) {
      logger.error('No valid v1 signature found');
      return false;
    }
    
    // Compute expected signature
    const hmac = createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(message);
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures using timing-safe comparison
    const sigBuffer = Buffer.from(v1Signature.signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    
    return sigBuffer.length === expectedBuffer.length &&
      timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    logger.error('Error verifying webhook signature', { error });
    return false;
  }
}

/**
 * Process user creation webhook
 */
async function processUserCreated(data: any) {
  try {
    // Extract user data from webhook payload
    const {
      id: externalId,
      email_addresses,
      first_name,
      last_name,
      username,
      image_url,
      created_at,
    } = data;
    
    // Get primary email
    const primaryEmail = email_addresses.find((email: any) => email.id === data.primary_email_address_id);
    if (!primaryEmail) {
      logger.error('No primary email found for user', { externalId });
      return false;
    }
    
    // Check if user already exists in our system
    const existingUser = await userRepository.findByExternalId(externalId);
    if (existingUser) {
      logger.info('User already exists in database', { externalId, userId: existingUser.id });
      return true;
    }
    
    // Format names
    const displayName = `${first_name || ''} ${last_name || ''}`.trim() || username || 'User';
    
    // Create user in our database
    const newUser = await userRepository.createUser({
      external_id: externalId,
      email: primaryEmail.email_address,
      display_name: displayName,
      auth_provider: 'clerk',
      created_at: new Date(created_at),
      last_login: new Date(),
      status: 'active'
    });
    
    logger.info('Created new user from Clerk webhook', { externalId, userId: newUser.id });
    
    // Create initial profile
    await profileRepository.createProfile({
      user_id: newUser.id,
      level: 1,
      avatar_url: image_url || null,
      username: username || null,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Log the creation event
    auditLogger.logUserCreation(newUser.id, externalId, 'clerk');
    
    return true;
  } catch (error) {
    logger.error('Error processing user creation webhook', { error, data });
    return false;
  }
}

/**
 * Process user update webhook
 */
async function processUserUpdated(data: any) {
  try {
    // Extract user data from webhook payload
    const {
      id: externalId,
      email_addresses,
      first_name,
      last_name,
      username,
      image_url,
    } = data;
    
    // Get primary email
    const primaryEmail = email_addresses.find((email: any) => email.id === data.primary_email_address_id);
    if (!primaryEmail) {
      logger.error('No primary email found for user update', { externalId });
      return false;
    }
    
    // Get user from our database
    const user = await userRepository.findByExternalId(externalId);
    if (!user) {
      // User doesn't exist, create them
      return await processUserCreated(data);
    }
    
    // Format names
    const displayName = `${first_name || ''} ${last_name || ''}`.trim() || username || user.display_name;
    
    // Update user in our database
    const updatedUser = await userRepository.updateUser(user.id, {
      email: primaryEmail.email_address,
      display_name: displayName,
    });
    
    // Update profile
    const profile = await profileRepository.findByUserId(user.id);
    if (profile) {
      await profileRepository.updateProfile(user.id, {
        username: username || profile.username,
        avatar_url: image_url || profile.avatar_url,
        updated_at: new Date()
      });
    } else {
      // Create profile if it doesn't exist
      await profileRepository.createProfile({
        user_id: user.id,
        level: 1,
        avatar_url: image_url || null,
        username: username || null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Log the update event
    auditLogger.logUserUpdate(user.id, externalId, 'clerk');
    
    return true;
  } catch (error) {
    logger.error('Error processing user update webhook', { error, data });
    return false;
  }
}

/**
 * Process user deletion webhook
 */
async function processUserDeleted(data: any) {
  try {
    const { id: externalId } = data;
    
    // Get user from our database
    const user = await userRepository.findByExternalId(externalId);
    if (!user) {
      logger.warn('Attempted to delete non-existent user', { externalId });
      return true; // Success since there's nothing to delete
    }
    
    // We're using soft delete - mark as deleted rather than removing
    await userRepository.updateUser(user.id, {
      status: 'deleted'
    });
    
    // Log the deletion event
    auditLogger.logUserDeletion(user.id, externalId, 'clerk');
    
    return true;
  } catch (error) {
    logger.error('Error processing user deletion webhook', { error, data });
    return false;
  }
}

/**
 * Process session created webhook
 */
async function processSessionCreated(data: any) {
  try {
    const { user_id: externalId } = data;
    
    // Get user from our database
    const user = await userRepository.findByExternalId(externalId);
    if (!user) {
      logger.warn('Session created for unknown user', { externalId });
      return false;
    }
    
    // Update last login time
    await userRepository.updateLastLogin(user.id);
    
    // Log the session creation
    auditLogger.logUserLogin(user.id, externalId, 'clerk');
    
    return true;
  } catch (error) {
    logger.error('Error processing session created webhook', { error, data });
    return false;
  }
}

/**
 * Main webhook handler
 */
export async function handleClerkWebhook(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(request.body);
    
    // Verify webhook signature
    const isValidSignature = verifyClerkWebhookSignature(
      rawBody, 
      request.headers as unknown as ClerkWebhookHeaders
    );
    
    if (!isValidSignature) {
      logger.warn('Invalid webhook signature');
      return reply.code(401).send({ error: 'Invalid signature' });
    }
    
    // Process webhook based on event type
    const body = request.body as any;
    const { type, data } = body;
    
    let success = false;
    
    switch (type) {
      case ClerkWebhookType.USER_CREATED:
        success = await processUserCreated(data);
        break;
        
      case ClerkWebhookType.USER_UPDATED:
        success = await processUserUpdated(data);
        break;
        
      case ClerkWebhookType.USER_DELETED:
        success = await processUserDeleted(data);
        break;
        
      case ClerkWebhookType.SESSION_CREATED:
        success = await processSessionCreated(data);
        break;
        
      default:
        // For other event types, log but don't process
        logger.info('Received unhandled webhook event', { type });
        success = true;
        break;
    }
    
    if (success) {
      return reply.code(200).send({ success: true });
    } else {
      return reply.code(500).send({ error: 'Failed to process webhook' });
    }
  } catch (error) {
    logger.error('Error handling Clerk webhook', { error });
    return reply.code(500).send({ error: 'Internal server error' });
  }
}
