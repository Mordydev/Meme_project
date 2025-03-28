/**
 * Wallet Factory
 * 
 * Factory for generating wallet-related instances for testing.
 */
import { v4 as uuidv4 } from 'uuid';
import { createFactory } from './index';
import { userFactory } from './user';

// Define wallet connection model for TypeScript support
export interface WalletConnection {
  id: string;
  userId: string;
  walletAddress: string;
  isVerified: boolean;
  connectedAt: Date;
  lastVerifiedAt?: Date;
}

// Create a wallet connection factory with default values
export const walletConnectionFactory = createFactory<WalletConnection>({
  id: () => uuidv4(),
  userId: () => uuidv4(),
  walletAddress: () => `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
  isVerified: true,
  connectedAt: () => new Date(),
  lastVerifiedAt: () => new Date()
});

// Associate wallet connection with user
export const userWalletConnectionFactory = walletConnectionFactory.association('user', userFactory);

// Define transaction model for testing
export interface Transaction {
  hash: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  timestamp: Date;
  fromAddress: string;
  toAddress: string;
  blockNumber: number;
  status: 'confirmed' | 'pending' | 'failed';
}

// Create a transaction factory
export const transactionFactory = createFactory<Transaction>({
  hash: () => `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
  type: () => {
    const types: ('buy' | 'sell' | 'transfer')[] = ['buy', 'sell', 'transfer'];
    return types[Math.floor(Math.random() * types.length)];
  },
  amount: () => Math.random() * 1000,
  timestamp: () => new Date(),
  fromAddress: () => `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
  toAddress: () => `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
  blockNumber: () => Math.floor(Math.random() * 1000000),
  status: 'confirmed'
});

export default {
  walletConnectionFactory,
  userWalletConnectionFactory,
  transactionFactory
};
