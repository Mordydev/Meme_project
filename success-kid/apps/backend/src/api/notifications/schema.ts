/**
 * Schemas for the Notifications API module
 */

export const getNotificationsSchema = {
  tags: ['Notifications'],
  summary: 'Get current user\'s notifications',
  description: 'Returns notifications for the authenticated user',
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'integer', default: 20 },
      offset: { type: 'integer', default: 0 },
      status: { type: 'string' }, // Consider enum: 'read', 'unread', 'archived'
      category: { type: 'string' }, // Consider enum
      channel: { type: 'string' }, // Consider enum: 'in_app', 'email', 'push'
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      includeRead: { type: 'boolean', default: false }
    }
  },
  response: {
    200: {
      description: 'List of notifications',
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string' }, // Added based on handler logic
              title: { type: 'string' },
              body: { type: 'string' },
              imageUrl: { type: 'string', nullable: true }, // Added based on handler logic
              data: { type: 'object', nullable: true }, // Added based on handler logic
              importance: { type: 'string' }, // Added based on handler logic, consider enum
              status: { type: 'string' }, // Consider enum
              createdAt: { type: 'string', format: 'date-time' },
              deliveredAt: { type: 'string', format: 'date-time', nullable: true }, // Added based on handler logic
              readAt: { type: 'string', format: 'date-time', nullable: true }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            unread: { type: 'integer' }
          }
        }
      }
    }
  }
};

export const getNotificationCountSchema = {
  tags: ['Notifications'],
  summary: 'Get notification count',
  description: 'Returns the count of unread notifications',
  response: {
    200: {
      description: 'Notification count',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            unread: { type: 'integer' }
          }
        }
      }
    }
  }
};

export const markNotificationReadSchema = {
  tags: ['Notifications'],
  summary: 'Mark notification as read',
  description: 'Marks a specific notification as read',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  response: {
    200: {
      description: 'Notification marked as read',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' } // Consider enum
          }
        }
      }
    },
    404: {
      description: 'Notification not found',
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
};

export const markAllNotificationsReadSchema = {
  tags: ['Notifications'],
  summary: 'Mark all notifications as read',
  description: 'Marks all notifications for the current user as read',
  response: {
    200: {
      description: 'Notifications marked as read',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            count: { type: 'integer' }
          }
        }
      }
    }
  }
};

export const getPreferencesSchema = {
  tags: ['Notifications'],
  summary: 'Get notification preferences',
  description: 'Returns the current user\'s notification preferences',
  response: {
    200: {
      description: 'Notification preferences',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            channels: { type: 'object' },
            categories: { type: 'object' },
            types: { type: 'object' },
            quietHours: { type: 'object' }
          }
        }
      }
    }
  }
};

export const updatePreferencesSchema = {
  tags: ['Notifications'],
  summary: 'Update notification preferences',
  description: 'Updates the current user\'s notification preferences',
  body: {
    type: 'object',
    properties: {
      channels: {
        type: 'object',
        additionalProperties: { type: 'boolean' }
      },
      categories: {
        type: 'object',
        additionalProperties: { type: 'object' } // Consider more specific schema
      },
      types: {
        type: 'object',
        additionalProperties: { type: 'object' } // Consider more specific schema
      },
      quietHours: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          start: { type: 'string' }, // Consider format validation
          end: { type: 'string' }, // Consider format validation
          timezone: { type: 'string' } // Consider timezone validation
        }
      }
    }
  },
  response: {
    200: {
      description: 'Updated notification preferences',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            channels: { type: 'object' },
            categories: { type: 'object' },
            types: { type: 'object' },
            quietHours: { type: 'object' }
          }
        }
      }
    }
  }
};

export const resetPreferencesSchema = {
  tags: ['Notifications'],
  summary: 'Reset notification preferences',
  description: 'Resets the current user\'s notification preferences to default values',
  response: {
    200: {
      description: 'Reset notification preferences',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            channels: { type: 'object' },
            categories: { type: 'object' },
            types: { type: 'object' },
            quietHours: { type: 'object' }
          }
        }
      }
    }
  }
};
