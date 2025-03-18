/**
 * Redemption Models
 * 
 * Interfaces and types for the redemption system.
 */

/**
 * Redemption Status Enum
 */
export enum RedemptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PENDING_CONFIRMATION = 'pending_confirmation',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Transaction Receipt Interface
 */
export interface TransactionReceipt {
  blockNumber: number;
  confirmations: number;
  timestamp: Date;
  fee: string;
}

/**
 * Redemption Transaction Interface
 */
export interface RedemptionTransaction {
  id: string;
  redemptionId: string;
  userId: string;
  walletAddress: string;
  pointsAmount: number;
  tokenAmount: number;
  status: RedemptionStatus;
  transactionHash?: string;
  error?: string;
  receipt?: TransactionReceipt;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

/**
 * Redemption Eligibility Interface
 */
export interface RedemptionEligibility {
  eligible: boolean;
  reasons?: string[];
  limits: {
    weekly: {
      limit: number;
      used: number;
      remaining: number;
    };
    minimum: number;
  };
  walletVerified: boolean;
  accountStatus: string;
}

/**
 * Conversion Rate Interface
 */
export interface ConversionRate {
  conversionRate: number;
  pointsToToken: string;
  limits: {
    minimum: number;
    weekly: number;
  };
}

/**
 * Redemption Interface
 */
export interface Redemption {
  id: string;
  userId: string;
  walletAddress: string;
  pointsAmount: number;
  tokenAmount: number;
  status: RedemptionStatus;
  transactionId?: string;
  transactionHash?: string;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

/**
 * New Redemption Request Interface
 */
export interface NewRedemptionRequest {
  pointsAmount: number;
  walletAddress: string;
  referenceId?: string;
}

/**
 * Pagination Options Interface
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Pagination Result Interface
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
