/**
 * Points Fixtures
 * 
 * Provides standard test data for points system
 */
import { v4 as uuid } from 'uuid';
import { testUsers } from './users';

// Test points transactions
export const testPointsTransactions = {
  /**
   * Content creation points transaction
   */
  contentCreationPoints: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    amount: 50,
    source: 'content_creation',
    reference_id: uuid(),
    description: 'Points awarded for creating a new post',
    created_at: new Date('2023-06-10T15:30:00.000Z'),
  },
  
  /**
   * Comment points transaction
   */
  commentPoints: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    amount: 10,
    source: 'comment',
    reference_id: uuid(),
    description: 'Points awarded for commenting on a post',
    created_at: new Date('2023-06-11T09:45:00.000Z'),
  },
  
  /**
   * Daily login points transaction
   */
  loginPoints: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    amount: 5,
    source: 'daily_login',
    reference_id: null,
    description: 'Daily login bonus',
    created_at: new Date('2023-06-12T08:05:00.000Z'),
  },
  
  /**
   * Referral points transaction
   */
  referralPoints: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    amount: 100,
    source: 'referral',
    reference_id: testUsers.newUser.id,
    description: 'Referral bonus for inviting a new user',
    created_at: new Date('2023-06-15T14:20:00.000Z'),
  },
  
  /**
   * Redemption points transaction (negative)
   */
  redemptionPoints: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    amount: -1000,
    source: 'redemption',
    reference_id: uuid(),
    description: 'Points redeemed for tokens',
    created_at: new Date('2023-06-20T16:45:00.000Z'),
  },
};

// Test points transactions for users
export const userPointsTransactions = {
  // Standard user points
  [testUsers.standardUser.id]: [
    testPointsTransactions.contentCreationPoints,
    testPointsTransactions.commentPoints,
    testPointsTransactions.loginPoints,
    testPointsTransactions.referralPoints,
    testPointsTransactions.redemptionPoints,
  ],
  
  // Admin user points
  [testUsers.adminUser.id]: [
    {
      id: uuid(),
      user_id: testUsers.adminUser.id,
      amount: 100,
      source: 'content_creation',
      reference_id: uuid(),
      description: 'Points awarded for creating a new post',
      created_at: new Date('2023-05-10T10:30:00.000Z'),
    },
    {
      id: uuid(),
      user_id: testUsers.adminUser.id,
      amount: 5000,
      source: 'admin_bonus',
      reference_id: null,
      description: 'Admin bonus points',
      created_at: new Date('2023-05-15T11:20:00.000Z'),
    },
  ],
  
  // New user points
  [testUsers.newUser.id]: [
    {
      id: uuid(),
      user_id: testUsers.newUser.id,
      amount: 100,
      source: 'welcome_bonus',
      reference_id: null,
      description: 'Welcome bonus for new users',
      created_at: new Date('2023-06-01T12:10:00.000Z'),
    },
  ],
};

// Points sources and values
export const pointsSources = {
  content_creation: 50,
  comment: 10,
  like: 2,
  daily_login: 5,
  streak_bonus: 20,
  referral: 100,
  welcome_bonus: 100,
  achievement: 25,
};

// Daily points limits
export const dailyPointsLimits = {
  content_creation: 200,
  comment: 50,
  like: 20,
  login: 5,
  total: 500,
};

/**
 * Get points balance for a user
 */
export function getPointsBalanceForUser(userId: string): number {
  const transactions = userPointsTransactions[userId] || [];
  return transactions.reduce((total, tx) => total + tx.amount, 0);
}

/**
 * Get points transactions for a user
 */
export function getPointsTransactionsForUser(userId: string): any[] {
  return userPointsTransactions[userId] || [];
}

/**
 * Get points leaderboard
 */
export function getPointsLeaderboard(): any[] {
  return Object.entries(userPointsTransactions).map(([userId, transactions]) => {
    const user = Object.values(testUsers).find(u => u.id === userId);
    const balance = transactions.reduce((total, tx) => total + tx.amount, 0);
    
    return {
      user_id: userId,
      display_name: user?.display_name || 'Unknown User',
      profile_image: user?.profile_image || '',
      level: user?.level || 1,
      points_balance: balance,
    };
  }).sort((a, b) => b.points_balance - a.points_balance);
}
