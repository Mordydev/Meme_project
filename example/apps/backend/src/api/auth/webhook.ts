import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/fastify/types'
import { logger } from '../../lib/logger'
import { EventEmitter, EventType } from '../../lib/events'

/**
 * Clerk webhook handler for authentication events
 */
export default async function (fastify: FastifyInstance) {
  const eventEmitter = fastify.diContainer.resolve<EventEmitter>('eventEmitter')

  /**
   * Webhook endpoint for Clerk events
   */
  fastify.post(
    '/api/auth/webhook',
    {
      schema: {
        description: 'Webhook endpoint for Clerk authentication events',
        tags: ['auth'],
        headers: {
          type: 'object',
          properties: {
            'svix-id': { type: 'string' },
            'svix-timestamp': { type: 'string' },
            'svix-signature': { type: 'string' }
          },
          required: ['svix-id', 'svix-timestamp', 'svix-signature']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Get the webhook secret from environment variables
      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

      if (!webhookSecret) {
        logger.error('Missing CLERK_WEBHOOK_SECRET environment variable')
        return reply.code(500).send({
          success: false,
          error: 'Server misconfiguration'
        })
      }

      // Get the headers
      const svixId = request.headers['svix-id'] as string
      const svixTimestamp = request.headers['svix-timestamp'] as string
      const svixSignature = request.headers['svix-signature'] as string

      if (!svixId || !svixTimestamp || !svixSignature) {
        logger.warn('Missing Svix headers')
        return reply.code(400).send({
          success: false,
          error: 'Missing headers'
        })
      }

      // Get the body
      let payload: any
      try {
        payload = await request.body
      } catch (error) {
        logger.error({ err: error }, 'Error parsing webhook body')
        return reply.code(400).send({
          success: false,
          error: 'Invalid payload'
        })
      }

      // Create a new Svix webhook instance with the webhook secret
      const wh = new Webhook(webhookSecret)

      let evt: WebhookEvent

      try {
        // Verify the webhook signature
        evt = wh.verify(
          JSON.stringify(payload),
          {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature
          }
        ) as WebhookEvent
      } catch (error) {
        logger.error({ err: error }, 'Error verifying webhook')
        return reply.code(400).send({
          success: false,
          error: 'Invalid signature'
        })
      }

      // Successfully verified webhook
      const { id, object, type, data } = evt

      logger.info({ eventId: id, eventType: type }, 'Received webhook event')

      // Handle the webhook event based on its type
      switch (type) {
        case 'user.created':
          // New user created in Clerk
          try {
            // Initialize user profile in our database
            const success = await fastify.handleUserRegistration(data.id)
            logger.info({ userId: data.id, success }, 'Processed user.created webhook')
          } catch (error) {
            logger.error({ err: error, userId: data.id }, 'Error handling user.created webhook')
          }
          break

        case 'user.updated':
          // User updated in Clerk
          try {
            // Emit user updated event
            await eventEmitter.emit(EventType.USER_UPDATED, {
              userId: data.id,
              updatedFields: ['clerkData'], // Generic update from Clerk
              timestamp: new Date().toISOString()
            })
            logger.info({ userId: data.id }, 'Processed user.updated webhook')
          } catch (error) {
            logger.error({ err: error, userId: data.id }, 'Error handling user.updated webhook')
          }
          break

        case 'user.deleted':
          // User deleted in Clerk - handle accordingly
          // Note: You might want to handle this differently based on your business requirements
          logger.info({ userId: data.id }, 'Received user.deleted webhook')
          break

        case 'session.created':
          // New sign-in - could record for analytics
          logger.info({ sessionId: data.id, userId: data.user_id }, 'New sign-in session')
          break

        case 'session.removed':
          // Sign-out - could record for analytics
          logger.info({ sessionId: data.id, userId: data.user_id }, 'Sign-out session')
          break

        default:
          // Log unknown event types
          logger.info({ eventId: id, eventType: type }, 'Unhandled webhook event type')
      }

      // Return a success response
      return { success: true }
    }
  )
}
