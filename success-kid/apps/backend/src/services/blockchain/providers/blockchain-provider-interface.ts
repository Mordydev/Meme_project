/**
 * Blockchain Provider Interface
 * 
 * Defines the interface for blockchain providers.
 */

export interface TransactionResponse {
  txHash: string;
  blockNumber?: number;
}

export interface TransactionStatus {
  confirmed: boolean;
  confirmations?: number;
  fromAddress?: string;
  toAddress?: string;
  amount?: number;
  blockNumber?: number;
  gasUsed?: number;
  timestamp?: Date;
}

export interface TokenTransferParams {
  tokenAddress: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  gasMultiplier?: number;
  gasFee?: string;
}

export interface FeeEstimate {
  fee: string;
  currency: string;
  fastFee?: string;
  averageFee?: string;
  slowFee?: string;
  estimatedTimeInSeconds?: number;
}

/**
 * Interface for blockchain providers
 */
export interface IBlockchainProvider {
  /**
   * Get the balance of a token for a specific address
   */
  getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string>;
  
  /**
   * Get the blockchain network name
   */
  getNetworkName(): Promise<string>;
  
  /**
   * Transfer tokens from one address to another
   */
  transferTokens(params: TokenTransferParams): Promise<TransactionResponse>;
  
  /**
   * Get the status of a transaction
   */
  getTransaction(txHash: string): Promise<TransactionStatus | null>;
  
  /**
   * Estimate the gas fee for a transaction
   */
  estimateFee(): Promise<FeeEstimate>;
  
  /**
   * Check if the provider is currently available
   */
  isAvailable(): Promise<boolean>;
}
