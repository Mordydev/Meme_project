/**
 * Schemas and OpenAPI definitions for the Achievements API module
 */

// --- Schemas for Route Validation ---

export const getAchievementsSchema = {
  querystring: {
    type: 'object',
    properties: {
      category: { type: 'string' }, // Consider enum
      difficulty: { type: 'string' }, // Consider enum
      is_public: { type: 'boolean' },
      search: { type: 'string' }
    }
  }
};

export const getAchievementByIdSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const getUserAchievementsSchema = {
  // No specific schema needed for GET /user, relies on authentication
};

export const getUserAchievementsByIdSchema = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' }
    }
  }
};

export const getAchievementProgressSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const unlockAchievementSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      }
    }
  }
};

// --- OpenAPI Definitions (Extracted from comments) ---

const achievementProperties = {
  id: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string' },
  image_url: { type: 'string' },
  points_reward: { type: 'integer' },
  difficulty: { type: 'string' }, // Consider enum
  category: { type: 'string' }, // Consider enum
  is_public: { type: 'boolean' }
};

const metaProperties = {
  timestamp: { type: 'string', format: 'date-time' }
};

export const openApiGetAchievements = {
  summary: 'Get all achievements',
  description: 'Retrieves all achievements with optional filtering',
  tags: ['Achievements'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'query', name: 'category', schema: { type: 'string', enum: ['content', 'community', 'points', 'profile', 'wallet', 'streak', 'referral', 'special', 'hidden'] }, description: 'Filter by achievement category' },
    { in: 'query', name: 'difficulty', schema: { type: 'string', enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] }, description: 'Filter by achievement difficulty' },
    { in: 'query', name: 'is_public', schema: { type: 'boolean' }, description: 'Filter public/hidden achievements' },
    { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search term for achievement name/description' }
  ],
  responses: {
    200: {
      description: 'List of achievements',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: achievementProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetAchievementById = {
  summary: 'Get achievement by ID',
  description: 'Retrieves a specific achievement by ID',
  tags: ['Achievements'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Achievement ID' }
  ],
  responses: {
    200: {
      description: 'Achievement details',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: achievementProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    404: { description: 'Achievement not found' },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetUserAchievements = {
  summary: 'Get current user\'s achievements',
  description: 'Retrieves achievements for the authenticated user',
  tags: ['Achievements'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User\'s achievements',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: { achievement: { type: 'object', properties: achievementProperties }, unlocked_at: { type: 'string', format: 'date-time', nullable: true }, progress: { type: 'object', nullable: true } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetUserAchievementsById = {
  summary: 'Get user\'s achievements by user ID',
  description: 'Retrieves achievements for a specific user',
  tags: ['Achievements'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'userId', required: true, schema: { type: 'string' }, description: 'User ID' }
  ],
  responses: {
    200: {
      description: 'User\'s achievements',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: { achievement: { type: 'object', properties: achievementProperties }, unlocked_at: { type: 'string', format: 'date-time', nullable: true } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetAchievementProgress = {
  summary: 'Get achievement progress',
  description: 'Retrieves current user\'s progress for a specific achievement',
  tags: ['Achievements'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Achievement ID' }
  ],
  responses: {
    200: {
      description: 'Achievement progress',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { currentValue: { type: 'number' }, targetValue: { type: 'number' }, percentComplete: { type: 'number' }, isComplete: { type: 'boolean' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Achievement not found' }
  }
};

export const openApiUnlockAchievement = {
  summary: 'Manually unlock an achievement (admin only)',
  description: 'Manually awards an achievement to a user',
  tags: ['Achievements'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Achievement ID' }
  ],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['userId'], properties: { userId: { type: 'string', description: 'User ID to unlock achievement for' } } } } } } }
  },
  responses: {
    200: {
      description: 'Achievement unlocked successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, achievement: { type: 'object', properties: achievementProperties }, unlocked_at: { type: 'string', format: 'date-time' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Achievement not found' }
  }
};

// --- Schemas from badge-routes.ts ---

export const getBadgesSchema = {
  querystring: {
    type: 'object',
    properties: {
      category: { type: 'string' }, // Consider enum
      tier: { type: 'string' }, // Consider enum
      search: { type: 'string' }
    }
  }
};

export const getBadgeByIdSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const getUserBadgesSchema = {
  // No specific schema needed for GET /user, relies on authentication
};

export const getUserBadgesByIdSchema = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' }
    }
  }
};

export const getEquippedBadgesSchema = {
  // No specific schema needed for GET /user/equipped, relies on authentication
};

export const getRecommendedBadgesSchema = {
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'number', default: 3 }
    }
  }
};

export const equipBadgeSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['equipped'],
        properties: {
          equipped: { type: 'boolean' },
          slot: { type: 'number', nullable: true } // Allow null for slot
        }
      }
    }
  }
};

export const createBadgeSchema = {
  // Admin only - schema for request body
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['name', 'description', 'image_url', 'category', 'tier'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          image_url: { type: 'string' },
          category: { type: 'string' }, // Consider enum
          tier: { type: 'string' }, // Consider enum
          points_value: { type: 'integer', default: 0 },
          display_priority: { type: 'integer', default: 0 }
        }
      }
    }
  }
};

export const updateBadgeSchema = {
  // Admin only - schema for request body and params
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          image_url: { type: 'string' },
          category: { type: 'string' }, // Consider enum
          tier: { type: 'string' }, // Consider enum
          points_value: { type: 'integer' },
          display_priority: { type: 'integer' }
        }
      }
    }
  }
};

export const deleteBadgeSchema = {
  // Admin only - schema for params
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const awardBadgeSchema = {
  // Admin only - schema for request body
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['userId', 'badgeId', 'source'],
        properties: {
          userId: { type: 'string' },
          badgeId: { type: 'string' },
          source: { type: 'string' },
          reason: { type: 'string', nullable: true } // Allow null for reason
        }
      }
    }
  }
};


// --- OpenAPI Definitions for Badges ---

const badgeProperties = {
  id: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string' },
  image_url: { type: 'string' },
  category: { type: 'string' }, // Consider enum
  tier: { type: 'string' }, // Consider enum
  points_value: { type: 'integer' },
  display_priority: { type: 'integer' }
};

const userBadgeProperties = {
  badge: { type: 'object', properties: badgeProperties },
  awarded_at: { type: 'string', format: 'date-time' },
  equipped: { type: 'boolean' },
  slot: { type: 'integer', nullable: true }
};

export const openApiGetBadges = {
  summary: 'Get all badges',
  description: 'Retrieves all badges with optional filtering',
  tags: ['Badges'],
  parameters: [
    { in: 'query', name: 'category', schema: { type: 'string', enum: ['achievement', 'rank', 'event', 'supporter', 'milestone', 'custom'] }, description: 'Filter by badge category' },
    { in: 'query', name: 'tier', schema: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum', 'special'] }, description: 'Filter by badge tier' },
    { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search term for badge name/description' }
  ],
  responses: {
    200: {
      description: 'List of badges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: badgeProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetBadgeById = {
  summary: 'Get badge by ID',
  description: 'Retrieves a specific badge by ID',
  tags: ['Badges'],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Badge ID' }
  ],
  responses: {
    200: {
      description: 'Badge details',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: badgeProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    404: { description: 'Badge not found' }
  }
};

export const openApiGetUserBadges = {
  summary: 'Get current user\'s badges',
  description: 'Retrieves badges for the authenticated user',
  tags: ['Badges'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User\'s badges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: userBadgeProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetUserBadgesById = {
  summary: 'Get user\'s badges by user ID',
  description: 'Retrieves badges for a specific user',
  tags: ['Badges'],
  parameters: [
    { in: 'path', name: 'userId', required: true, schema: { type: 'string' }, description: 'User ID' }
  ],
  responses: {
    200: {
      description: 'User\'s badges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: { badge: { type: 'object', properties: badgeProperties }, awarded_at: { type: 'string', format: 'date-time' }, equipped: { type: 'boolean' } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetEquippedBadges = {
  summary: 'Get current user\'s equipped badges',
  description: 'Retrieves only the equipped badges for the authenticated user',
  tags: ['Badges'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User\'s equipped badges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: { badge: { type: 'object', properties: badgeProperties }, slot: { type: 'integer' }, awarded_at: { type: 'string', format: 'date-time' } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetRecommendedBadges = {
  summary: 'Get recommended badges for current user',
  description: 'Retrieves recommended badges for the authenticated user',
  tags: ['Badges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'query', name: 'limit', schema: { type: 'integer', default: 3 }, description: 'Maximum number of badges to return' }
  ],
  responses: {
    200: {
      description: 'Recommended badges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: badgeProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiEquipBadge = {
  summary: 'Equip or unequip a badge',
  description: 'Toggles whether a badge is equipped for the authenticated user',
  tags: ['Badges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Badge ID' }
  ],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['equipped'], properties: { equipped: { type: 'boolean', description: 'Whether to equip or unequip the badge' }, slot: { type: 'integer', description: 'Optional slot to equip the badge in (0-2)', nullable: true } } } } } } }
  },
  responses: {
    200: {
      description: 'Badge equip status updated',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { badge_id: { type: 'string' }, equipped: { type: 'boolean' }, slot: { type: 'integer', nullable: true } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Badge not found or not owned by user' }
  }
};

export const openApiCreateBadge = {
  summary: 'Create a new badge (admin only)',
  description: 'Creates a new badge definition',
  tags: ['Badges'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['name', 'description', 'image_url', 'category', 'tier'], properties: { name: { type: 'string' }, description: { type: 'string' }, image_url: { type: 'string' }, category: { type: 'string', enum: ['achievement', 'rank', 'event', 'supporter', 'milestone', 'custom'] }, tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum', 'special'] }, points_value: { type: 'integer', default: 0 }, display_priority: { type: 'integer', default: 0 } } } } } } }
  },
  responses: {
    201: {
      description: 'Badge created successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: badgeProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' }
  }
};

export const openApiUpdateBadge = {
  summary: 'Update a badge (admin only)',
  description: 'Updates an existing badge definition',
  tags: ['Badges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Badge ID' }
  ],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, image_url: { type: 'string' }, category: { type: 'string', enum: ['achievement', 'rank', 'event', 'supporter', 'milestone', 'custom'] }, tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum', 'special'] }, points_value: { type: 'integer' }, display_priority: { type: 'integer' } } } } } } }
  },
  responses: {
    200: {
      description: 'Badge updated successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: badgeProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Badge not found' }
  }
};

export const openApiDeleteBadge = {
  summary: 'Delete a badge (admin only)',
  description: 'Deletes an existing badge definition',
  tags: ['Badges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Badge ID' }
  ],
  responses: {
    200: {
      description: 'Badge deleted successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, id: { type: 'string' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Badge not found' }
  }
};

export const openApiAwardBadge = {
  summary: 'Award a badge to a user (admin only)',
  description: 'Manually awards a badge to a specified user',
  tags: ['Badges'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['userId', 'badgeId', 'source'], properties: { userId: { type: 'string' }, badgeId: { type: 'string' }, source: { type: 'string' }, reason: { type: 'string', nullable: true } } } } } } }
  },
  responses: {
    200: {
      description: 'Badge awarded successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, badge: { type: 'object', properties: badgeProperties }, awarded_at: { type: 'string', format: 'date-time' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Badge not found' }
  }
};

// --- Schemas from challenge-routes.ts ---

export const getChallengesSchema = {
  querystring: {
    type: 'object',
    properties: {
      category: { type: 'string' }, // Consider enum
      difficulty: { type: 'string' }, // Consider enum
      status: { type: 'string' }, // Consider enum
      active: { type: 'boolean' }
    }
  }
};

export const getActiveChallengesSchema = {
  // No specific query/params schema needed
};

export const getChallengeByIdSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const getUserChallengesSchema = {
  // No specific schema needed for GET /user, relies on authentication
};

export const getUserChallengesByIdSchema = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' }
    }
  }
};

export const joinChallengeSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
  // Note: Original file had a body { data: { challengeId: string } } which seems redundant with the param
};

export const getChallengeProgressSchema_Challenge = { // Renamed to avoid conflict
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const updateChallengeProgressSchema = {
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['activityType', 'value'],
        properties: {
          activityType: { type: 'string' },
          value: { type: 'number' },
          referenceId: { type: 'string', nullable: true },
          metadata: { type: 'object', nullable: true }
        }
      }
    }
  }
};

export const abandonChallengeSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const createChallengeSchema = {
  // Admin only
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['title', 'description', 'category', 'difficulty', 'start_date', 'end_date', 'requirements', 'rewards'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          image_url: { type: 'string', nullable: true },
          category: { type: 'string' }, // Consider enum
          difficulty: { type: 'string' }, // Consider enum
          start_date: { type: 'string', format: 'date-time' },
          end_date: { type: 'string', format: 'date-time' },
          requirements: { type: 'array', items: { type: 'object' } },
          rewards: { type: 'array', items: { type: 'object' } }
        }
      }
    }
  }
};

export const updateChallengeSchema = {
  // Admin only
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          image_url: { type: 'string', nullable: true },
          category: { type: 'string' }, // Consider enum
          difficulty: { type: 'string' }, // Consider enum
          start_date: { type: 'string', format: 'date-time' },
          end_date: { type: 'string', format: 'date-time' },
          requirements: { type: 'array', items: { type: 'object' } },
          rewards: { type: 'array', items: { type: 'object' } },
          status: { type: 'string' } // Consider enum
        }
      }
    }
  }
};

export const deleteChallengeSchema = {
  // Admin only
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const completeChallengeSchema = {
  // Admin only
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['userId', 'challengeId', 'reason'],
        properties: {
          userId: { type: 'string' },
          challengeId: { type: 'string' },
          reason: { type: 'string' }
        }
      }
    }
  }
};


// --- OpenAPI Definitions for Challenges ---

const challengeProperties = {
  id: { type: 'string' },
  title: { type: 'string' },
  description: { type: 'string' },
  image_url: { type: 'string', nullable: true },
  category: { type: 'string' }, // Consider enum
  difficulty: { type: 'string' }, // Consider enum
  start_date: { type: 'string', format: 'date-time' },
  end_date: { type: 'string', format: 'date-time' },
  status: { type: 'string' } // Consider enum
};

const challengeDetailsProperties = {
  ...challengeProperties,
  requirements: { type: 'array', items: { type: 'object' } },
  rewards: { type: 'array', items: { type: 'object' } },
  days_remaining: { type: 'integer', nullable: true }
};

const userChallengeProgressProperties = {
  challenge: { type: 'object', properties: challengeProperties },
  joined_at: { type: 'string', format: 'date-time' },
  status: { type: 'string' }, // Consider enum
  overall_progress: { type: 'integer' },
  requirements_progress: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        requirement_id: { type: 'string' },
        current_value: { type: 'number' },
        target_value: { type: 'number' },
        percent_complete: { type: 'integer' }
      }
    }
  }
};

export const openApiGetChallenges = {
  summary: 'Get all challenges',
  description: 'Retrieves all challenges with optional filtering',
  tags: ['Challenges'],
  parameters: [
    { in: 'query', name: 'category', schema: { type: 'string', enum: ['daily', 'weekly', 'seasonal', 'special', 'onboarding'] }, description: 'Filter by challenge category' },
    { in: 'query', name: 'difficulty', schema: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] }, description: 'Filter by challenge difficulty' },
    { in: 'query', name: 'status', schema: { type: 'string', enum: ['upcoming', 'active', 'completed', 'expired'] }, description: 'Filter by challenge status' },
    { in: 'query', name: 'active', schema: { type: 'boolean' }, description: 'Filter for currently active challenges only' }
  ],
  responses: {
    200: {
      description: 'List of challenges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: challengeProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetActiveChallenges = {
  summary: 'Get active challenges',
  description: 'Retrieves currently active challenges',
  tags: ['Challenges'],
  responses: {
    200: {
      description: 'List of active challenges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: { ...challengeProperties, days_remaining: { type: 'integer' } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetChallengeById = {
  summary: 'Get challenge by ID',
  description: 'Retrieves a specific challenge by ID',
  tags: ['Challenges'],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Challenge ID' }
  ],
  responses: {
    200: {
      description: 'Challenge details',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: challengeDetailsProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    404: { description: 'Challenge not found' }
  }
};

export const openApiGetUserChallenges = {
  summary: 'Get current user\'s challenges',
  description: 'Retrieves challenges for the authenticated user',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User\'s challenges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { active: { type: 'array', items: { type: 'object', properties: userChallengeProgressProperties } }, completed: { type: 'array', items: { type: 'object', properties: { challenge: { type: 'object', properties: challengeProperties }, completed_at: { type: 'string', format: 'date-time' } } } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetUserChallengesById = {
  summary: 'Get challenges for a specific user',
  description: 'Retrieves challenges for a specific user',
  tags: ['Challenges'],
  parameters: [
    { in: 'path', name: 'userId', required: true, schema: { type: 'string' }, description: 'User ID' }
  ],
  responses: {
    200: {
      description: 'User\'s challenges',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { active_count: { type: 'integer' }, completed_count: { type: 'integer' }, recent_completed: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, completed_at: { type: 'string', format: 'date-time' } } } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiJoinChallenge = {
  summary: 'Join a challenge',
  description: 'Joins the authenticated user to a challenge',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Challenge ID' }
  ],
  responses: {
    200: {
      description: 'Challenge joined successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, challenge: { type: 'object', properties: challengeProperties }, joined_at: { type: 'string', format: 'date-time' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Challenge not found' },
    400: { description: 'Challenge not active or already joined' }
  }
};

export const openApiGetChallengeProgress_Challenge = { // Renamed
  summary: 'Get challenge progress',
  description: 'Retrieves progress for a specific challenge for the authenticated user',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Challenge ID' }
  ],
  responses: {
    200: {
      description: 'Challenge progress',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: userChallengeProgressProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Challenge not found or not joined' }
  }
};

export const openApiUpdateChallengeProgress = {
  summary: 'Update challenge progress',
  description: 'Records activity for challenge progress for the authenticated user',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['activityType', 'value'], properties: { activityType: { type: 'string', description: 'Type of activity (e.g., content_creation, login)' }, value: { type: 'number', description: 'Value to add to the progress' }, referenceId: { type: 'string', description: 'Optional reference ID', nullable: true }, metadata: { type: 'object', description: 'Optional metadata', nullable: true } } } } } } }
  },
  responses: {
    200: {
      description: 'Challenge progress updated successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { updated: { type: 'boolean' }, progressed: { type: 'array', items: { type: 'object', properties: { challengeId: { type: 'string' }, requirements: { type: 'array', items: { type: 'object' } } } } }, completed: { type: 'array', items: { type: 'object', properties: { challengeId: { type: 'string' }, rewards: { type: 'array', items: { type: 'object' } } } } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiAbandonChallenge = {
  summary: 'Abandon a challenge',
  description: 'Abandons a challenge for the authenticated user',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Challenge ID' }
  ],
  responses: {
    200: {
      description: 'Challenge abandoned successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, challenge_id: { type: 'string' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Challenge not found or not joined' }
  }
};

export const openApiCreateChallenge = {
  summary: 'Create a new challenge (admin only)',
  description: 'Creates a new challenge definition',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['title', 'description', 'category', 'difficulty', 'start_date', 'end_date', 'requirements', 'rewards'], properties: { title: { type: 'string' }, description: { type: 'string' }, image_url: { type: 'string', nullable: true }, category: { type: 'string', enum: ['daily', 'weekly', 'seasonal', 'special', 'onboarding'] }, difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] }, start_date: { type: 'string', format: 'date-time' }, end_date: { type: 'string', format: 'date-time' }, requirements: { type: 'array', items: { type: 'object' } }, rewards: { type: 'array', items: { type: 'object' } } } } } } } }
  },
  responses: {
    201: {
      description: 'Challenge created successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: challengeProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' }
  }
};

export const openApiUpdateChallenge = {
  summary: 'Update a challenge (admin only)',
  description: 'Updates an existing challenge definition',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Challenge ID' }
  ],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, image_url: { type: 'string', nullable: true }, category: { type: 'string', enum: ['daily', 'weekly', 'seasonal', 'special', 'onboarding'] }, difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] }, start_date: { type: 'string', format: 'date-time' }, end_date: { type: 'string', format: 'date-time' }, requirements: { type: 'array', items: { type: 'object' } }, rewards: { type: 'array', items: { type: 'object' } }, status: { type: 'string', enum: ['upcoming', 'active', 'completed', 'expired'] } } } } } } }
  },
  responses: {
    200: {
      description: 'Challenge updated successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: challengeProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Challenge not found' }
  }
};

export const openApiDeleteChallenge = {
  summary: 'Delete a challenge (admin only)',
  description: 'Deletes an existing challenge definition',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Challenge ID' }
  ],
  responses: {
    200: {
      description: 'Challenge deleted successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, id: { type: 'string' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Challenge not found' }
  }
};

export const openApiCompleteChallenge = {
  summary: 'Manually complete a challenge for a user (admin only)',
  description: 'Manually completes a challenge for a specified user',
  tags: ['Challenges'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['userId', 'challengeId', 'reason'], properties: { userId: { type: 'string' }, challengeId: { type: 'string' }, reason: { type: 'string' } } } } } } }
  },
  responses: {
    200: {
      description: 'Challenge completed successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, challenge: { type: 'object', properties: challengeProperties }, completed_at: { type: 'string', format: 'date-time' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Challenge not found or not joined' }
  }
};

// --- Schemas from leaderboard-routes.ts ---

export const getLeaderboardCategoriesSchema = {
  // No specific schema needed
};

export const getLeaderboardPeriodsSchema = {
  // No specific schema needed
};

export const getLeaderboardSchema = {
  params: {
    type: 'object',
    required: ['category', 'period'],
    properties: {
      category: { type: 'string' }, // Consider enum
      period: { type: 'string' } // Consider enum
    }
  },
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'number', default: 100 },
      offset: { type: 'number', default: 0 }
    }
  }
};

export const getUserRankSchema = {
  params: {
    type: 'object',
    required: ['category', 'period'],
    properties: {
      category: { type: 'string' }, // Consider enum
      period: { type: 'string' } // Consider enum
    }
  }
};

export const getUserRankByIdSchema = {
  params: {
    type: 'object',
    required: ['category', 'period', 'userId'],
    properties: {
      category: { type: 'string' }, // Consider enum
      period: { type: 'string' }, // Consider enum
      userId: { type: 'string' }
    }
  }
};

export const getUserLeaderboardSummarySchema = {
  // No specific schema needed, relies on authentication
};

export const getLeaderboardHistorySchema = {
  params: {
    type: 'object',
    required: ['category', 'period'],
    properties: {
      category: { type: 'string' }, // Consider enum
      period: { type: 'string' } // Consider enum
    }
  },
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'number', default: 30 }
    }
  }
};

export const getUserRankHistorySchema = {
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
      category: { type: 'string' }, // Consider enum
      period: { type: 'string' }, // Consider enum
      limit: { type: 'number', default: 30 }
    }
  }
};

export const refreshLeaderboardSchema = {
  // Admin only
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['category', 'period'],
        properties: {
          category: { type: 'string' }, // Consider enum
          period: { type: 'string' } // Consider enum
        }
      }
    }
  }
};

export const createLeaderboardSnapshotSchema = {
  // Admin only
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['category', 'period'],
        properties: {
          category: { type: 'string' }, // Consider enum
          period: { type: 'string' } // Consider enum
        }
      }
    }
  }
};


// --- OpenAPI Definitions for Leaderboards ---

const leaderboardCategoryProperties = {
  id: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string' }
};

const leaderboardPeriodProperties = {
  id: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string' }
};

const leaderboardEntryProperties = {
  user_id: { type: 'string' },
  username: { type: 'string' },
  display_name: { type: 'string' },
  avatar_url: { type: 'string', nullable: true },
  rank: { type: 'integer' },
  score: { type: 'number' },
  previous_rank: { type: 'integer', nullable: true },
  level: { type: 'integer' }
};

const userRankProperties = {
  rank: { type: 'integer' },
  score: { type: 'number' },
  previous_rank: { type: 'integer', nullable: true },
  total_participants: { type: 'integer' },
  percentile: { type: 'number' }
};

const userRankWithNearbyProperties = {
  ...userRankProperties,
  nearby_users: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        username: { type: 'string' },
        rank: { type: 'integer' },
        score: { type: 'number' }
      }
    }
  }
};

const leaderboardSnapshotProperties = {
  id: { type: 'string' },
  category: { type: 'string' },
  period: { type: 'string' },
  snapshot_date: { type: 'string', format: 'date' },
  top_users: { type: 'array', items: { type: 'object' } } // Define further if needed
};

const userRankHistoryEntryProperties = {
  category: { type: 'string' },
  period: { type: 'string' },
  rank: { type: 'integer' },
  score: { type: 'number' },
  date: { type: 'string', format: 'date' },
  percentile: { type: 'number' }
};

export const openApiGetLeaderboardCategories = {
  summary: 'Get available leaderboard categories',
  description: 'Retrieves all available categories for leaderboards',
  tags: ['Leaderboards'],
  responses: {
    200: {
      description: 'List of leaderboard categories',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: leaderboardCategoryProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetLeaderboardPeriods = {
  summary: 'Get available leaderboard time periods',
  description: 'Retrieves all available time periods for leaderboards',
  tags: ['Leaderboards'],
  responses: {
    200: {
      description: 'List of leaderboard time periods',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: leaderboardPeriodProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetLeaderboard = {
  summary: 'Get leaderboard for a specific category and period',
  description: 'Retrieves rankings for a specific leaderboard category and time period',
  tags: ['Leaderboards'],
  parameters: [
    { in: 'path', name: 'category', required: true, schema: { type: 'string', enum: ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'] }, description: 'Leaderboard category' },
    { in: 'path', name: 'period', required: true, schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'] }, description: 'Time period' },
    { in: 'query', name: 'limit', schema: { type: 'integer', default: 100 }, description: 'Maximum number of entries to return' },
    { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 }, description: 'Number of entries to skip' }
  ],
  responses: {
    200: {
      description: 'Leaderboard entries',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { entries: { type: 'array', items: { type: 'object', properties: leaderboardEntryProperties } }, total_count: { type: 'integer' }, category: { type: 'string' }, period: { type: 'string' }, last_updated: { type: 'string', format: 'date-time' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    400: { description: 'Invalid category or period' }
  }
};

export const openApiGetUserRank = {
  summary: 'Get current user\'s position in a leaderboard',
  description: 'Retrieves the authenticated user\'s position in a specific leaderboard',
  tags: ['Leaderboards'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'category', required: true, schema: { type: 'string', enum: ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'] }, description: 'Leaderboard category' },
    { in: 'path', name: 'period', required: true, schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'] }, description: 'Time period' }
  ],
  responses: {
    200: {
      description: 'User\'s leaderboard position',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: userRankWithNearbyProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    400: { description: 'Invalid category or period' },
    404: { description: 'User not on leaderboard' }
  }
};

export const openApiGetUserRankById = {
  summary: 'Get a specific user\'s position in a leaderboard',
  description: 'Retrieves a specific user\'s position in a leaderboard',
  tags: ['Leaderboards'],
  parameters: [
    { in: 'path', name: 'category', required: true, schema: { type: 'string', enum: ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'] }, description: 'Leaderboard category' },
    { in: 'path', name: 'period', required: true, schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'] }, description: 'Time period' },
    { in: 'path', name: 'userId', required: true, schema: { type: 'string' }, description: 'User ID' }
  ],
  responses: {
    200: {
      description: 'User\'s leaderboard position',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: userRankProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    400: { description: 'Invalid category or period' },
    404: { description: 'User not on leaderboard' }
  }
};

export const openApiGetUserLeaderboardSummary = {
  summary: 'Get current user\'s summary across all leaderboards',
  description: 'Retrieves the authenticated user\'s summary across all leaderboards',
  tags: ['Leaderboards'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User\'s leaderboard summary',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { best_category: { type: 'object', properties: { category: { type: 'string' }, period: { type: 'string' }, rank: { type: 'integer' }, percentile: { type: 'number' } } }, all_time_ranks: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, rank: { type: 'integer' }, percentile: { type: 'number' } } } }, total_leaderboards: { type: 'integer' }, leaderboards_in_top_ten_percent: { type: 'integer' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetLeaderboardHistory = {
  summary: 'Get historical snapshots of a leaderboard',
  description: 'Retrieves historical snapshots of a leaderboard for trend analysis',
  tags: ['Leaderboards'],
  parameters: [
    { in: 'path', name: 'category', required: true, schema: { type: 'string', enum: ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'] }, description: 'Leaderboard category' },
    { in: 'path', name: 'period', required: true, schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'] }, description: 'Time period' },
    { in: 'query', name: 'limit', schema: { type: 'integer', default: 30 }, description: 'Maximum number of historical entries to return' }
  ],
  responses: {
    200: {
      description: 'Historical leaderboard snapshots',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: leaderboardSnapshotProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    400: { description: 'Invalid category or period' }
  }
};

export const openApiGetUserRankHistory = {
  summary: 'Get a user\'s ranking history',
  description: 'Retrieves historical rankings for a specific user',
  tags: ['Leaderboards'],
  parameters: [
    { in: 'path', name: 'userId', required: true, schema: { type: 'string' }, description: 'User ID' },
    { in: 'query', name: 'category', schema: { type: 'string', enum: ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'] }, description: 'Optional filter by category' },
    { in: 'query', name: 'period', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'] }, description: 'Optional filter by period' },
    { in: 'query', name: 'limit', schema: { type: 'integer', default: 30 }, description: 'Maximum number of historical entries to return' }
  ],
  responses: {
    200: {
      description: 'User\'s ranking history',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: userRankHistoryEntryProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiRefreshLeaderboard = {
  summary: 'Manually refresh leaderboards (admin only)',
  description: 'Manually triggers a refresh of the specified leaderboard',
  tags: ['Leaderboards'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['category', 'period'], properties: { category: { type: 'string', enum: ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'] }, period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'] } } } } } } }
  },
  responses: {
    200: {
      description: 'Leaderboard refreshed successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, entries_processed: { type: 'integer' }, timestamp: { type: 'string', format: 'date-time' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' }
  }
};

export const openApiCreateLeaderboardSnapshot = {
  summary: 'Create a leaderboard snapshot (admin only)',
  description: 'Manually creates a historical snapshot of the current leaderboard',
  tags: ['Leaderboards'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['category', 'period'], properties: { category: { type: 'string', enum: ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'] }, period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'] } } } } } } }
  },
  responses: {
    200: {
      description: 'Snapshot created successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, snapshot_id: { type: 'string' }, snapshot_date: { type: 'string', format: 'date' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' }
  }
};

// --- Schemas from level-routes.ts ---

export const getAllLevelDefinitionsSchema = {
  // No specific schema needed
};

export const getLevelDefinitionSchema = {
  params: {
    type: 'object',
    required: ['level'],
    properties: {
      level: { type: 'number' }
    }
  }
};

export const getUserLevelSchema = {
  // No specific schema needed, relies on authentication
};

export const getUserLevelByIdSchema = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' }
    }
  }
};

export const getXpTransactionsSchema = {
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'number', default: 20 },
      offset: { type: 'number', default: 0 }
    }
  }
};

export const getXpValuesSchema = {
  // No specific schema needed
};

export const awardXpSchema = {
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['amount', 'source'],
        properties: {
          amount: { type: 'number' },
          source: { type: 'string' },
          referenceId: { type: 'string', nullable: true }
        }
      }
    }
  }
};

export const adminAwardXpSchema = {
  // Admin only
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['userId', 'amount'],
        properties: {
          userId: { type: 'string' },
          amount: { type: 'number' },
          reason: { type: 'string', nullable: true }
        }
      }
    }
  }
};


// --- OpenAPI Definitions for Levels ---

const levelDefinitionProperties = {
  level: { type: 'integer' },
  title: { type: 'string' },
  xp_required: { type: 'integer' },
  benefits: { type: 'array', items: { type: 'string' } },
  points_reward: { type: 'integer' }
};

const userLevelProperties = {
  level: { type: 'integer' },
  current_xp: { type: 'integer' },
  nextLevel: { type: 'object', properties: levelDefinitionProperties, nullable: true },
  xpToNextLevel: { type: 'integer' },
  percentToNextLevel: { type: 'integer' },
  levelTitle: { type: 'string' },
  benefits: { type: 'array', items: { type: 'string' } }
};

const xpTransactionProperties = {
  id: { type: 'string' },
  amount: { type: 'integer' },
  source: { type: 'string' },
  reference_id: { type: 'string', nullable: true },
  created_at: { type: 'string', format: 'date-time' }
};

export const openApiGetAllLevelDefinitions = {
  summary: 'Get all level definitions',
  description: 'Retrieves all level definitions with required XP and benefits',
  tags: ['Levels'],
  responses: {
    200: {
      description: 'List of level definitions',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: levelDefinitionProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetLevelDefinition = {
  summary: 'Get level definition by level number',
  description: 'Retrieves information about a specific level',
  tags: ['Levels'],
  parameters: [
    { in: 'path', name: 'level', required: true, schema: { type: 'integer' }, description: 'Level number' }
  ],
  responses: {
    200: {
      description: 'Level definition',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: levelDefinitionProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    404: { description: 'Level not found' }
  }
};

export const openApiGetUserLevel = {
  summary: 'Get current user\'s level',
  description: 'Retrieves level information for the authenticated user',
  tags: ['Levels'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User\'s level information',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: userLevelProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetUserLevelById = {
  summary: 'Get level for a specific user',
  description: 'Retrieves level information for a specific user',
  tags: ['Levels'],
  parameters: [
    { in: 'path', name: 'userId', required: true, schema: { type: 'string' }, description: 'User ID' }
  ],
  responses: {
    200: {
      description: 'User\'s level information',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { level: { type: 'integer' }, levelTitle: { type: 'string' }, benefits: { type: 'array', items: { type: 'string' } } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    404: { description: 'User not found' }
  }
};

export const openApiGetXpTransactions = {
  summary: 'Get XP transactions for current user',
  description: 'Retrieves XP transaction history for the authenticated user',
  tags: ['Levels'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 }, description: 'Maximum number of transactions to return' },
    { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 }, description: 'Number of transactions to skip' }
  ],
  responses: {
    200: {
      description: 'XP transaction history',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: xpTransactionProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetXpValues = {
  summary: 'Get XP values for different activities',
  description: 'Retrieves the amount of XP awarded for different activities',
  tags: ['Levels'],
  responses: {
    200: {
      description: 'XP values by activity',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', additionalProperties: { type: 'integer' } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiAwardXp = {
  summary: 'Award XP to current user',
  description: 'Awards XP to the authenticated user and checks for level up',
  tags: ['Levels'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['amount', 'source'], properties: { amount: { type: 'integer', description: 'Amount of XP to award' }, source: { type: 'string', description: 'Source of XP (e.g., content_creation)' }, referenceId: { type: 'string', description: 'Optional reference ID', nullable: true } } } } } } }
  },
  responses: {
    200: {
      description: 'XP awarded successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { previousLevel: { type: 'integer' }, currentLevel: { type: 'integer' }, totalXp: { type: 'integer' }, xpGained: { type: 'integer' }, xpToNextLevel: { type: 'integer' }, levelUp: { type: 'boolean' }, levelProgress: { type: 'integer' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    400: { description: 'Invalid request' }
  }
};

export const openApiAdminAwardXp = {
  summary: 'Award XP to a user (admin only)',
  description: 'Manually awards XP to a specified user',
  tags: ['Levels'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['userId', 'amount'], properties: { userId: { type: 'string' }, amount: { type: 'integer' }, reason: { type: 'string', nullable: true } } } } } } }
  },
  responses: {
    200: {
      description: 'XP awarded successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { previousLevel: { type: 'integer' }, currentLevel: { type: 'integer' }, totalXp: { type: 'integer' }, xpGained: { type: 'integer' }, levelUp: { type: 'boolean' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' }
  }
};

// --- Schemas from streak-routes.ts ---

export const getAllStreakDefinitionsSchema = {
  // No specific schema needed
};

export const getStreakDefinitionSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const getUserStreaksSchema = {
  // No specific schema needed, relies on authentication
};

export const getUserStreaksByIdSchema = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' }
    }
  }
};

export const getStreakStatusSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

export const recordStreakActivitySchema = {
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['activityType'],
        properties: {
          activityType: { type: 'string' }
        }
      }
    }
  }
};

export const resetStreaksSchema = {
  // Admin only - No specific schema needed
};

export const adminRecordStreakActivitySchema = {
  // Admin only
  body: {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: ['userId', 'activityType'],
        properties: {
          userId: { type: 'string' },
          activityType: { type: 'string' },
          reason: { type: 'string', nullable: true }
        }
      }
    }
  }
};


// --- OpenAPI Definitions for Streaks ---

const streakDefinitionProperties = {
  id: { type: 'string' },
  name: { type: 'string' },
  activity_type: { type: 'string' },
  period_type: { type: 'string' }, // Consider enum: daily, weekly
  thresholds: { type: 'array', items: { type: 'object' } }, // Define threshold object if needed
  bonus_formula: { type: 'string', nullable: true }
};

const userStreakProperties = {
  streak: { type: 'object', properties: streakDefinitionProperties },
  current_count: { type: 'integer' },
  longest_count: { type: 'integer' },
  last_activity_date: { type: 'string', format: 'date-time', nullable: true },
  next_milestone: { type: 'integer', nullable: true },
  milestone_progress: { type: 'integer' }
};

const userStreakStatusProperties = {
  ...userStreakProperties, // Inherit properties
  isActive: { type: 'boolean' },
  today_recorded: { type: 'boolean' },
  grace_period_used: { type: 'boolean' },
  streak_definition: { type: 'object', properties: streakDefinitionProperties } // Include full definition
};

export const openApiGetAllStreakDefinitions = {
  summary: 'Get all streak definitions',
  description: 'Retrieves all streak types and their thresholds',
  tags: ['Streaks'],
  responses: {
    200: {
      description: 'List of streak definitions',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: streakDefinitionProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetStreakDefinition = {
  summary: 'Get streak definition by ID',
  description: 'Retrieves information about a specific streak type',
  tags: ['Streaks'],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Streak ID' }
  ],
  responses: {
    200: {
      description: 'Streak definition',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: streakDefinitionProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    404: { description: 'Streak not found' }
  }
};

export const openApiGetUserStreaks = {
  summary: 'Get current user\'s streaks',
  description: 'Retrieves streaks for the authenticated user',
  tags: ['Streaks'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User\'s streaks',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object', properties: userStreakProperties } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' }
  }
};

export const openApiGetUserStreaksById = {
  summary: 'Get streaks for a specific user',
  description: 'Retrieves streaks for a specific user',
  tags: ['Streaks'],
  parameters: [
    { in: 'path', name: 'userId', required: true, schema: { type: 'string' }, description: 'User ID' }
  ],
  responses: {
    200: {
      description: 'User\'s streaks',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { streaks: { type: 'array', items: { type: 'object', properties: { streak_name: { type: 'string' }, current_count: { type: 'integer' }, longest_count: { type: 'integer' } } } }, best_streak: { type: 'object', properties: { streak_name: { type: 'string' }, count: { type: 'integer' } }, nullable: true } } }, meta: { type: 'object', properties: metaProperties } } } } }
    }
  }
};

export const openApiGetStreakStatus = {
  summary: 'Get user\'s status for a specific streak',
  description: 'Retrieves detailed status for a specific streak for the authenticated user',
  tags: ['Streaks'],
  security: [{ bearerAuth: [] }],
  parameters: [
    { in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'Streak ID' }
  ],
  responses: {
    200: {
      description: 'Streak status',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: userStreakStatusProperties }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Streak not found' }
  }
};

export const openApiRecordStreakActivity = {
  summary: 'Record streak activity',
  description: 'Records activity for a streak for the authenticated user',
  tags: ['Streaks'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['activityType'], properties: { activityType: { type: 'string', description: 'Type of activity to record (e.g., login, content_creation)' } } } } } } }
  },
  responses: {
    200: {
      description: 'Streak activity recorded successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { currentStreak: { type: 'integer' }, streakUpdated: { type: 'boolean' }, lastActivityDate: { type: 'string', format: 'date-time' }, milestoneReached: { type: 'integer', nullable: true }, gracePeriodUsed: { type: 'boolean' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    400: { description: 'Invalid activity type' }
  }
};

export const openApiResetStreaks = {
  summary: 'Reset streaks (admin only)',
  description: 'Resets streaks that have expired (admin only)',
  tags: ['Streaks'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Streaks reset successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { resetCount: { type: 'integer' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' }
  }
};

export const openApiAdminRecordStreakActivity = {
  summary: 'Manually record streak activity for a user (admin only)',
  description: 'Manually records activity for a user\'s streak (admin only)',
  tags: ['Streaks'],
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['userId', 'activityType'], properties: { userId: { type: 'string' }, activityType: { type: 'string' }, reason: { type: 'string', nullable: true } } } } } } }
  },
  responses: {
    200: {
      description: 'Streak activity recorded successfully',
      content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' }, currentStreak: { type: 'integer' }, streakUpdated: { type: 'boolean' } } }, meta: { type: 'object', properties: metaProperties } } } } }
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden - Admin only' }
  }
};
