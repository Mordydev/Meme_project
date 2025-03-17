/**
 * Points Rules Configuration
 * 
 * Centralized configuration for the Success Points economy, including earning rules,
 * caps, redemption rates, and activity verification settings.
 */
import { PointsSource } from '../models/user-points';

/**
 * Activity rule interface
 */
export interface ActivityRule {
  points: number;             // Base points awarded for the activity
  limit: number;              // Maximum number of times per period
  period: 'once' | 'daily' | 'weekly' | 'monthly' | 'lifetime'; // Limit period
  description: string;        // User-friendly description
  verification: 'none' | 'basic' | 'strict'; // Verification level required
  bonusMultiplier?: number;   // Optional multiplier for quality content
  requiresApproval?: boolean; // Whether manual approval is required
}

/**
 * Points rules configuration
 */
export const pointsRules: Record<PointsSource, ActivityRule> = {
  content_creation: {
    points: 50,
    limit: 4,
    period: 'daily',
    description: 'Creating original content',
    verification: 'basic',
    bonusMultiplier: 4, // For quality content (up to 4x)
  },
  comment: {
    points: 15,
    limit: 10,
    period: 'daily',
    description: 'Posting comments',
    verification: 'basic',
  },
  upvote_received: {
    points: 5,
    limit: 20,
    period: 'daily',
    description: 'Receiving upvotes on your content',
    verification: 'basic',
  },
  daily_login: {
    points: 20,
    limit: 1,
    period: 'daily',
    description: 'Logging in each day',
    verification: 'none',
  },
  achievement: {
    points: 100, // Base value, actual amounts vary by achievement
    limit: 0, // No limit
    period: 'once',
    description: 'Completing achievements',
    verification: 'none',
  },
  referral: {
    points: 500,
    limit: 0, // No inherent limit, but verification is strict
    period: 'once', // Per unique referral
    description: 'Referring new users who sign up',
    verification: 'strict',
  },
  profile_completion: {
    points: 100,
    limit: 1,
    period: 'lifetime',
    description: 'Completing your profile',
    verification: 'basic',
  },
  wallet_connection: {
    points: 50,
    limit: 1,
    period: 'once', // Per unique wallet
    description: 'Connecting a wallet',
    verification: 'strict',
  },
  streak_bonus: {
    points: 10, // Base value, multiplied by streak days (up to max)
    limit: 1,
    period: 'daily',
    description: 'Consecutive daily activity bonus',
    verification: 'basic',
  },
  transfer_in: {
    points: 0, // Points transferring between users
    limit: 0, 
    period: 'daily',
    description: 'Receiving points from another user',
    verification: 'strict',
  },
  transfer_out: {
    points: 0, // Points transferring between users (negative transaction)
    limit: 0,
    period: 'daily',
    description: 'Sending points to another user',
    verification: 'strict',
  },
  redemption: {
    points: 0, // Always negative, amount determined by redemption
    limit: 0,
    period: 'weekly',
    description: 'Redeeming points for tokens',
    verification: 'strict',
  },
  special_event: {
    points: 100, // Base value, actual amounts vary by event
    limit: 0, // Limit defined per-event
    period: 'once',
    description: 'Participating in special events',
    verification: 'basic',
    requiresApproval: true,
  },
  admin_adjustment: {
    points: 0, // Amount determined by admin
    limit: 0,
    period: 'once',
    description: 'Manual adjustment by administrators',
    verification: 'none',
    requiresApproval: true,
  },
};

/**
 * Redemption configuration
 */
export const redemptionConfig = {
  minimumAmount: 1000, // Minimum 1,000 points (10 tokens)
  weeklyLimit: 10000,  // Maximum 10,000 points (100 tokens) per week
  conversionRate: 100, // 100 points = 1 token
  processingTime: '24 hours', // Estimated processing time
  autoApproveThreshold: 5000, // Auto-approve redemptions up to 5,000 points (50 tokens)
  maxPendingRedemptions: 3, // Maximum number of pending redemptions per user
};

/**
 * Special event configuration
 */
export const specialEvents: Record<string, {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  pointsMultiplier: number;
  description: string;
  isActive: boolean;
}> = {
  launch_week: {
    id: 'launch_week',
    name: 'Launch Week Celebration',
    startDate: new Date('2025-04-01T00:00:00Z'),
    endDate: new Date('2025-04-07T23:59:59Z'),
    pointsMultiplier: 2.0,
    description: 'Double points for all activities during launch week!',
    isActive: true,
  },
  // Additional events can be defined here
};

/**
 * Check if a special event is currently active
 * 
 * @param eventId - Event ID to check
 * @returns True if the event is active
 */
export function isEventActive(eventId: string): boolean {
  const event = specialEvents[eventId];
  
  if (!event || !event.isActive) {
    return false;
  }
  
  const now = new Date();
  return now >= event.startDate && now <= event.endDate;
}

/**
 * Get all currently active special events
 * 
 * @returns Active special events
 */
export function getActiveEvents(): typeof specialEvents {
  const now = new Date();
  const activeEvents: typeof specialEvents = {};
  
  Object.entries(specialEvents).forEach(([id, event]) => {
    if (event.isActive && now >= event.startDate && now <= event.endDate) {
      activeEvents[id] = event;
    }
  });
  
  return activeEvents;
}

/**
 * Get the current points multiplier based on active events
 * 
 * @returns Current points multiplier (default: 1.0)
 */
export function getCurrentPointsMultiplier(): number {
  const activeEvents = getActiveEvents();
  
  if (Object.keys(activeEvents).length === 0) {
    return 1.0;
  }
  
  // Use the highest multiplier among active events
  return Math.max(...Object.values(activeEvents).map(event => event.pointsMultiplier));
}
