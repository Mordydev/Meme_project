/**
 * User-related type definitions
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'suspended' | 'deleted';
}

export interface Profile {
  userId: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  level: number;
  title?: string;
  socialLinks?: Record<string, string>;
  preferences?: Record<string, any>;
}

export interface UserWithProfile extends User {
  profile: Profile;
}

export interface CreateUserRequest {
  email: string;
  displayName?: string;
  authProvider: string;
}

export interface UpdateProfileRequest {
  bio?: string;
  avatarUrl?: string;
  username?: string;
  title?: string;
  socialLinks?: Record<string, string>;
  preferences?: Record<string, any>;
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

export interface UserSession {
  userId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive: string;
  expired: boolean;
}
