/**
 * Base Blockchain Provider
 * 
 * This abstract class defines the interface that all blockchain providers must implement.
 */
import { 
  BlockchainNetwork, 
  BalanceData, 
  Transaction, 
  TransactionRequest, 
  TransactionResult,
  FeeEstimate,
  VerificationResult,
  TransactionOptions,
  PaginatedResult
} from '../types';

export interface BlockchainConfig {
  network: BlockchainNetwork;
  rpcUrl: string;
  apiKey?: string;
  defaultGasPrice?: string;
  defaultGasLimit?: string;
}

/**
 * Base blockchain provider interface
 */
export abstract class BaseBlockchainProvider {
  /**
   * Constructor with provider configuration
   */
  constructor(protected config: BlockchainConfig) {}

  /**
   * Get provider name
   */
  abstract getName(): string;

  /**
   * Get network name
   */
  abstract getNetwork(): string;

  /**
   * Validate wallet address format
   * 
   * @param address Wallet address to validate
   * @returns True if address format is valid
   */
  abstract isAddressValid(address: string): boolean;

  /**
   * Get token balance for address
   * 
   * @param address Wallet address
   * @param token Optional token address (defaults to native token)
   * @returns Balance data
   */
  abstract getBalance(address: string, token?: string): Promise<BalanceData>;

  /**
   * Get transaction history for an address
   * 
   * @param address Wallet address
   * @param options Optional query parameters
   * @returns Array of transactions
   */
  abstract getTransactions(
    address: string, 
    options?: TransactionOptions
  ): Promise<PaginatedResult<Transaction>>;

  /**
   * Send a transaction
   * 
   * @param tx Transaction request
   * @returns Transaction result
   */
  abstract sendTransaction(tx: TransactionRequest): Promise<TransactionResult>;

  /**
   * Estimate transaction fee
   * 
   * @param tx Transaction request
   * @returns Fee estimate
   */
  abstract estimateFee(tx: TransactionRequest): Promise<FeeEstimate>;

  /**
   * Verify a signed message
   * 
   * @param address Wallet address
   * @param message Message that was signed
   * @param signature Signature to verify
   * @returns Verification result
   */
  abstract verifyMessage(
    address: string, 
    message: string, 
    signature: string
  ): Promise<VerificationResult>;

  /**
   * Get transaction by hash
   * 
   * @param transactionHash Transaction hash
   * @returns Transaction details or null if not found
   */
  abstract getTransaction(transactionHash: string): Promise<Transaction | null>;

  /**
   * Get current block number
   * 
   * @returns Current block number
   */
  abstract getCurrentBlockNumber(): Promise<number>;

  /**
   * Execute operation with timeout
   * 
   * @param operation Operation to execute
   * @param timeout Timeout in milliseconds
   * @returns Operation result
   */
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = 10000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ]);
  }
}
