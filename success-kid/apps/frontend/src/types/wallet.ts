export type WalletType = 'phantom' | 'solflare' | 'other';

export interface WalletProvider {
  name: string;
  type: WalletType;
  icon: string;
  url: string;
  mobile?: string; // Deep link for mobile
}

export interface WalletAccount {
  address: string;
  publicKey: string;
  label?: string;
}

export interface WalletBalance {
  tokenAmount: number;
  usdValue?: number;
  lastUpdated: Date;
}

export interface WalletTransaction {
  id: string;
  hash: string;
  type: 'in' | 'out';
  amount: number;
  timestamp: Date;
  fromAddress?: string;
  toAddress?: string;
  status: 'confirmed' | 'pending';
}

export interface Wallet {
  provider: WalletType;
  account: WalletAccount;
  balance: WalletBalance;
  isConnected: boolean;
  isVerified: boolean;
  transactions?: WalletTransaction[];
  isHolder: boolean;
  connectedAt: Date;
}

export interface WalletError {
  code: string;
  message: string;
  details?: any;
}

export enum WalletErrorType {
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SIGNATURE_DECLINED = 'SIGNATURE_DECLINED',
  WRONG_NETWORK = 'WRONG_NETWORK',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface WalletConnectionSession {
  id: string;
  message: string;
  expiresAt: Date;
  qrCodeData?: string;
  deepLink?: string;
}
