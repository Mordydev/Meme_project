/**
 * User Factory
 * 
 * Factory for generating user instances for testing.
 */
import { v4 as uuidv4 } from 'uuid';
import { createFactory } from './index';

// Define user model for TypeScript support
export interface User {
  id: string;
  email: string;
  displayName: string;
  authProvider: string;
  createdAt: Date;
  lastLogin: Date;
  status: string;
}

// Create a user factory with default values
export const userFactory = createFactory<User>({
  id: () => uuidv4(),
  email: () => `user-${Math.floor(Math.random() * 100000)}@example.com`,
  displayName: () => `Test User ${Math.floor(Math.random() * 1000)}`,
  authProvider: () => 'email',
  createdAt: () => new Date(),
  lastLogin: () => new Date(),
  status: 'active'
});

// Define profile model for TypeScript support
export interface Profile {
  userId: string;
  bio: string;
  avatarUrl: string;
  level: number;
  title: string;
  socialLinks: Record<string, string>;
  preferences: Record<string, any>;
}

// Create a profile factory with default values
export const profileFactory = createFactory<Profile>({
  userId: () => uuidv4(),
  bio: () => `I'm a test user who loves the Success Kid community!`,
  avatarUrl: () => `https://i.pravatar.cc/150?u=${Math.random()}`,
  level: () => Math.floor(Math.random() * 10) + 1,
  title: () => 'Community Member',
  socialLinks: () => ({}),
  preferences: () => ({ theme: 'light', notifications: true })
});

// Export an enhanced user factory that also creates associated profile
export const userWithProfileFactory = userFactory.association('profile', profileFactory);

export default {
  userFactory,
  profileFactory,
  userWithProfileFactory
};
