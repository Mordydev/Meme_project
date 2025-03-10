/**
 * User wallet model interfaces for the application
 */

/**
 * User wallet verification message model
 */
export interface WalletVerificationMessage {
  id: string;
  userId: string;
  message: string;
  expires: Date;
  createdAt: Date;
}

/**
 * User wallet model
 */
export interface UserWallet {
  id: string;
  userId: string;
  address: string;
  verified: boolean;
  verifiedAt?: Date;
  provider: string;
  connectedAt: Date;
  lastUpdatedAt: Date;
}

/**
 * User token holdings model
 */
export interface UserTokenHoldings {
  id: string;
  userId: string;
  walletId: string;
  tokenAmount: number;
  tier: TokenHolderTier;
  lastCheckedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Token holder tier enum
 */
export enum TokenHolderTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

/**
 * User wallet verification result
 */
export interface WalletVerification {
  userId: string;
  walletAddress: string;
  verified: boolean;
  verifiedAt: Date;
}

/**
 * User token benefits model
 */
export interface UserTokenBenefits {
  holdings: number;
  tier: TokenHolderTier;
  updatedAt: Date;
  benefits: TokenBenefit[];
  multiplier: number;
}

/**
 * Token benefit model
 */
export interface TokenBenefit {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  activatedAt: Date;
}

/**
 * Tier configuration model
 */
export interface TierConfig {
  name: TokenHolderTier;
  threshold: number;
  multiplier: number;
  benefits: string[];
}
