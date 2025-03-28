export const authSchemas = [
  {
    $id: 'loginRequestSchema',
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 }
    }
  },
  {
    $id: 'loginResponseSchema',
    type: 'object',
    properties: {
      token: { type: 'string' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' }
        }
      }
    }
  },
  {
    $id: 'registerRequestSchema',
    type: 'object',
    required: ['email', 'password', 'username'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      username: { type: 'string', minLength: 3, maxLength: 30 }
    }
  }
];