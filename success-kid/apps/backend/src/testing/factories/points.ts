/**
 * Points Factory
 * 
 * Factory for generating points-related instances for testing.
 */
import { v4 as uuidv4 } from 'uuid';
import { createFactory } from './index';
import { userFactory } from './user';

// Define points transaction model for TypeScript support
export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  source: string;
  referenceId?: string;
  createdAt: Date;
  description?: string;
}

// Create a points transaction factory with default values
export const pointsTransactionFactory = createFactory<PointsTransaction>({
  id: () => uuidv4(),
  userId: () => uuidv4(),
  amount: () => Math.floor(Math.random() * 100) + 1,
  source: () => {
    const sources = ['content_creation', 'comment', 'daily_login', 'achievement', 'referral'];
    return sources[Math.floor(Math.random() * sources.length)];
  },
  referenceId: () => uuidv4(),
  createdAt: () => new Date(),
  description: () => 'Test points transaction'
});

// Associate points transaction with user
export const userPointsTransactionFactory = pointsTransactionFactory.association('user', userFactory);

// Create a factory for generating user balances
export interface UserPointsBalance {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastUpdated: Date;
}

export const userPointsBalanceFactory = createFactory<UserPointsBalance>({
  userId: () => uuidv4(),
  balance: () => Math.floor(Math.random() * 10000),
  lifetimeEarned: () => Math.floor(Math.random() * 50000),
  lifetimeSpent: () => Math.floor(Math.random() * 20000),
  lastUpdated: () => new Date()
});

export default {
  pointsTransactionFactory,
  userPointsTransactionFactory,
  userPointsBalanceFactory
};
