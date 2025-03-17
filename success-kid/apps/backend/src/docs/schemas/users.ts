/**
 * User Schema Definitions
 * 
 * Defines user-related schemas for OpenAPI documentation.
 */

const userSchemas = {
  User: {
    type: 'object',
    required: ['id', 'email', 'displayName', 'createdAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique user identifier'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      displayName: {
        type: 'string',
        description: 'User display name'
      },
      profileImageUrl: {
        type: 'string',
        format: 'uri',
        description: 'URL to user profile image'
      },
      authProvider: {
        type: 'string',
        enum: ['email', 'google', 'twitter', 'wallet'],
        description: 'Authentication provider used'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Account creation timestamp'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Account last update timestamp'
      },
      lastLogin: {
        type: 'string',
        format: 'date-time',
        description: 'Last login timestamp'
      },
      status: {
        type: 'string',
        enum: ['active', 'suspended', 'deleted'],
        description: 'User account status'
      }
    }
  },
  
  UserProfile: {
    type: 'object',
    required: ['userId', 'bio', 'level'],
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID that this profile belongs to'
      },
      bio: {
        type: 'string',
        description: 'User biography or description'
      },
      avatarUrl: {
        type: 'string',
        format: 'uri',
        description: 'URL to user avatar image'
      },
      level: {
        type: 'integer',
        minimum: 1,
        description: 'User engagement level'
      },
      title: {
        type: 'string',
        description: 'Special title earned by user'
      },
      socialLinks: {
        type: 'object',
        additionalProperties: {
          type: 'string',
          format: 'uri'
        },
        description: 'User social media links'
      },
      preferences: {
        type: 'object',
        additionalProperties: true,
        description: 'User preferences settings'
      },
      joinedAt: {
        type: 'string',
        format: 'date-time',
        description: 'When the user joined'
      },
      stats: {
        type: 'object',
        properties: {
          totalPoints: {
            type: 'integer',
            description: 'Total points earned'
          },
          totalPosts: {
            type: 'integer',
            description: 'Total posts created'
          },
          totalComments: {
            type: 'integer',
            description: 'Total comments made'
          },
          achievementCount: {
            type: 'integer',
            description: 'Number of achievements earned'
          }
        }
      }
    }
  },
  
  UserWithProfile: {
    allOf: [
      { $ref: '#/components/schemas/User' },
      {
        type: 'object',
        properties: {
          profile: {
            $ref: '#/components/schemas/UserProfile'
          }
        }
      }
    ]
  },
  
  UserCreateRequest: {
    type: 'object',
    required: ['email', 'password', 'displayName'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      password: {
        type: 'string',
        minLength: 8,
        description: 'User password (min 8 characters)'
      },
      displayName: {
        type: 'string',
        minLength: 3,
        description: 'User display name (min 3 characters)'
      },
      profileImage: {
        type: 'string',
        format: 'binary',
        description: 'User profile image file'
      }
    }
  },
  
  UserUpdateRequest: {
    type: 'object',
    properties: {
      displayName: {
        type: 'string',
        minLength: 3,
        description: 'User display name (min 3 characters)'
      },
      bio: {
        type: 'string',
        maxLength: 500,
        description: 'User biography (max 500 characters)'
      },
      profileImage: {
        type: 'string',
        format: 'binary',
        description: 'User profile image file'
      },
      socialLinks: {
        type: 'object',
        additionalProperties: {
          type: 'string',
          format: 'uri'
        },
        description: 'User social media links'
      }
    }
  }
};

export default userSchemas;
