import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { createClerkClient } from '@clerk/fastify'
import { logger } from '../lib/logger'

/**
 * Plugin to register Clerk authentication with Fastify
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
    
    // Log successful initialization
    logger.info('Clerk authentication initialized')
  } catch (error) {
    logger.error(error, 'Failed to initialize Clerk authentication')
    throw error
  }
}

export default fastifyPlugin(authPlugin, {
  name: 'auth',
  dependencies: [],
})

// Extend FastifyInstance with clerk client
declare module 'fastify' {
  interface FastifyInstance {
    clerk: ReturnType<typeof createClerkClient>
  }
}
