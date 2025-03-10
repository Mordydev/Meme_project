import { FastifyInstance } from 'fastify';
import { auth } from '@clerk/fastify';
import { SocialService } from '../../services/social-service';

/**
 * Follow relationship API endpoints
 */
export default async function followRoutes(fastify: FastifyInstance): Promise<void> {
  const socialService = fastify.diContainer.resolve(SocialService);
  
  /**
   * Follow a user
   */
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['followedId'],
        properties: {
          followedId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            followerId: { type: 'string' },
            followedId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { followedId } = request.body as { followedId: string };
    
    const follow = await socialService.followUser(userId, followedId);
    
    return follow;
  });
  
  /**
   * Unfollow a user
   */
  fastify.delete('/:followedId', {
    schema: {
      params: {
        type: 'object',
        required: ['followedId'],
        properties: {
          followedId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { followedId } = request.params as { followedId: string };
    
    await socialService.unfollowUser(userId, followedId);
    
    return { success: true };
  });
  
  /**
   * Get followers of a user
   */
  fastify.get('/followers/:userId', {
    schema: {
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            followers: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  followerId: { type: 'string' },
                  followedId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  follower: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      displayName: { type: 'string' },
                      imageUrl: { type: ['string', 'null'] }
                    }
                  }
                }
              }
            },
            total: { type: 'integer' }
          }
        }
      }
    }
  }, async (request) => {
    const { userId } = request.params as { userId: string };
    const { limit, offset } = request.query as { limit: number; offset: number };
    
    const result = await socialService.getFollowers(userId, { limit, offset });
    
    return result;
  });
  
  /**
   * Get users that a user is following
   */
  fastify.get('/following/:userId', {
    schema: {
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            following: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  followerId: { type: 'string' },
                  followedId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  followed: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      displayName: { type: 'string' },
                      imageUrl: { type: ['string', 'null'] }
                    }
                  }
                }
              }
            },
            total: { type: 'integer' }
          }
        }
      }
    }
  }, async (request) => {
    const { userId } = request.params as { userId: string };
    const { limit, offset } = request.query as { limit: number; offset: number };
    
    const result = await socialService.getFollowing(userId, { limit, offset });
    
    return result;
  });
  
  /**
   * Get follow counts for a user
   */
  fastify.get('/counts/:userId', {
    schema: {
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            followers: { type: 'integer' },
            following: { type: 'integer' }
          }
        }
      }
    }
  }, async (request) => {
    const { userId } = request.params as { userId: string };
    
    const counts = await socialService.getFollowCounts(userId);
    
    return counts;
  });
  
  /**
   * Check if user follows another user
   */
  fastify.get('/status/:followedId', {
    schema: {
      params: {
        type: 'object',
        required: ['followedId'],
        properties: {
          followedId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            isFollowing: { type: 'boolean' }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { followedId } = request.params as { followedId: string };
    
    const isFollowing = await socialService.checkFollowStatus(userId, followedId);
    
    return { isFollowing };
  });
  
  /**
   * Get comprehensive relationship status between users
   */
  fastify.get('/relationship/:otherUserId', {
    schema: {
      params: {
        type: 'object',
        required: ['otherUserId'],
        properties: {
          otherUserId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            isFollowing: { type: 'boolean' },
            isFollowedBy: { type: 'boolean' },
            mutualFollow: { type: 'boolean' }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { otherUserId } = request.params as { otherUserId: string };
    
    const relationship = await socialService.getUserRelationship(userId, otherUserId);
    
    return relationship;
  });
  
  /**
   * Get suggested users to follow
   */
  fastify.get('/suggestions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  displayName: { type: 'string' },
                  imageUrl: { type: ['string', 'null'] },
                  commonConnections: { type: ['integer', 'null'] },
                  followerCount: { type: ['integer', 'null'] }
                }
              }
            }
          }
        }
      }
    },
    preHandler: auth(),
  }, async (request, reply) => {
    const { userId } = request.auth;
    
    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }
    
    const { limit } = request.query as { limit?: number };
    
    const suggestions = await socialService.getSuggestedFollows(userId, limit);
    
    return { suggestions };
  });
}
