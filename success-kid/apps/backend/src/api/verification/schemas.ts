/**
 * Verification API Schemas
 */
export const verificationSchemas = [
  {
    $id: 'sendVerificationEmailSchema',
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    }
  },
  {
    $id: 'verifyEmailSchema',
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  },
  {
    $id: 'requestEmailChangeSchema',
    type: 'object',
    required: ['newEmail'],
    properties: {
      newEmail: { type: 'string', format: 'email' }
    }
  },
  {
    $id: 'verifyEmailChangeSchema',
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  },
  {
    $id: 'requestPasswordResetSchema',
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    }
  },
  {
    $id: 'resetPasswordSchema',
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: { type: 'string' },
      newPassword: { type: 'string', minLength: 8 }
    }
  },
  {
    $id: 'verifyResetTokenSchema',
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  },
  {
    $id: 'changePasswordSchema',
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string' },
      newPassword: { type: 'string', minLength: 8 }
    }
  },
  {
    $id: 'initiateRecoverySchema',
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    }
  },
  {
    $id: 'completeRecoverySchema',
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  },
  {
    $id: 'generateBackupCodesSchema',
    type: 'object',
    properties: {
      count: { type: 'number', minimum: 1, maximum: 20, default: 10 }
    }
  },
  {
    $id: 'validateBackupCodeSchema',
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string' }
    }
  }
];
