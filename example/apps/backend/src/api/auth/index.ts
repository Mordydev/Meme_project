import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import webhookRoutes from './webhook'
import { authenticate, requireRole } from '../../middleware/auth'

/**
 * Authentication-related routes
 */
const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register webhook route
  await fastify.register(webhookRoutes)

  /**
   * Get current user profile info from the auth provider
   */
  fastify.get(
    '/',
    {
      schema: {
        description: 'Get the current authenticated user info',
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  username: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  imageUrl: { type: 'string' },
                  publicMetadata: {
                    type: 'object',
                    additionalProperties: true
                  },
                  roles: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      try {
        // Get user from Clerk
        const user = await fastify.clerk.users.getUser(request.userId)
        
        // Extract roles from public metadata
        const roles = (user.publicMetadata?.roles || []) as string[]
        
        return {
          data: {
            id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            publicMetadata: user.publicMetadata,
            roles
          },
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString()
          }
        }
      } catch (error) {
        request.log.error(error, 'Failed to get user info')
        throw error
      }
    }
  )

  /**
   * Get user roles
   */
  fastify.get(
    '/roles',
    {
      schema: {
        description: 'Get available roles that can be assigned',
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      },
      preHandler: [authenticate, requireRole(['admin'])]
    },
    async (request, reply) => {
      // Hardcoded role definitions
      // In a real application, this would come from a database
      const roles = [
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full system access and management'
        },
        {
          id: 'moderator',
          name: 'Moderator',
          description: 'Content and user moderation capabilities'
        },
        {
          id: 'creator',
          name: 'Creator',
          description: 'Advanced creation and battle management features'
        },
        {
          id: 'user',
          name: 'User',
          description: 'Standard platform access and features'
        }
      ]
      
      return {
        data: roles,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString()
        }
      }
    }
  )

  /**
   * Update user roles (admin only)
   */
  fastify.patch(
    '/users/:userId/roles',
    {
      schema: {
        description: 'Update user roles',
        tags: ['auth'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          },
          required: ['userId']
        },
        body: {
          type: 'object',
          properties: {
            roles: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['roles']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  roles: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  updated: { type: 'boolean' }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      },
      preHandler: [authenticate, requireRole(['admin'])]
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string }
      const { roles } = request.body as { roles: string[] }
      
      try {
        // Get user from Clerk
        const user = await fastify.clerk.users.getUser(userId)
        
        // Update the public metadata with roles
        await fastify.clerk.users.updateUser(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            roles
          }
        })
        
        return {
          data: {
            userId,
            roles,
            updated: true
          },
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString()
          }
        }
      } catch (error) {
        request.log.error({ err: error, userId, roles }, 'Failed to update user roles')
        throw error
      }
    }
  )
}

export default authRoutes
