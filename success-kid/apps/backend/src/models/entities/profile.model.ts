/**
 * Profile Model
 * 
 * Defines the Profile entity, validation schemas, and related data transfer objects.
 * Profiles contain extended information about users.
 */
import { z } from 'zod';

// Social links validation schema
export const socialLinksSchema = z.record(
  z.string(), // Key (platform name)
  z.string().url({ message: 'Social link must be a valid URL' }) // Value (URL)
);

// User preferences validation schema
export const userPreferencesSchema = z.record(z.string(), z.any());

// Profile Zod Schema
export const profileSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters' }).nullable(),
  avatar_url: z.string().url({ message: 'Avatar URL must be a valid URL' }).nullable(),
  level: z.number().int().positive().default(1),
  title: z.string().max(100, { message: 'Title cannot exceed 100 characters' }).nullable(),
  social_links: socialLinksSchema.default({}),
  preferences: userPreferencesSchema.default({}),
  total_points: z.number().int().default(0),
  updated_at: z.coerce.date().optional()
});

// TypeScript Profile Type derived from Zod schema
export type Profile = z.infer<typeof profileSchema>;

// Create Profile Input Schema
export const createProfileSchema = profileSchema
  .omit({ updated_at: true })
  .partial({ 
    bio: true, 
    avatar_url: true, 
    level: true, 
    title: true, 
    social_links: true,
    preferences: true,
    total_points: true
  })
  .required({ user_id: true });

// Create Profile DTO Type
export type CreateProfileDto = z.infer<typeof createProfileSchema>;

// Update Profile Input Schema
export const updateProfileSchema = profileSchema
  .omit({ user_id: true, updated_at: true })
  .partial();

// Update Profile DTO Type
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

// Profile Response Schema (for API responses)
export const profileResponseSchema = profileSchema;

// Profile Response DTO Type
export type ProfileResponseDto = z.infer<typeof profileResponseSchema>;
