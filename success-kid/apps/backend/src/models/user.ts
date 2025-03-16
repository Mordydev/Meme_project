/**
 * User Model
 * Represents a user in the system
 */
import { z } from 'zod';

// Zod schema for validation
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email({ message: "Invalid email format" }),
  display_name: z.string().min(3, { message: "Display name must be at least 3 characters" }).max(255),
  auth_provider: z.enum(['email', 'google', 'twitter', 'facebook', 'wallet']),
  created_at: z.coerce.date(),
  last_login: z.coerce.date().nullable(),
  status: z.enum(['active', 'suspended', 'deleted'])
});

// TypeScript type derived from schema
export type User = z.infer<typeof userSchema>;

// Input DTOs with validation
export const createUserSchema = userSchema.omit({ 
  created_at: true,
  last_login: true,
  status: true
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  display_name: z.string().min(3).max(255).optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
  auth_provider: z.enum(['email', 'google', 'twitter', 'facebook', 'wallet']).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const userDbMapping = {
  id: 'id',
  email: 'email',
  display_name: 'display_name',
  auth_provider: 'auth_provider',
  created_at: 'created_at',
  last_login: 'last_login',
  status: 'status'
};
