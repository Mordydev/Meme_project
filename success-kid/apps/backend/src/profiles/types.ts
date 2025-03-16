/**
 * User profile
 */
export interface Profile {
  user_id: string;
  bio?: string;
  avatar_url?: string;
  level: number;
  title?: string;
  social_links: Record<string, string>;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Profile creation input
 */
export interface CreateProfileDto {
  bio?: string;
  avatar_url?: string;
  title?: string;
  social_links?: Record<string, string>;
  preferences?: Record<string, any>;
}

/**
 * Profile update input
 */
export interface UpdateProfileDto {
  bio?: string;
  avatar_url?: string;
  title?: string;
  social_links?: Record<string, string>;
  preferences?: Record<string, any>;
}

/**
 * Profile preferences update input
 */
export interface UpdatePreferencesDto {
  preferences: Record<string, any>;
}

/**
 * Public profile view
 */
export interface PublicProfile {
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  level: number;
  title?: string;
  socialLinks: Record<string, string>;
}
