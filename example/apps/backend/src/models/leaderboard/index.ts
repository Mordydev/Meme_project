/**
 * Leaderboard models for the database
 */

export enum LeaderboardCategory {
  POINTS = 'points',
  BATTLE_WINS = 'battle_wins',
  BATTLE_PARTICIPATION = 'battle_participation',
  CONTENT_CREATION = 'content_creation',
  CONTENT_ENGAGEMENT = 'content_engagement',
  ACHIEVEMENTS = 'achievements'
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time'
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  score: number;
  rank: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  total: number;
  userRank?: {
    rank: number;
    score: number;
  };
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
}

export interface LeaderboardOptions {
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
  userId?: string; // Include user's own rank
}

// Map of categories to database query configuration
export const LEADERBOARD_QUERY_CONFIG: Record<LeaderboardCategory, {
  table: string;
  scoreField: string;
  joins?: string[];
  conditions?: string[];
  groupBy?: string[];
}> = {
  [LeaderboardCategory.POINTS]: {
    table: 'user_points',
    scoreField: 'total_points',
    conditions: ['deleted_at IS NULL']
  },
  [LeaderboardCategory.BATTLE_WINS]: {
    table: 'battle_entries',
    scoreField: 'COUNT(*)',
    joins: ['JOIN battles ON battle_entries.battle_id = battles.id'],
    conditions: ['battle_entries.rank = 1', 'battles.status = \'completed\''],
    groupBy: ['battle_entries.user_id']
  },
  [LeaderboardCategory.BATTLE_PARTICIPATION]: {
    table: 'battle_entries',
    scoreField: 'COUNT(*)',
    joins: ['JOIN battles ON battle_entries.battle_id = battles.id'],
    conditions: ['battles.status = \'completed\''],
    groupBy: ['battle_entries.user_id']
  },
  [LeaderboardCategory.CONTENT_CREATION]: {
    table: 'content',
    scoreField: 'COUNT(*)',
    conditions: ['deleted_at IS NULL'],
    groupBy: ['creator_id']
  },
  [LeaderboardCategory.CONTENT_ENGAGEMENT]: {
    table: 'content_reactions',
    scoreField: 'COUNT(*)',
    joins: ['JOIN content ON content_reactions.content_id = content.id'],
    conditions: ['content.deleted_at IS NULL'],
    groupBy: ['content.creator_id']
  },
  [LeaderboardCategory.ACHIEVEMENTS]: {
    table: 'user_achievements',
    scoreField: 'COUNT(*)',
    conditions: ['unlocked_at IS NOT NULL'],
    groupBy: ['user_id']
  }
};
