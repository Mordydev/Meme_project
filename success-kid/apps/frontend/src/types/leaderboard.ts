/**
 * Leaderboard and Competition types
 */

/**
 * Time periods for leaderboards and competitions
 */
export type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'all-time';

/**
 * Leaderboard categories
 */
export type LeaderboardCategory = 'points' | 'content' | 'comments' | 'achievements' | 'referrals';

/**
 * User ranking on a leaderboard
 */
export interface RankedUser {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  score: number;
  change?: number; // Position change since last period
  badges?: string[]; // Achievement badges to display
}

/**
 * Current user's rank information
 */
export interface CurrentUserRank {
  rank: number;
  score: number;
  change?: number;
  nextRankDifference?: number; // Points needed to reach next rank
}

/**
 * Historical ranking data point
 */
export interface RankHistoryPoint {
  date: string;
  rank: number;
  score: number;
}

/**
 * Category-specific performance metrics
 */
export interface CategoryBreakdown {
  [category: string]: {
    currentRank: number;
    bestRank: number;
    totalScore: number;
  };
}

/**
 * Personal ranking goal
 */
export interface RankingGoal {
  targetRank: number;
  category: LeaderboardCategory;
  deadline?: string;
  progress: number;
}

/**
 * Competition statuses
 */
export type CompetitionStatus = 'active' | 'upcoming' | 'past';

/**
 * Competition reward
 */
export interface CompetitionReward {
  rank: number | string; // Number for specific rank, string for ranges like "top 10"
  type: 'points' | 'badge' | 'token';
  value: number | string;
  description: string;
}

/**
 * Competition objective
 */
export interface CompetitionObjective {
  id: string;
  description: string;
  target: number;
  type: 'posts' | 'comments' | 'achievements' | 'custom';
  currentProgress?: number;
}

/**
 * Participant progress in a competition
 */
export interface ParticipantProgress {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  progress: Record<string, number>; // Objective ID -> progress
}

/**
 * User participation status in a competition
 */
export type ParticipationStatus = 'participating' | 'eligible' | 'ineligible';

/**
 * Competition summary information
 */
export interface CompetitionSummary {
  id: string;
  title: string;
  description: string;
  status: CompetitionStatus;
  startDate: string;
  endDate: string;
  participantCount: number;
  isTeamBased: boolean;
  rewards: CompetitionReward[];
  userStatus?: ParticipationStatus;
}

/**
 * Detailed competition information
 */
export interface Competition extends CompetitionSummary {
  rules: string;
  objectives: CompetitionObjective[];
  leaderboard?: ParticipantProgress[];
  userProgress?: {
    isParticipating: boolean;
    currentRank?: number;
    score?: number;
    progress?: Record<string, number>;
  };
}

/**
 * Team in a competition
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  score: number;
  rank?: number;
  change?: number;
}

/**
 * Team member information
 */
export interface TeamMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: string;
  contribution: number; // Percentage of team score
}
