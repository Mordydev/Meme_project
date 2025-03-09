import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { createClerkClient } from '@clerk/fastify'
import { logger } from '../lib/logger'
import { EventEmitter, EventType } from '../lib/events'
import { ProfileService } from '../services/profile-service'

/**
 * Plugin to register Clerk authentication with Fastify
 * Handles webhook events and synchronizes user data with our database
 */
const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Skip initialization if required env vars are missing
  if (!process.env.CLERK_SECRET_KEY) {
    logger.warn('CLERK_SECRET_KEY not set, auth features will be unavailable')
    return
  }
  
  try {
    // Create Clerk client and register with Fastify
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    })
    
    // Make clerk client available through fastify.clerk
    fastify.decorate('clerk', clerk)
    
    // Register a decorator method to handle user registration
    fastify.decorate('handleUserRegistration', async (userId: string) => {
      try {
        // Get user data from Clerk
        const user = await clerk.users.getUser(userId)
        
        // Get profile service
        const profileService = fastify.diContainer.resolve<ProfileService>('profileService')
        
        // Initialize user profile with Clerk data
        await profileService.initializeUserProfile(userId, {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          imageUrl: user.imageUrl,
        })
        
        // Emit user registered event
        const eventEmitter = fastify.diContainer.resolve<EventEmitter>('eventEmitter')
        await eventEmitter.emit(EventType.USER_REGISTERED, {
          userId,
          username: user.username || '',
          timestamp: new Date().toISOString()
        })
        
        return true
      } catch (error) {
        logger.error({ err: error, userId }, 'Failed to handle user registration')
        return false
      }
    })
    
    // Log successful initialization
    logger.info('Clerk authentication initialized')
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Clerk authentication')
    throw error
  }
}

export default fastifyPlugin(authPlugin, {
  name: 'auth',
  dependencies: ['supabase', 'redis'],
})

// Extend FastifyInstance with clerk client
declare module 'fastify' {
  interface FastifyInstance {
    clerk: ReturnType<typeof createClerkClient>
    handleUserRegistration: (userId: string) => Promise<boolean>
  }
}
