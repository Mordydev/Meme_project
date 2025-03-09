import { FastifyInstance } from 'fastify';
import { authenticate } from '../../../middleware/auth';
import { ProfileService } from '../../../services/profile-service';

/**
 * User profile routes
 */
export default async function (fastify: FastifyInstance) {
  const profileService = new ProfileService(fastify);

  /**
   * Get current user profile with achievements
   */
  fastify.get(
    '/api/users/profile',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  profile: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      userId: { type: 'string' },
                      username: { type: 'string' },
                      displayName: { type: 'string' },
                      bio: { type: 'string' },
                      imageUrl: { type: 'string' },
                      stats: {
                        type: 'object',
                        properties: {
                          battleCount: { type: 'number' },
                          battleWins: { type: 'number' },
                          contentCount: { type: 'number' },
                          followerCount: { type: 'number' },
                          followingCount: { type: 'number' },
                          totalPoints: { type: 'number' },
                          level: { type: 'number' },
                        },
                      },
                      preferences: {
                        type: 'object',
                        properties: {
                          notifications: { type: 'boolean' },
                          privacy: { type: 'string' },
                          theme: { type: 'string' },
                        },
                      },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' },
                    },
                  },
                  achievements: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        userId: { type: 'string' },
                        achievementId: { type: 'string' },
                        progress: { type: 'number' },
                        unlockedAt: { type: ['string', 'null'] },
                        achievement: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string' },
                            tier: { type: 'string' },
                            icon: { type: 'string' },
                            pointsReward: { type: 'number' },
                            criteria: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      // Check if the user profile exists, if not initialize it
      let userProfile = await profileService.getUserProfile(request.userId);
      
      if (!userProfile) {
        // Get user data from Clerk
        const user = await fastify.clerk.users.getUser(request.userId);
        
        // Initialize profile with Clerk data
        await profileService.initializeUserProfile(request.userId, {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          imageUrl: user.imageUrl,
        });
        
        // Get the newly created profile
        userProfile = await profileService.getUserProfile(request.userId);
      }
      
      return {
        data: userProfile,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get user profile by username
   */
  fastify.get(
    '/api/users/profile/:username',
    {
      schema: {
        params: {
          type: 'object',
          required: ['username'],
          properties: {
            username: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  profile: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      userId: { type: 'string' },
                      username: { type: 'string' },
                      displayName: { type: 'string' },
                      bio: { type: 'string' },
                      imageUrl: { type: 'string' },
                      stats: {
                        type: 'object',
                        properties: {
                          battleCount: { type: 'number' },
                          battleWins: { type: 'number' },
                          contentCount: { type: 'number' },
                          followerCount: { type: 'number' },
                          followingCount: { type: 'number' },
                          totalPoints: { type: 'number' },
                          level: { type: 'number' },
                        },
                      },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' },
                    },
                  },
                  achievements: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        userId: { type: 'string' },
                        achievementId: { type: 'string' },
                        progress: { type: 'number' },
                        unlockedAt: { type: ['string', 'null'] },
                        achievement: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string' },
                            tier: { type: 'string' },
                            icon: { type: 'string' },
                            pointsReward: { type: 'number' },
                            criteria: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                  isCurrentUser: { type: 'boolean' },
                  isFollowing: { type: 'boolean' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { username } = request.params as { username: string };
      
      const userProfile = await profileService.getUserProfileByUsername(username);
      
      if (!userProfile) {
        return reply.code(404).send({
          error: {
            code: 'not_found',
            message: 'User profile not found',
          },
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      // Check if this is the current user
      const isCurrentUser = request.userId && request.userId === userProfile.profile.userId;
      
      // Check if the current user is following this user
      let isFollowing = false;
      if (request.userId && request.userId !== userProfile.profile.userId) {
        isFollowing = await profileService.isFollowing(request.userId, userProfile.profile.userId);
      }
      
      return {
        data: {
          ...userProfile,
          isCurrentUser,
          isFollowing,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Update user profile
   */
  fastify.patch(
    '/api/users/profile',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            displayName: { type: 'string' },
            bio: { type: 'string' },
            username: { type: 'string' },
            preferences: {
              type: 'object',
              properties: {
                notifications: { type: 'boolean' },
                privacy: { type: 'string', enum: ['public', 'private', 'followers'] },
                theme: { type: 'string', enum: ['default', 'dark', 'light'] },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  profile: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      userId: { type: 'string' },
                      username: { type: 'string' },
                      displayName: { type: 'string' },
                      bio: { type: 'string' },
                      imageUrl: { type: 'string' },
                      stats: {
                        type: 'object',
                        properties: {
                          battleCount: { type: 'number' },
                          battleWins: { type: 'number' },
                          contentCount: { type: 'number' },
                          followerCount: { type: 'number' },
                          followingCount: { type: 'number' },
                          totalPoints: { type: 'number' },
                          level: { type: 'number' },
                        },
                      },
                      preferences: {
                        type: 'object',
                        properties: {
                          notifications: { type: 'boolean' },
                          privacy: { type: 'string' },
                          theme: { type: 'string' },
                        },
                      },
                      updatedAt: { type: 'string' },
                    },
                  },
                  updated: { type: 'boolean' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const updates = request.body as any;
      
      const updatedProfile = await profileService.updateUserProfile(request.userId, updates);
      
      // Also update Clerk user data where applicable
      try {
        // Only update what's relevant to Clerk
        const clerkUpdates: any = {};
        
        if (updates.displayName) {
          const nameParts = updates.displayName.split(' ');
          clerkUpdates.firstName = nameParts[0];
          clerkUpdates.lastName = nameParts.slice(1).join(' ');
        }
        
        if (updates.username) {
          clerkUpdates.username = updates.username;
        }
        
        // Update Clerk if we have any updates
        if (Object.keys(clerkUpdates).length > 0) {
          await fastify.clerk.users.updateUser(request.userId, clerkUpdates);
        }
      } catch (error) {
        // Log error but don't fail the request
        fastify.log.error(error, 'Failed to update Clerk user data');
      }
      
      return {
        data: {
          profile: updatedProfile,
          updated: true,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Follow a user
   */
  fastify.post(
    '/api/users/:userId/follow',
    {
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  following: { type: 'boolean' },
                  followerId: { type: 'string' },
                  followedId: { type: 'string' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { userId: followedId } = request.params as { userId: string };
      
      // Try to follow the user
      await profileService.followUser(request.userId, followedId);
      
      return {
        data: {
          following: true,
          followerId: request.userId,
          followedId,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Unfollow a user
   */
  fastify.delete(
    '/api/users/:userId/follow',
    {
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  following: { type: 'boolean' },
                  followerId: { type: 'string' },
                  followedId: { type: 'string' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { userId: followedId } = request.params as { userId: string };
      
      // Try to unfollow the user
      await profileService.unfollowUser(request.userId, followedId);
      
      return {
        data: {
          following: false,
          followerId: request.userId,
          followedId,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get followers of a user
   */
  fastify.get(
    '/api/users/:userId/followers',
    {
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            offset: { type: 'number' },
          },
        },
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
                    userId: { type: 'string' },
                    username: { type: 'string' },
                    displayName: { type: 'string' },
                    imageUrl: { type: 'string' },
                    isFollowing: { type: 'boolean' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const { limit = 20, offset = 0 } = request.query as { limit?: number; offset?: number };
      
      const followers = await profileService.getFollowers(userId, limit, offset);
      
      // Check if the current user is following each of these users
      let followingStatus = {};
      if (request.userId) {
        // Build a map of userId -> following status
        await Promise.all(
          followers.map(async (follower) => {
            const isFollowing = await profileService.isFollowing(request.userId, follower.userId);
            followingStatus = { ...followingStatus, [follower.userId]: isFollowing };
          })
        );
      }
      
      return {
        data: followers.map(follower => ({
          id: follower.id,
          userId: follower.userId,
          username: follower.username,
          displayName: follower.displayName,
          imageUrl: follower.imageUrl,
          isFollowing: request.userId ? followingStatus[follower.userId] : false,
        })),
        meta: {
          limit,
          offset,
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get users followed by a user
   */
  fastify.get(
    '/api/users/:userId/following',
    {
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            offset: { type: 'number' },
          },
        },
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
                    userId: { type: 'string' },
                    username: { type: 'string' },
                    displayName: { type: 'string' },
                    imageUrl: { type: 'string' },
                    isFollowing: { type: 'boolean' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const { limit = 20, offset = 0 } = request.query as { limit?: number; offset?: number };
      
      const following = await profileService.getFollowing(userId, limit, offset);
      
      // If this is the current user viewing their following, they are following all users by definition
      const isCurrentUser = request.userId === userId;
      
      // Check if the current user is following each of these users
      let followingStatus = {};
      if (request.userId && !isCurrentUser) {
        // Build a map of userId -> following status
        await Promise.all(
          following.map(async (followedUser) => {
            const isFollowing = await profileService.isFollowing(request.userId, followedUser.userId);
            followingStatus = { ...followingStatus, [followedUser.userId]: isFollowing };
          })
        );
      }
      
      return {
        data: following.map(followedUser => ({
          id: followedUser.id,
          userId: followedUser.userId,
          username: followedUser.username,
          displayName: followedUser.displayName,
          imageUrl: followedUser.imageUrl,
          isFollowing: isCurrentUser ? true : (request.userId ? followingStatus[followedUser.userId] : false),
        })),
        meta: {
          limit,
          offset,
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );
}
