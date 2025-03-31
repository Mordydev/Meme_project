import { z } from 'zod';
import { AchievementSchema, UserAchievementSchema } from '../../models/entities/achievement.model'; // Assuming model exists

// Example: Get User Achievements Response
export const GetUserAchievementsResponseSchema = z.object({
  data: z.array(UserAchievementSchema), // Use the model schema
  meta: z.object({
    timestamp: z.string().datetime(),
  }),
  // Add pagination if needed
});
export type GetUserAchievementsResponse = z.infer<typeof GetUserAchievementsResponseSchema>;

// Example: List All Achievements Response
export const ListAchievementsResponseSchema = z.object({
    data: z.array(AchievementSchema), // Use the model schema
    meta: z.object({
        timestamp: z.string().datetime(),
    }),
    // Add pagination if needed
});
export type ListAchievementsResponse = z.infer<typeof ListAchievementsResponseSchema>;

// Add other necessary request/response types
