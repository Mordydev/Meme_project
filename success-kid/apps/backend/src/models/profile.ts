/**
 * Profile Model
 * Represents a user's extended profile information
 */
import { z } from 'zod';

// Define the social links schema
export const socialLinksSchema = z.object({
  twitter: z.string().url().optional(),
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
  discord: z.string().optional(),
  telegram: z.string().optional(),
}).partial();

// Define the preferences schema
export const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  language: z.string().optional(),
}).partial();

// Profile schema with validation
export const profileSchema = z.object({
  user_id: z.string(),
  bio: z.string().max(500).nullable(),
  avatar_url: z.string().url().nullable(),
  level: z.number().int().min(1),
  title: z.string().max(255).nullable(),
  social_links: socialLinksSchema.optional(),
  preferences: preferencesSchema.optional()
});

// TypeScript type derived from schema
export type Profile = z.infer<typeof profileSchema>;

// Input DTOs with validation
export const createProfileSchema = profileSchema.omit({ 
  level: true
}).partial();

export type CreateProfileDto = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = profileSchema.omit({
  user_id: true,
  level: true
}).partial();

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const profileDbMapping = {
  user_id: 'user_id',
  bio: 'bio',
  avatar_url: 'avatar_url',
  level: 'level',
  title: 'title',
  social_links: 'social_links',
  preferences: 'preferences'
};
