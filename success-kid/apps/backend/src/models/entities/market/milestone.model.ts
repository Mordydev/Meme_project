/**
 * Milestone Model
 * 
 * This module defines the data models for market milestones.
 */

/**
 * Milestone definition model
 */
export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetValue: string;       // Market cap target as string
  type: MilestoneType;
  achieved: boolean;
  achievedAt?: Date;
  nextMilestoneId?: string;
  previousMilestoneId?: string;
  icon?: string;             // URL or identifier for milestone icon
}

/**
 * Milestone type enum
 */
export enum MilestoneType {
  MARKET_CAP = 'marketCap',
  PRICE = 'price',
  HOLDERS = 'holders'
}

/**
 * Milestone progress data
 */
export interface MilestoneProgress {
  milestone: Milestone;
  currentValue: string;
  percentComplete: number;
  valueRemaining: string;
  estimatedTimeToReach?: Date;
}

/**
 * Milestone celebration data
 */
export interface MilestoneCelebration {
  milestone: Milestone;
  achievedAt: Date;
  previousValue: string;
  nextMilestone?: Milestone;
  contributors: number;      // Number of contributing users
  timeTaken?: number;        // Time taken to reach in days
}

/**
 * Database milestone entity
 */
export interface MilestoneEntity {
  id: string;
  name: string;
  description: string;
  target_value: string;
  type: string;
  achieved: boolean;
  achieved_at?: Date;
  next_milestone_id?: string;
  previous_milestone_id?: string;
  icon?: string;
  created_at: Date;
  updated_at: Date;
}
