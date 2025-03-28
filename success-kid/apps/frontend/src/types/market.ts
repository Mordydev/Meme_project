/**
 * Market data types for the Success Kid Community Platform
 */

/**
 * Price data point for chart visualization
 */
export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

/**
 * Market milestone definition
 */
export interface Milestone {
  id: string;
  value: number;
  label: string;
  description: string;
  achievedAt?: string;
}

/**
 * Next milestone with progress information
 */
export interface NextMilestone extends Milestone {
  progress: number;
}

/**
 * Market transaction record
 */
export interface MarketTransaction {
  hash: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  price?: number;
  value?: number;
  timestamp: string;
  fromAddress: string;
  toAddress: string;
  isSignificant: boolean;
}

/**
 * Token supply allocation
 */
export interface TokenAllocation {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  description: string;
  color: string;
}

/**
 * Market statistics
 */
export interface MarketStats {
  marketCap: number;
  volume24h: number;
  volume7d: number;
  liquidity: number;
  holders: number;
  trades24h: number;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  allTimeHigh: {
    price: number;
    date: string;
  };
}

/**
 * Market alert definition
 */
export type AlertType = 'price_movement' | 'milestone_reached' | 'volume_spike' | 'holder_change';

/**
 * Alert preference settings
 */
export interface AlertPreferences {
  enabledAlerts: AlertType[];
  customThresholds: {
    priceMovement: number;
    volumeSpike: number;
  };
  notificationMethods: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
}

/**
 * Complete market data
 */
export interface MarketData {
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  prices: PriceDataPoint[];
  volume24h: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  burned: number;
  milestones: Milestone[];
  nextMilestone: NextMilestone;
  allocations: TokenAllocation[];
  stats: MarketStats;
}
