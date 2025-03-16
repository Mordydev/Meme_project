/**
 * Common type definitions for market data features
 */

/**
 * Time period for historical data queries
 */
export type TimePeriod = '1h' | '1d' | '1w' | '1m' | 'all';

/**
 * Data resolution for time-series data
 */
export type DataResolution = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

/**
 * Token price data model
 */
export interface TokenPrice {
  symbol: string;
  priceUsd: number;
  priceChange24h: number;
  priceChange7d?: number;
  volume24h: number;
  lastUpdated: Date;
  source: string;
}

/**
 * Price data point for time-series data
 */
export interface PriceDataPoint {
  timestamp: Date;
  price: number;
  volume?: number;
}

/**
 * Market cap data model
 */
export interface MarketCapData {
  symbol: string;
  marketCap: string;          // Big number as string
  fullyDilutedMarketCap: string;
  circulatingSupply: string;
  totalSupply: string;
  price: number;
  lastUpdated: Date;
}

/**
 * Market cap data point for time-series data
 */
export interface MarketCapDataPoint {
  timestamp: Date;
  marketCap: string;
  price: number;
}

/**
 * Transaction feed item model
 */
export interface TransactionFeedItem {
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  type: 'buy' | 'sell' | 'transfer' | 'liquidity' | 'other';
  amount: string;            // Token amount as string
  amountUsd: number;
  fromAddress: string;
  toAddress: string;
  signerLabel?: string;      // Known wallet label if available
  isSignificant: boolean;    // Flagged as large transaction
}

/**
 * Milestone definition model
 */
export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetValue: string;       // Market cap target as string
  type: 'marketCap' | 'price' | 'holders';
  achieved: boolean;
  achievedAt?: Date;
  nextMilestoneId?: string;
  previousMilestoneId?: string;
}

/**
 * Milestone progress data
 */
export interface MilestoneProgress {
  milestone: Milestone;
  currentValue: string;
  percentComplete: number;
  remaining: string;
}

/**
 * Market trend data
 */
export interface MarketTrend {
  symbol: string;
  period: TimePeriod;
  direction: 'up' | 'down' | 'sideways';
  strength: number;  // 0-1 scale
  startPrice: number;
  currentPrice: number;
  percentChange: number;
  startTime: Date;
  indicators: Record<string, number>;  // Technical indicators
}

/**
 * Chart data for visualizations
 */
export interface ChartData {
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  options?: ChartOptions;
  annotations?: ChartAnnotation[];
}

/**
 * Chart dataset for visualizations
 */
export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
  borderDash?: number[];
}

/**
 * Chart options for visualizations
 */
export interface ChartOptions {
  scales?: Record<string, any>;
  plugins?: Record<string, any>;
  animation?: boolean | Record<string, any>;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

/**
 * Chart annotation for visualizations
 */
export interface ChartAnnotation {
  type: string;
  mode: string;
  scaleID: string;
  value: string | number;
  borderColor: string;
  label?: {
    content: string;
    enabled: boolean;
  };
}

/**
 * Options for transaction feed queries
 */
export interface TransactionFeedOptions {
  limit?: number;
  offset?: number;
  types?: string[];
  minAmount?: number;
  fromTimestamp?: Date;
  toTimestamp?: Date;
  significantOnly?: boolean;
}

/**
 * Pagination result wrapper
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

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  staleTtl?: number;
  namespace?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  name: string;
  priority: number;
  capabilities: string[];
  rateLimit: {
    requests: number;
    period: number;  // in seconds
  };
  timeout: number;   // in milliseconds
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  isHealthy: boolean;
  lastCheck: Date;
  errorCount: number;
  avgResponseTime: number;
}
