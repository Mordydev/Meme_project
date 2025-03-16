/**
 * Blockchain Types
 * 
 * This file defines the common types used across blockchain integrations.
 */

/**
 * Blockchain network types
 */
export enum BlockchainNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
}

/**
 * Transaction type
 */
export enum TransactionType {
  IN = 'in',
  OUT = 'out',
  SELF = 'self',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  UNKNOWN = 'unknown',
}

/**
 * Fee estimate type
 */
export interface FeeEstimate {
  low: string;
  medium: string;
  high: string;
  estimatedTime: {
    low: number; // seconds
    medium: number;
    high: number;
  };
}

/**
 * Transaction request
 */
export interface TransactionRequest {
  fromAddress: string;
  toAddress: string;
  amount: string;
  token?: string;
  fee?: string;
  memo?: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  status: TransactionStatus;
  blockNumber?: number;
  timestamp?: Date;
}

/**
 * Transaction data
 */
export interface Transaction {
  hash: string;
  fromAddress?: string;
  toAddress?: string;
  amount: string;
  token: string;
  type: TransactionType;
  fee?: string;
  status: TransactionStatus;
  blockNumber?: number;
  timestamp?: Date;
}

/**
 * Token data
 */
export interface TokenData {
  symbol: string;
  name: string;
  logoUrl?: string;
  decimals: number;
  address: string;
  price?: {
    usd: number;
    lastUpdated: Date;
  };
}

/**
 * Balance data
 */
export interface BalanceData {
  token: string;
  amount: string;
  decimals: number;
  usdValue?: number;
  lastUpdated: Date;
}

/**
 * Verification message data
 */
export interface VerificationMessageData {
  message: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Verification result
 */
export interface VerificationResult {
  verified: boolean;
  address: string;
  timestamp: Date;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  limit?: number;
  offset?: number;
  before?: Date;
  after?: Date;
  token?: string;
  type?: TransactionType;
  status?: TransactionStatus;
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
