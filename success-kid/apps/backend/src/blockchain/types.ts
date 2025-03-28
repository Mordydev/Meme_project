/**
 * Blockchain Types
 * 
 * Common interfaces and types for blockchain integration.
 */

/**
 * Solana Network Enum
 */
export enum SolanaNetwork {
  MAINNET = 'mainnet-beta',
  DEVNET = 'devnet',
  TESTNET = 'testnet'
}

/**
 * Provider Priority Enum
 */
export enum ProviderPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

/**
 * Provider Options Interface
 */
export interface ProviderOptions {
  priority: ProviderPriority;
  networks: SolanaNetwork[];
  apiKey?: string;
}

/**
 * Provider Status Interface
 */
export interface ProviderStatus {
  id: string;
  name: string;
  isAvailable: boolean;
  lastChecked: Date;
  latency: number;
  errorCount: number;
  circuitOpen: boolean;
  circuitResetTime: Date | null;
}

/**
 * Blockchain Provider Interface
 * 
 * Common interface for all blockchain data providers
 */
export interface BlockchainProvider {
  /**
   * Get provider ID
   */
  getId(): string;
  
  /**
   * Get provider name
   */
  getName(): string;
  
  /**
   * Get provider priority
   */
  getPriority(): number;
  
  /**
   * Check if provider supports a network
   * 
   * @param network Network to check
   */
  supportsNetwork(network: SolanaNetwork): boolean;
  
  /**
   * Check if provider has a capability
   * 
   * @param capability Capability to check
   */
  hasCapability(capability: string): boolean;
  
  /**
   * Check provider health
   */
  checkHealth(): Promise<boolean>;
}

/**
 * Wallet Account Interface
 */
export interface WalletAccount {
  address: string;
  type: 'solana';
  displayName?: string;
}

/**
 * Token Balance Interface
 */
export interface TokenBalance {
  token: {
    address: string;
    symbol: string;
    name?: string;
    decimals: number;
    logoURI?: string;
  };
  amount: string;
  amountFloat: number;
  usdValue?: number;
}

/**
 * Wallet Balance Interface
 */
export interface WalletBalance {
  tokenAmount: number;
  usdValue?: number;
  lastUpdated: Date;
}

/**
 * Wallet Transaction Type Enum
 */
export enum WalletTransactionType {
  IN = 'in',
  OUT = 'out',
  SWAP = 'swap',
  UNKNOWN = 'unknown'
}

/**
 * Wallet Transaction Status Enum
 */
export enum WalletTransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed'
}

/**
 * Wallet Transaction Interface
 */
export interface WalletTransaction {
  id: string;
  hash: string;
  blockNumber?: number;
  timestamp: Date;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  from: string;
  to: string;
  amount: number;
  token: {
    address: string;
    symbol: string;
    decimals: number;
  };
  fee?: string;
  memo?: string;
}

/**
 * Token Redemption Status Enum
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
 * Token Redemption Interface
 */
export interface TokenRedemption {
  id: string;
  userId: string;
  walletAddress: string;
  pointsAmount: number;
  tokenAmount: number;
  status: RedemptionStatus;
  transactionHash?: string;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

/**
 * Wallet Provider Interface
 */
export interface WalletProvider {
  name: string;
  type: string;
  icon?: string;
  url: string;
  mobile?: string;
}

/**
 * Solana Signature Verification Payload
 */
export interface SignatureVerificationPayload {
  message: string;
  signature: string;
  publicKey: string;
}
