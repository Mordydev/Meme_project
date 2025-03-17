/**
 * User Schemas
 * 
 * OpenAPI schema definitions for user-related endpoints
 */
import { JSONSchema7 } from 'json-schema';

/**
 * User profile schema
 */
export const userProfileSchema: JSONSchema7 = {
  $id: 'userProfile',
  type: 'object',
  required: ['id', 'displayName', 'level'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    displayName: { type: 'string', minLength: 3, maxLength: 50 },
    bio: { type: 'string', maxLength: 500 },
    avatarUrl: { type: 'string', format: 'uri' },
    level: { type: 'integer', minimum: 1 },
    title: { type: 'string', maxLength: 50 },
    joinedAt: { type: 'string', format: 'date-time' },
    points: { type: 'integer', minimum: 0 },
    walletConnected: { type: 'boolean' },
  },
};

/**
 * User registration schema
 */
export const userRegistrationSchema: JSONSchema7 = {
  $id: 'userRegistration',
  type: 'object',
  required: ['email', 'password', 'displayName'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    displayName: { type: 'string', minLength: 3, maxLength: 50 },
  },
};

/**
 * User login schema
 */
export const userLoginSchema: JSONSchema7 = {
  $id: 'userLogin',
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string' },
  },
};

/**
 * User authentication response schema
 */
export const authResponseSchema: JSONSchema7 = {
  $id: 'authResponse',
  type: 'object',
  required: ['user', 'token'],
  properties: {
    user: {
      type: 'object',
      required: ['id', 'email', 'displayName'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        displayName: { type: 'string' },
      },
    },
    token: { type: 'string' },
  },
};

/**
 * Profile update schema
 */
export const profileUpdateSchema: JSONSchema7 = {
  $id: 'profileUpdate',
  type: 'object',
  properties: {
    displayName: { type: 'string', minLength: 3, maxLength: 50 },
    bio: { type: 'string', maxLength: 500 },
    avatarUrl: { type: 'string', format: 'uri' },
  },
};
