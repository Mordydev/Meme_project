/**
 * User Templates
 * 
 * Pre-defined user templates for common test scenarios.
 */
import { userFactory, profileFactory, User, Profile } from '../factories/user';

/**
 * Template for an admin user
 */
export const adminUserTemplate: Partial<User> = {
  displayName: 'Admin User',
  email: 'admin@example.com',
  status: 'active'
};

/**
 * Template for a moderator user
 */
export const moderatorUserTemplate: Partial<User> = {
  displayName: 'Moderator User',
  email: 'moderator@example.com',
  status: 'active'
};

/**
 * Template for a regular user
 */
export const regularUserTemplate: Partial<User> = {
  displayName: 'Regular User',
  email: 'user@example.com',
  status: 'active'
};

/**
 * Template for a suspended user
 */
export const suspendedUserTemplate: Partial<User> = {
  displayName: 'Suspended User',
  email: 'suspended@example.com',
  status: 'suspended'
};

/**
 * Template for a new user
 */
export const newUserTemplate: Partial<User> = {
  displayName: 'New User',
  email: 'newuser@example.com',
  status: 'active',
  createdAt: new Date(),
  lastLogin: new Date()
};

/**
 * Template for a user with high reputation
 */
export const highReputationUserTemplate: Partial<User> & { profile: Partial<Profile> } = {
  displayName: 'High Reputation User',
  email: 'highreputation@example.com',
  status: 'active',
  profile: {
    level: 10,
    title: 'Success Champion',
    bio: 'A highly respected community member with numerous contributions.'
  }
};

/**
 * Template for a user with wallet connected
 */
export const walletConnectedUserTemplate: Partial<User> = {
  displayName: 'Wallet Connected User',
  email: 'wallet@example.com',
  status: 'active'
};

/**
 * Create a user from a template
 * 
 * @param template User template to use
 * @param overrides Additional properties to override
 * @returns The created user
 */
export function createUserFromTemplate(
  template: Partial<User>,
  overrides: Partial<User> = {}
): User {
  return userFactory.create({
    ...template,
    ...overrides
  });
}

// Default export for convenient imports
export default {
  adminUserTemplate,
  moderatorUserTemplate,
  regularUserTemplate,
  suspendedUserTemplate,
  newUserTemplate,
  highReputationUserTemplate,
  walletConnectedUserTemplate,
  createUserFromTemplate
};
