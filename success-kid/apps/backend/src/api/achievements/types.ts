/**
 * Types for the Achievements API module
 */

export interface AchievementParams {
  id: string;
}

export interface UserParams {
  userId: string;
}

export interface AchievementQueryParams {
  category?: string;
  difficulty?: string;
  is_public?: boolean;
  search?: string;
}

export interface UnlockAchievementBody {
  data: {
    userId: string;
  };
}

// --- Types from badge-routes.ts ---

export interface BadgeParams {
  id: string;
}

// Re-using UserParams from achievement-routes.ts

export interface BadgeQueryParams {
  category?: string;
  tier?: string;
  search?: string;
}

export interface BadgeAwardRequest {
  data: {
    userId: string;
    badgeId: string;
    source: string;
    reason?: string;
  };
}

export interface BadgeEquipRequest {
  data: {
    equipped: boolean;
    slot?: number;
  };
}

// --- Types from challenge-routes.ts ---

export interface ChallengeParams {
  id: string;
}

// Re-using UserParams from achievement-routes.ts

export interface ChallengeQueryParams {
  category?: string;
  difficulty?: string;
  status?: string;
  active?: boolean;
}

export interface JoinChallengeRequest {
  data: {
    challengeId: string; // Note: This seems redundant if challenge ID is in the path param
  };
}

export interface ActivityDataRequest {
  data: {
    activityType: string;
    value: number;
    referenceId?: string;
    metadata?: Record<string, any>;
  };
}

// --- Types from leaderboard-routes.ts ---

export interface LeaderboardParams {
  category: string;
  period: string;
}

// Re-using UserParams from achievement-routes.ts

export interface LeaderboardQueryParams {
  limit?: number;
  offset?: number;
}

// --- Types from level-routes.ts ---

// Re-using UserParams from achievement-routes.ts

export interface LevelParams {
  level: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface XpAwardRequest {
  data: {
    amount: number;
    source: string;
    referenceId?: string;
  };
}

// --- Types from streak-routes.ts ---

export interface StreakParams {
  id: string;
}

// Re-using UserParams from achievement-routes.ts

export interface StreakActivityRequest {
  data: {
    activityType: string;
  };
}
