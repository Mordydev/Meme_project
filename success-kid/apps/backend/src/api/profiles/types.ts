import { z } from 'zod';
import {
    GetProfileParamsSchema,
    UpdateProfileBodySchema,
    ProfileSchema,
    ProfileResponseSchema
} from './schema';

// Type for URL parameters when getting a profile
export type GetProfileParams = z.infer<typeof GetProfileParamsSchema>;

// Type for the request body when updating a profile
export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>;

// Type for the profile data object
export type ProfileData = z.infer<typeof ProfileSchema>;

// Type for the full API response containing profile data
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

// Add other specific types if needed, e.g., for public profiles
// export type PublicProfileData = z.infer<typeof PublicProfileSchema>;
// export type PublicProfileResponse = z.infer<typeof PublicProfileResponseSchema>;
