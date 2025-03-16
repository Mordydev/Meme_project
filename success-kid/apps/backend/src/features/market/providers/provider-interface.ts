/**
 * Provider interface for market data sources
 */
import { TokenPrice, PriceDataPoint } from '../types';

/**
 * Interface for all price data providers
 */
export interface PriceProvider {
  /**
   * Get the provider name
   */
  getName(): string;
  
  /**
   * Get current price for the specified token
   * @param tokenSymbol The token symbol to get price for
   */
  getCurrentPrice(tokenSymbol: string): Promise<TokenPrice>;
  
  /**
   * Get historical prices for the specified token and timeframe
   * @param tokenSymbol The token symbol to get prices for
   * @param timeframe The timeframe to get prices for (e.g. '1d', '7d', '30d')
   */
  getHistoricalPrices(tokenSymbol: string, timeframe: string): Promise<PriceDataPoint[]>;
  
  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): string[];
}

/**
 * Interface for transaction data providers
 */
export interface TransactionProvider {
  /**
   * Get the provider name
   */
  getName(): string;
  
  /**
   * Get recent transactions for the specified token
   * @param tokenAddress The token address to get transactions for
   * @param limit Maximum number of transactions to return
   */
  getRecentTransactions(tokenAddress: string, limit?: number): Promise<any[]>;
  
  /**
   * Get transaction details
   * @param txHash The transaction hash
   */
  getTransactionDetails(txHash: string): Promise<any>;
  
  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): string[];
}

/**
 * Interface for wallet data providers
 */
export interface WalletProvider {
  /**
   * Get the provider name
   */
  getName(): string;
  
  /**
   * Get token balance for the specified wallet
   * @param walletAddress The wallet address
   * @param tokenAddress The token address
   */
  getTokenBalance(walletAddress: string, tokenAddress: string): Promise<string>;
  
  /**
   * Get wallet transactions
   * @param walletAddress The wallet address
   * @param limit Maximum number of transactions to return
   */
  getWalletTransactions(walletAddress: string, limit?: number): Promise<any[]>;
  
  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): string[];
}
