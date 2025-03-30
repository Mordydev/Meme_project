/**
 * Schemas for the Feature Flags API module
 */

const metaProperties = {
  timestamp: { type: 'string', format: 'date-time' },
  requestId: { type: 'string' }
};

const featureFlagProperties = {
  name: { type: 'string' },
  enabled: { type: 'boolean' },
  // Add other properties like description, createdAt, etc. if available
};

const userFeatureFlagProperties = {
  name: { type: 'string' },
  userId: { type: 'string' },
  enabled: { type: 'boolean' },
};

// --- Route Schemas ---

export const listFeatureFlagsSchema = {
  tags: ['Feature Flags'],
  summary: 'List all feature flags',
  description: 'Retrieves a list of all defined feature flags and their global status.',
  // Add security if needed (e.g., admin only)
  response: {
    200: {
      description: 'List of feature flags',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object', properties: featureFlagProperties }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

export const getFeatureFlagSchema = {
  tags: ['Feature Flags'],
  summary: 'Get feature flag status',
  description: 'Retrieves the status of a specific feature flag.',
  // Add security if needed
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' }
    }
  },
  response: {
    200: {
      description: 'Feature flag status',
      type: 'object',
      properties: {
        data: { type: 'object', properties: featureFlagProperties },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    404: { description: 'Feature flag not found' }
  }
};

export const setFeatureFlagSchema = {
  tags: ['Feature Flags'],
  summary: 'Set feature flag status (Admin)',
  description: 'Sets the global status of a feature flag.',
  // Add security (admin only)
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['enabled'],
    properties: {
      enabled: { type: 'boolean' }
    }
  },
  response: {
    200: {
      description: 'Feature flag updated',
      type: 'object',
      properties: {
        data: { type: 'object', properties: featureFlagProperties },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden' },
    404: { description: 'Feature flag not found' }
  }
};

export const setUserFeatureFlagSchema = {
  tags: ['Feature Flags'],
  summary: 'Set user-specific feature flag status (Admin)',
  description: 'Sets the status of a feature flag for a specific user.',
  // Add security (admin only)
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['userId', 'enabled'],
    properties: {
      userId: { type: 'string' },
      enabled: { type: 'boolean' }
    }
  },
  response: {
    200: {
      description: 'User feature flag updated',
      type: 'object',
      properties: {
        data: { type: 'object', properties: userFeatureFlagProperties },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden' },
    404: { description: 'Feature flag or user not found' }
  }
};

export const removeUserFeatureFlagSchema = {
  tags: ['Feature Flags'],
  summary: 'Remove user-specific feature flag override (Admin)',
  description: 'Removes a user-specific override for a feature flag.',
  // Add security (admin only)
  params: {
    type: 'object',
    required: ['name', 'userId'],
    properties: {
      name: { type: 'string' },
      userId: { type: 'string' }
    }
  },
  response: {
    200: {
      description: 'User override removed',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            userId: { type: 'string' },
            removed: { type: 'boolean' }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden' },
    404: { description: 'Feature flag or user override not found' }
  }
};
