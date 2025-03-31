import { z } from 'zod';
import { 
    GetUserAchievementsParamsSchema, 
    GetUserAchievementsQuerySchema 
} from './schema';

// Type for route parameters when getting user achievements
export type GetUserAchievementsParams = z.infer<typeof GetUserAchievementsParamsSchema>;

// Type for query parameters when getting user achievements
export type GetUserAchievementsQuery = z.infer<typeof GetUserAchievementsQuerySchema>;

// Add other types related to achievements API if needed later
