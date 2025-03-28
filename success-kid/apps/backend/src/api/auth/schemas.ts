/**
 * Auth schema definitions for request validation and API documentation
 */
export const authSchemas = [
  // Login
  {
    $id: 'loginSchema',
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 }
    }
  },
  
  // Login response
  {
    $id: 'loginResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              displayName: { type: 'string' }
            }
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' }
        }
      }
    }
  },
  
  // Token
  {
    $id: 'tokenSchema',
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  },
  
  // Token response
  {
    $id: 'tokenResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          sessionId: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' }
        }
      }
    }
  },
  
  // Sessions response
  {
    $id: 'sessionsResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          sessions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                device: { type: 'string' },
                ip: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                lastActiveAt: { type: 'string', format: 'date-time' },
                isCurrent: { type: 'boolean' }
              }
            }
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' }
        }
      }
    }
  },
  
  // Session ID parameter
  {
    $id: 'sessionIdParamSchema',
    type: 'object',
    required: ['sessionId'],
    properties: {
      sessionId: { type: 'string' }
    }
  },
  
  // Email schema (for verification, password reset, etc.)
  {
    $id: 'emailSchema',
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    }
  },
  
  // Token parameter
  {
    $id: 'tokenParamSchema',
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  },
  
  // Password reset
  {
    $id: 'passwordResetSchema',
    type: 'object',
    required: ['token', 'password'],
    properties: {
      token: { type: 'string' },
      password: { type: 'string', minLength: 8 }
    }
  },
  
  // Recovery codes response
  {
    $id: 'recoveryCodesResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          codes: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' }
        }
      }
    }
  },
  
  // Recovery code verification
  {
    $id: 'recoveryCodeSchema',
    type: 'object',
    required: ['userId', 'code'],
    properties: {
      userId: { type: 'string' },
      code: { type: 'string' }
    }
  }
];
