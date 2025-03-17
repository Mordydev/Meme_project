/**
 * User Fixtures
 * 
 * Provides standard test user data
 */
import { v4 as uuid } from 'uuid';

// Test user fixture data
export const testUsers = {
  /**
   * Standard test user
   */
  standardUser: {
    id: uuid(),
    email: 'standard-user@example.com',
    display_name: 'Standard User',
    profile_image: 'https://placekitten.com/100/100',
    level: 5,
    title: 'Community Member',
    created_at: new Date('2023-01-01T12:00:00.000Z'),
    updated_at: new Date('2023-01-01T12:00:00.000Z'),
    roles: ['user'],
    status: 'active',
  },
  
  /**
   * Admin test user
   */
  adminUser: {
    id: uuid(),
    email: 'admin-user@example.com',
    display_name: 'Admin User',
    profile_image: 'https://placekitten.com/110/110',
    level: 50,
    title: 'Community Admin',
    created_at: new Date('2022-01-01T12:00:00.000Z'),
    updated_at: new Date('2022-01-01T12:00:00.000Z'),
    roles: ['user', 'admin'],
    status: 'active',
  },
  
  /**
   * New test user
   */
  newUser: {
    id: uuid(),
    email: 'new-user@example.com',
    display_name: 'New User',
    profile_image: 'https://placekitten.com/90/90',
    level: 1,
    title: 'Newcomer',
    created_at: new Date('2023-06-01T12:00:00.000Z'),
    updated_at: new Date('2023-06-01T12:00:00.000Z'),
    roles: ['user'],
    status: 'active',
  },
  
  /**
   * Suspended test user
   */
  suspendedUser: {
    id: uuid(),
    email: 'suspended-user@example.com',
    display_name: 'Suspended User',
    profile_image: 'https://placekitten.com/95/95',
    level: 3,
    title: 'Suspended',
    created_at: new Date('2023-02-01T12:00:00.000Z'),
    updated_at: new Date('2023-05-01T12:00:00.000Z'),
    roles: ['user'],
    status: 'suspended',
  },
  
  /**
   * High-level test user
   */
  highLevelUser: {
    id: uuid(),
    email: 'high-level-user@example.com',
    display_name: 'High Level User',
    profile_image: 'https://placekitten.com/120/120',
    level: 25,
    title: 'Crypto Enthusiast',
    created_at: new Date('2022-06-01T12:00:00.000Z'),
    updated_at: new Date('2023-05-01T12:00:00.000Z'),
    roles: ['user'],
    status: 'active',
  },
};

// Test user profiles
export const testProfiles = {
  /**
   * Standard user profile
   */
  standardProfile: {
    user_id: testUsers.standardUser.id,
    bio: 'Just a standard user exploring the community.',
    level: 5,
    points: 1500,
    achievements: ['welcome', 'first_post', 'comment_streak'],
    social_links: {
      twitter: 'standard_user',
      discord: 'standard_user#1234',
    },
    preferences: {
      email_notifications: true,
      theme: 'light',
    },
  },
  
  /**
   * Admin user profile
   */
  adminProfile: {
    user_id: testUsers.adminUser.id,
    bio: 'Platform administrator here to help!',
    level: 50,
    points: 25000,
    achievements: ['welcome', 'first_post', 'moderator', 'platform_expert'],
    social_links: {
      twitter: 'admin_user',
      discord: 'admin_user#0001',
    },
    preferences: {
      email_notifications: true,
      theme: 'dark',
    },
  },
  
  /**
   * New user profile
   */
  newProfile: {
    user_id: testUsers.newUser.id,
    bio: 'Just joined! Looking forward to participating.',
    level: 1,
    points: 100,
    achievements: ['welcome'],
    social_links: {},
    preferences: {
      email_notifications: true,
      theme: 'light',
    },
  },
};

/**
 * Get a test user by role
 */
export function getTestUserByRole(role: 'standard' | 'admin' | 'new' | 'suspended' | 'high-level'): any {
  switch (role) {
    case 'standard':
      return testUsers.standardUser;
    case 'admin':
      return testUsers.adminUser;
    case 'new':
      return testUsers.newUser;
    case 'suspended':
      return testUsers.suspendedUser;
    case 'high-level':
      return testUsers.highLevelUser;
    default:
      return testUsers.standardUser;
  }
}

/**
 * Get a test profile by role
 */
export function getTestProfileByRole(role: 'standard' | 'admin' | 'new'): any {
  switch (role) {
    case 'standard':
      return testProfiles.standardProfile;
    case 'admin':
      return testProfiles.adminProfile;
    case 'new':
      return testProfiles.newProfile;
    default:
      return testProfiles.standardProfile;
  }
}
