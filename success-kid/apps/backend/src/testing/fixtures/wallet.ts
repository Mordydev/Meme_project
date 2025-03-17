/**
 * Wallet Fixtures
 * 
 * Provides standard test data for wallet functionality
 */
import { v4 as uuid } from 'uuid';
import { testUsers } from './users';

// Generate test wallet addresses
const testWalletAddresses = {
  standardUser: '5FHwkrdxb2S9W6qoga3qpjANS3hsEMECQqn2xz8Ga2z5',
  adminUser: '9ZbvPJ7MJ3RrDEpySWG3v3g7xJKvLgQX1Ufv4m7fSYbY',
  highLevelUser: 'B4T2qYoHhUFGV5tC9GMfpxqBK3pQCjbUQGJk5SeHx1WV',
};

// Test wallet connections
export const testWalletConnections = {
  /**
   * Standard user wallet connection
   */
  standardUserWallet: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    wallet_address: testWalletAddresses.standardUser,
    is_verified: true,
    connected_at: new Date('2023-06-01T12:30:00.000Z'),
    last_verified_at: new Date('2023-06-01T12:35:00.000Z'),
  },
  
  /**
   * Admin user wallet connection
   */
  adminUserWallet: {
    id: uuid(),
    user_id: testUsers.adminUser.id,
    wallet_address: testWalletAddresses.adminUser,
    is_verified: true,
    connected_at: new Date('2022-12-15T09:20:00.000Z'),
    last_verified_at: new Date('2023-05-10T15:45:00.000Z'),
  },
  
  /**
   * High-level user wallet connection
   */
  highLevelUserWallet: {
    id: uuid(),
    user_id: testUsers.highLevelUser.id,
    wallet_address: testWalletAddresses.highLevelUser,
    is_verified: true,
    connected_at: new Date('2023-02-20T14:10:00.000Z'),
    last_verified_at: new Date('2023-06-05T11:25:00.000Z'),
  },
};

// Test wallet balances
export const testWalletBalances = {
  [testWalletAddresses.standardUser]: 150.5,
  [testWalletAddresses.adminUser]: 5000.0,
  [testWalletAddresses.highLevelUser]: 750.25,
};

// Test wallet transactions
export const testWalletTransactions = {
  /**
   * Redemption transaction
   */
  redemptionTransaction: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    wallet_address: testWalletAddresses.standardUser,
    transaction_hash: '49qb8EDcUBGNaRRPkN1xM6rQsQQQKNRTBwXjPx4SkEr5u7qG7iQFKriR2VjvQ4y7NExcyLc2Bx5TE3nGe9yBWuSA',
    amount: 10.0,
    direction: 'in',
    status: 'completed',
    created_at: new Date('2023-06-20T16:45:00.000Z'),
    completed_at: new Date('2023-06-20T16:46:30.000Z'),
  },
  
  /**
   * Transfer transaction
   */
  transferTransaction: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    wallet_address: testWalletAddresses.standardUser,
    transaction_hash: '4AKRHTaAL5DCrQRxnwsZ5nPJMcu8JvqKzH3RKfvmKYWApDETo8zw9DnXBk6gY9onFUXyEFjtB2TmjCvGQJeuexTJ',
    amount: 5.5,
    direction: 'out',
    status: 'completed',
    created_at: new Date('2023-06-25T10:15:00.000Z'),
    completed_at: new Date('2023-06-25T10:16:45.000Z'),
  },
};

// User wallet transactions
export const userWalletTransactions = {
  // Standard user transactions
  [testUsers.standardUser.id]: [
    testWalletTransactions.redemptionTransaction,
    testWalletTransactions.transferTransaction,
  ],
  
  // Admin user transactions
  [testUsers.adminUser.id]: [
    {
      id: uuid(),
      user_id: testUsers.adminUser.id,
      wallet_address: testWalletAddresses.adminUser,
      transaction_hash: '2YNuWnjVgXJu8RgL9MXr5oFACN4UZB4G1FXXBqhZDKNbpjtCxqKbC8Vft7JQMB3pUMfCTnm7St8iJnBSHVMTGkcY',
      amount: 500.0,
      direction: 'in',
      status: 'completed',
      created_at: new Date('2023-05-15T11:20:00.000Z'),
      completed_at: new Date('2023-05-15T11:21:30.000Z'),
    },
  ],
  
  // High-level user transactions
  [testUsers.highLevelUser.id]: [
    {
      id: uuid(),
      user_id: testUsers.highLevelUser.id,
      wallet_address: testWalletAddresses.highLevelUser,
      transaction_hash: '3VQRCw1fGHY4pjkScmUiTaGNLvYoF9kBX9gLZ6qh7XM2yPRB8KxfB5H7sRzVGKCNdABDWUfE9NMUQ4aK3mYhHVzV',
      amount: 100.25,
      direction: 'in',
      status: 'completed',
      created_at: new Date('2023-06-10T09:30:00.000Z'),
      completed_at: new Date('2023-06-10T09:31:15.000Z'),
    },
  ],
};

/**
 * Generate verification message for a wallet
 */
export function generateVerificationMessage(userId: string, walletAddress: string): string {
  return `I am connecting wallet ${walletAddress} to Success Kid account ${userId} at ${new Date().toISOString()}`;
}

/**
 * Get wallet connections for a user
 */
export function getWalletConnectionsForUser(userId: string): any[] {
  return Object.values(testWalletConnections).filter(
    connection => connection.user_id === userId
  );
}

/**
 * Get wallet transactions for a user
 */
export function getWalletTransactionsForUser(userId: string): any[] {
  return userWalletTransactions[userId] || [];
}

/**
 * Get wallet balance for address
 */
export function getWalletBalance(walletAddress: string): number {
  return testWalletBalances[walletAddress] || 0;
}
