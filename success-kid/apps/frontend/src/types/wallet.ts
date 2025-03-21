/**
 * Wallet Types
 * 
 * Type definitions for wallet integration
 */

export type WalletType = 'phantom' | 'solflare' | 'sollet' | 'other';

export interface WalletProvider {
  name: string;
  type: string;
  icon?: string;
  url: string;
  mobile?: string;
}

export interface WalletAccount {
  address: string;
  publicKey: string;
  derivationPath?: string;
  index?: number;
}

export interface WalletBalance {
  tokenAmount: number;
  usdValue?: number;
  lastUpdated?: Date;
}

export interface WalletTransaction {
  id: string;
  hash: string;
  type: 'in' | 'out' | 'swap' | 'reward';
  amount: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  from: string;
  to: string;
  fee?: number;
  metadata?: {
    title?: string;
    description?: string;
    source?: string;
    [key: string]: any;
  };
}

export interface Wallet {
  provider: string;
  account: WalletAccount;
  balance: WalletBalance;
  transactions?: WalletTransaction[];
  isConnected: boolean;
  isVerified: boolean;
  isHolder: boolean;
  lastVerified?: Date;
  connectedAt: Date;
}
