import { z } from 'zod';

// Schema for URL parameters (e.g., /profiles/:userId)
export const GetProfileParamsSchema = z.object({
  userId: z.string().uuid(), // Assuming user IDs are UUIDs
});

// Schema for the request body when updating a profile (PUT /profiles/me)
// Make fields optional as users might update only parts of their profile
export const UpdateProfileBodySchema = z.object({
  displayName: z.string().min(3).max(50).optional(),
  bio: z.string().max(250).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  // Add other updatable fields like socialLinks, preferences, title etc.
  // Example:
  // socialLinks: z.record(z.string(), z.string().url()).optional().nullable(),
  // preferences: z.record(z.string(), z.any()).optional().nullable(),
});

// Schema for the profile data returned in responses
// This should align with the data structure provided by ProfileService
export const ProfileSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  email: z.string().email().optional(), // Optional: only show for 'me' endpoint?
  bio: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  level: z.number().int().positive(),
  title: z.string().nullable(),
  createdAt: z.coerce.date(), // Or string if formatted in service
  // Add other fields like points, achievement count, content count etc.
  // Example:
  // pointsBalance: z.number().int().optional(),
  // achievementCount: z.number().int().optional(),
});

// Schema for the API response wrapper
export const ProfileResponseSchema = z.object({
  data: ProfileSchema,
  meta: z.object({
    timestamp: z.string().datetime(),
    // Add other meta fields if needed
  }),
});

// You might need a different schema for public profiles vs. 'me' profile
// export const PublicProfileSchema = ProfileSchema.omit({ email: true }); // Example
// export const PublicProfileResponseSchema = z.object({ data: PublicProfileSchema, meta: ... });
