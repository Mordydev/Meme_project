/**
 * Transaction Model
 * 
 * This module defines the data models for market transactions.
 */

/**
 * Transaction feed item model
 */
export interface TransactionFeedItem {
  id?: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  type: TransactionType;
  amount: string;             // Token amount as string
  amountUsd?: number;
  fromAddress: string;
  toAddress: string;
  signerLabel?: string;       // Known wallet label if available
  isSignificant: boolean;     // Flagged as large transaction
  symbol?: string;            // Token symbol
}

/**
 * Transaction type enum
 */
export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  TRANSFER = 'transfer',
  LIQUIDITY_ADD = 'liquidity_add',
  LIQUIDITY_REMOVE = 'liquidity_remove',
  OTHER = 'other'
}

/**
 * Transaction feed filter options
 */
export interface TransactionFeedOptions {
  limit?: number;
  offset?: number;
  types?: TransactionType[];
  minAmount?: number;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  significantOnly?: boolean;
  symbol?: string;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated transaction result
 */
export interface PaginatedTransactionResult {
  data: TransactionFeedItem[];
  pagination: PaginationInfo;
}

/**
 * Transaction volume data
 */
export interface VolumeData {
  symbol: string;
  period: string;
  volume: string;
  volumeUsd?: number;
  buys: number;
  sells: number;
  buyVolume: string;
  sellVolume: string;
  largestTx: string;
  timestamp: Date;
}

/**
 * Volume data point
 */
export interface VolumeDataPoint {
  timestamp: Date;
  volume: string;
  volumeUsd?: number;
}
