/**
 * Points Factory
 * 
 * Provides functions for creating test points data
 */
import { v4 as uuid } from 'uuid';

/**
 * Points transaction creation parameters
 */
export interface CreatePointsTransactionParams {
  id?: string;
  userId: string;
  amount: number;
  source?: string;
  referenceId?: string;
  description?: string;
  createdAt?: Date;
}

/**
 * Create a test points transaction
 */
export function createPointsTransaction(params: CreatePointsTransactionParams): any {
  return {
    id: params.id || uuid(),
    user_id: params.userId,
    amount: params.amount,
    source: params.source || 'test',
    reference_id: params.referenceId || null,
    description: params.description || `Test transaction of ${params.amount} points`,
    created_at: params.createdAt || new Date(),
  };
}

/**
 * Create multiple test points transactions
 */
export function createPointsTransactions(count: number, baseParams: Omit<CreatePointsTransactionParams, 'amount'>): any[] {
  const transactions = [];
  
  for (let i = 0; i < count; i++) {
    // Generate varying amounts between 10 and 100
    const amount = Math.floor(Math.random() * 91) + 10;
    
    transactions.push(createPointsTransaction({
      ...baseParams,
      amount,
      createdAt: new Date(Date.now() - i * 3600000), // Spread out over time
    }));
  }
  
  return transactions;
}

/**
 * Generate a points balance for a user
 */
export function createPointsBalance(userId: string, transactions: any[] = []): any {
  // Calculate total from transactions
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  return {
    user_id: userId,
    balance: total,
    transactions,
  };
}

/**
 * Create a complete points history for a user
 */
export function createPointsHistory(userId: string, numTransactions: number = 10): any {
  const transactions = createPointsTransactions(numTransactions, { userId });
  return createPointsBalance(userId, transactions);
}
