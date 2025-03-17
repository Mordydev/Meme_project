/**
 * Wallet-related type definitions
 */

export interface WalletConnection {
  id: string;
  userId: string;
  walletAddress: string;
  isVerified: boolean;
  connectedAt: string;
  lastVerifiedAt?: string;
  provider: WalletProvider;
  network: string;
}

export enum WalletProvider {
  PHANTOM = 'phantom',
  SOLFLARE = 'solflare',
  OTHER = 'other'
}

export interface WalletBalance {
  walletAddress: string;
  tokenBalance: number;
  tokenValue: number;
  lastUpdated: string;
}

export interface WalletTransaction {
  hash: string;
  walletAddress: string;
  type: TransactionType;
  amount: number;
  timestamp: string;
  status: TransactionStatus;
  blockNumber?: number;
  fee?: number;
}

export enum TransactionType {
  SEND = 'send',
  RECEIVE = 'receive',
  SWAP = 'swap',
  STAKE = 'stake',
  REDEMPTION = 'redemption'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

export interface ConnectWalletRequest {
  walletAddress: string;
  provider: WalletProvider;
  network: string;
  signature?: string;
  message?: string;
}

export interface VerifyWalletRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface WalletTransactionRequest {
  walletAddress?: string;
  types?: TransactionType[];
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface WalletTransferRequest {
  recipientAddress: string;
  amount: number;
  memo?: string;
}

export interface WalletTransferResponse {
  transactionId: string;
  status: TransactionStatus;
  timestamp: string;
  details?: {
    hash?: string;
    blockNumber?: number;
    fee?: number;
  };
}
