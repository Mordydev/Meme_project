/**
 * Wallet Factory
 * 
 * Provides functions for creating test wallet data
 */
import { v4 as uuid } from 'uuid';

/**
 * Wallet connection creation parameters
 */
export interface CreateWalletConnectionParams {
  id?: string;
  userId: string;
  walletAddress: string;
  isVerified?: boolean;
  connectedAt?: Date;
  lastVerifiedAt?: Date;
}

/**
 * Create a test wallet connection
 */
export function createWalletConnection(params: CreateWalletConnectionParams): any {
  const now = new Date();
  
  return {
    id: params.id || uuid(),
    user_id: params.userId,
    wallet_address: params.walletAddress,
    is_verified: params.isVerified ?? true,
    connected_at: params.connectedAt || now,
    last_verified_at: params.lastVerifiedAt || now,
  };
}

/**
 * Generate a random wallet address for testing
 */
export function generateWalletAddress(): string {
  // Generate a random Solana-like wallet address
  return `${randomHexString(32)}`;
}

/**
 * Generate a random transaction hash for testing
 */
export function generateTransactionHash(): string {
  // Generate a random transaction hash
  return randomHexString(64);
}

/**
 * Generate a random verification message
 */
export function generateVerificationMessage(userId: string, walletAddress: string): string {
  return `I am connecting wallet ${walletAddress} to Success Kid account ${userId} at ${new Date().toISOString()}`;
}

/**
 * Create a wallet verification signature
 */
export function createWalletSignature(message: string): string {
  // In a real implementation, this would actually sign the message
  // For testing, we just return a fixed signature based on the message
  return `signature_${Buffer.from(message).toString('base64').substring(0, 16)}`;
}

/**
 * Create wallet transaction data
 */
export interface CreateWalletTransactionParams {
  id?: string;
  userId: string;
  walletAddress: string;
  transactionHash: string;
  amount: number;
  direction: 'in' | 'out';
  status?: 'pending' | 'completed' | 'failed';
  createdAt?: Date;
  completedAt?: Date;
}

/**
 * Create a test wallet transaction
 */
export function createWalletTransaction(params: CreateWalletTransactionParams): any {
  const now = new Date();
  
  return {
    id: params.id || uuid(),
    user_id: params.userId,
    wallet_address: params.walletAddress,
    transaction_hash: params.transactionHash || generateTransactionHash(),
    amount: params.amount,
    direction: params.direction,
    status: params.status || 'completed',
    created_at: params.createdAt || now,
    completed_at: params.completedAt || now,
  };
}

// Helper function to generate random hex string
function randomHexString(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
