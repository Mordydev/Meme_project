/**
 * User Model
 * 
 * Defines the User entity, validation schemas, and related data transfer objects.
 */
import { z } from 'zod';

// User Status Enum
export const UserStatusEnum = z.enum(['active', 'suspended', 'deleted']);
export type UserStatus = z.infer<typeof UserStatusEnum>;

// Auth Provider Enum
export const AuthProviderEnum = z.enum(['email', 'google', 'twitter', 'github', 'wallet']);
export type AuthProvider = z.infer<typeof AuthProviderEnum>;

// User Zod Schema
export const userSchema = z.object({
  id: z.string().uuid({ message: 'Invalid user ID format' }),
  email: z.string().email({ message: 'Invalid email address format' }),
  display_name: z.string()
    .min(3, { message: 'Display name must be at least 3 characters' })
    .max(50, { message: 'Display name cannot exceed 50 characters' }),
  auth_provider: AuthProviderEnum,
  created_at: z.coerce.date(),
  last_login: z.coerce.date().nullable(),
  status: UserStatusEnum
});

// TypeScript User Type derived from Zod schema
export type User = z.infer<typeof userSchema>;

// Create User Input Schema (for user creation)
export const createUserSchema = z.object({
  id: z.string().uuid({ message: 'Invalid user ID format' }),
  email: z.string().email({ message: 'Invalid email address format' }),
  display_name: z.string()
    .min(3, { message: 'Display name must be at least 3 characters' })
    .max(50, { message: 'Display name cannot exceed 50 characters' }),
  auth_provider: AuthProviderEnum,
});

// Create User DTO Type
export type CreateUserDto = z.infer<typeof createUserSchema>;

// Update User Input Schema (for user updates)
export const updateUserSchema = z.object({
  display_name: z.string()
    .min(3, { message: 'Display name must be at least 3 characters' })
    .max(50, { message: 'Display name cannot exceed 50 characters' })
    .optional(),
  email: z.string().email({ message: 'Invalid email address format' }).optional(),
  status: UserStatusEnum.optional(),
});

// Update User DTO Type
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

// User Response Schema (for API responses)
export const userResponseSchema = userSchema.omit({ 
  // Remove sensitive fields that shouldn't be exposed in responses
});

// User Response DTO Type
export type UserResponseDto = z.infer<typeof userResponseSchema>;

// User with Profile Join Type
export interface UserWithProfile extends User {
  profile?: {
    bio: string | null;
    avatar_url: string | null;
    level: number;
    title: string | null;
    social_links: Record<string, string>;
    preferences: Record<string, any>;
  };
}
