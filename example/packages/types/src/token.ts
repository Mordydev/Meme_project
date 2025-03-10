/**
 * Token types for the Wild 'n Out platform
 */

export interface TokenInfo {
  price: number;
  marketCap: number;
  circulatingSupply: number;
  holders: number;
  lastUpdated: Date;
}

export interface TokenMilestone {
  id: string;
  targetMarketCap: number;
  name: string;
  description: string;
  achieved: boolean;
  achievedAt?: Date;
  nextMilestoneId?: string;
}

export interface TokenTransaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
  blockNumber: number;
}

export interface UserTokenBalance {
  userId: string;
  walletAddress: string;
  balance: number;
  lastVerified: Date;
  holderTier: 'bronze' | 'silver' | 'gold' | 'platinum';
}
