import { PointsSource } from '../../models/entities/points.model';

// --- Request Types ---

export interface PointsAwardRequestData {
  amount: number;
  source: PointsSource;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PointsRedeemRequestData {
  amount: number;
  walletAddress?: string; 
}

export interface TransactionQueryParams {
  limit?: number;
  offset?: number;
  source?: string;
}

export interface TrendsQueryParams {
  period?: 'day' | 'week' | 'month' | 'year';
  // Add other potential filters like 'source'
}

export interface CancelRedemptionParams {
  id: string;
}


// --- Response Types ---

// Basic structure for a point transaction record
export interface PointTransactionResponseItem {
  id: string;
  amount: number;
  source: string;
  referenceId?: string | null;
  createdAt: Date | string; // Keep Date for service, string for API response
  description?: string | null;
}

// Structure for daily/weekly cap status
export interface CapStatus {
  used: number;
  limit: number;
  remaining: number;
  resetsAt?: Date | string; // Keep Date for service, string for API response
}

// Structure for caps per source
export interface SourceCapStatus {
  daily: CapStatus;
  weekly: CapStatus;
}

// Structure for wallet info in balance response
export interface WalletBalanceInfo {
  isConnected: boolean;
  isVerified?: boolean;
  address?: string;
}

// Structure for redemption constants in balance response
export interface RedemptionBalanceInfo {
  conversionRate: number;
  minimumAmount: number;
  weeklyLimit: number;
}

// Structure for the GET /balance response data
export interface BalanceResponseData {
  balance: number;
  transactions: PointTransactionResponseItem[];
  caps: Record<string, SourceCapStatus>;
  wallet: WalletBalanceInfo;
  redemption: RedemptionBalanceInfo;
}

// Structure for pagination metadata
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Structure for GET /transactions response data
export interface TransactionsResponseData {
  data: PointTransactionResponseItem[];
  pagination: PaginationMeta;
}

// Structure for POST /award response data
export interface AwardResponseData {
  success: boolean;
  amount: number;
  newBalance: number;
}

// Structure for redemption status item
export interface RedemptionHistoryItem {
    id: string;
    pointsAmount: number;
    tokenAmount: number;
    status: string; // Consider enum: pending, processing, completed, failed, cancelled
    createdAt: Date | string;
    processedAt?: Date | string | null;
    transactionHash?: string | null;
    walletAddress: string;
}

// Structure for GET /redemptions response data
export interface RedemptionsResponseData {
  data: RedemptionHistoryItem[];
  pagination: PaginationMeta;
}

// Structure for POST /redeem response data (202 Accepted)
export interface RedeemResponseData {
    success: boolean;
    requestId: string;
    pointsAmount: number;
    tokenAmount: number;
    status: string; // Consider enum
    estimatedProcessingTime: string; // ISO Date string
    walletAddress: string;
    conversionRate: number;
}

// Structure for POST /redemptions/:id/cancel response data
export interface CancelRedemptionResponseData {
    success: boolean;
    redemption: {
        id: string;
        status: string; // Should be 'cancelled'
        pointsAmount: number;
        refunded: boolean; // Should be true
    };
}

// Structure for GET /caps response data
export interface CapsResponseData {
    caps: Record<string, SourceCapStatus>;
}

// Structure for GET /redemption/eligibility response data
// TODO: Define this structure based on checkEligibility implementation
export interface EligibilityResponseData {
    isEligible: boolean;
    reasons?: string[]; // Reasons for ineligibility
    checks: {
        hasEnoughPoints: boolean;
        isWalletConnected: boolean;
        isWalletVerified: boolean;
        isWeeklyCapReached: boolean;
    };
    details?: {
        currentBalance?: number;
        minimumPoints?: number;
        walletAddress?: string;
        weeklyUsed?: number;
        weeklyLimit?: number;
    };
}

// Structure for a single data point in trends response
export interface TrendDataPoint {
    date: string; // e.g., 'YYYY-MM-DD' or 'YYYY-WW' or 'YYYY-MM'
    totalPoints: number;
    // Optional breakdown by source
    sources?: Record<string, number>; 
}

// Structure for GET /trends response data
export interface TrendsResponseData {
    period: 'day' | 'week' | 'month' | 'year';
    data: TrendDataPoint[];
}

// Generic API Response Wrapper (Optional but recommended)
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
  pagination?: PaginationMeta; // Only for list endpoints
  errors?: { code: string; message: string }[]; // For error responses
}
