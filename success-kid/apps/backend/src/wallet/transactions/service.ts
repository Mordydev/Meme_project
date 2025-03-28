/**
 * Wallet Transaction Service
 * 
 * Handles wallet transaction history and monitoring.
 */
import { WalletRepository } from '../../repositories/wallet-repository';
import { TokenTransaction } from '../../models/entities/wallet.model';
import { logger } from '../../lib/logger';
import { NotFoundError } from '../../errors';
import { getBlockchainProviderFactory } from '../../blockchain';
import { 
  Transaction, 
  TransactionOptions, 
  TransactionStatus, 
  TransactionType,
  PaginatedResult
} from '../../blockchain/types';

/**
 * Transaction response
 */
export interface TransactionResponse {
  id: string;
  hash: string;
  type: 'in' | 'out' | 'self';
  tokenSymbol: string;
  amount: string;
  formattedAmount: string;
  timestamp: Date;
  status: string;
  fromAddress?: string;
  toAddress?: string;
  blockNumber?: number;
  usdValue?: number;
}

/**
 * Wallet transaction service
 */
export class WalletTransactionService {
  // Default cache TTL
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // In-memory transaction cache
  // In production, use Redis or another distributed cache
  private transactionCache = new Map<string, {
    data: PaginatedResult<Transaction>;
    timestamp: number;
    expiresAt: number;
  }>();
  
  /**
   * Create wallet transaction service
   * 
   * @param walletRepository Wallet repository
   */
  constructor(private readonly walletRepository: WalletRepository) {}

  /**
   * Get transaction history for a wallet
   * 
   * @param walletAddress Wallet address
   * @param options Transaction options
   * @param forceRefresh Whether to force a refresh from blockchain
   * @returns Transaction history
   */
  async getWalletTransactions(
    walletAddress: string,
    options: TransactionOptions = {},
    forceRefresh: boolean = false
  ): Promise<PaginatedResult<TransactionResponse>> {
    logger.info('Getting wallet transactions', { walletAddress, options, forceRefresh });
    
    // Set default options
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    
    // Generate cache key
    const cacheKey = `transactions:${walletAddress}:${JSON.stringify(options)}`;
    
    // Check if we have cached transactions and they're not expired
    const cachedTransactions = this.transactionCache.get(cacheKey);
    
    // Return cached transactions if they're not expired and not forcing refresh
    if (
      cachedTransactions && 
      Date.now() < cachedTransactions.expiresAt && 
      !forceRefresh
    ) {
      logger.debug('Using cached transactions', { walletAddress });
      
      return {
        data: cachedTransactions.data.data.map(tx => this.formatTransactionResponse(tx)),
        pagination: cachedTransactions.data.pagination
      };
    }
    
    // Try to get transactions from local database first
    try {
      const storedTransactions = await this.walletRepository.getWalletTransactions(
        walletAddress,
        limit,
        offset
      );
      
      // If we have stored transactions and not forcing refresh, use them
      if (storedTransactions.length > 0 && !forceRefresh) {
        logger.debug('Using stored transactions', { walletAddress });
        
        return {
          data: storedTransactions.map(tx => this.formatTokenTransaction(tx)),
          pagination: {
            total: await this.getTransactionCount(walletAddress, options),
            limit,
            offset,
            hasMore: storedTransactions.length === limit
          }
        };
      }
    } catch (error) {
      logger.error('Error fetching stored transactions', {
        walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue to blockchain fetch
    }
    
    // Get blockchain provider for this wallet
    const providerFactory = getBlockchainProviderFactory();
    const provider = providerFactory.getProviderForAddress(walletAddress);
    
    try {
      // Get fresh transactions from blockchain
      logger.debug('Fetching fresh transactions from blockchain', { walletAddress });
      const transactions = await provider.getTransactions(walletAddress, options);
      
      // Update cache
      this.transactionCache.set(cacheKey, {
        data: transactions,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.DEFAULT_CACHE_TTL
      });
      
      // Update stored transactions (in the background)
      this.storeTransactions(walletAddress, transactions.data);
      
      // Return formatted transactions
      return {
        data: transactions.data.map(tx => this.formatTransactionResponse(tx)),
        pagination: transactions.pagination
      };
    } catch (error) {
      logger.error('Error fetching transactions from blockchain', {
        walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return empty result if blockchain fetch fails
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      };
    }
  }

  /**
   * Get transaction by hash
   * 
   * @param transactionHash Transaction hash
   * @returns Transaction details or null if not found
   */
  async getTransaction(transactionHash: string): Promise<TransactionResponse | null> {
    logger.info('Getting transaction details', { transactionHash });
    
    // Try to get from local database first
    try {
      // This would be implemented in a real system
      // For now, fetch from blockchain
    } catch (error) {
      logger.error('Error fetching transaction from database', {
        transactionHash,
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue to blockchain fetch
    }
    
    // Get transactions from blockchain
    // We'll use the first provider since we don't know which chain this is for
    const providerFactory = getBlockchainProviderFactory();
    const providers = Object.values(providerFactory.getAllProviders());
    
    if (providers.length === 0) {
      logger.error('No blockchain providers available');
      return null;
    }
    
    const provider = providers[0];
    
    try {
      const transaction = await provider.getTransaction(transactionHash);
      
      if (!transaction) {
        return null;
      }
      
      return this.formatTransactionResponse(transaction);
    } catch (error) {
      logger.error('Error fetching transaction from blockchain', {
        transactionHash,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return null;
    }
  }

  /**
   * Sync transactions for a wallet
   * 
   * @param walletAddress Wallet address
   * @returns Number of transactions synced
   */
  async syncTransactions(walletAddress: string): Promise<number> {
    logger.info('Syncing wallet transactions', { walletAddress });
    
    // Get blockchain provider for this wallet
    const providerFactory = getBlockchainProviderFactory();
    const provider = providerFactory.getProviderForAddress(walletAddress);
    
    try {
      // Get latest transactions from blockchain
      const transactions = await provider.getTransactions(walletAddress, {
        limit: 100, // Get a larger batch for sync
      });
      
      // Store transactions
      await this.storeTransactions(walletAddress, transactions.data);
      
      return transactions.data.length;
    } catch (error) {
      logger.error('Error syncing transactions', {
        walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  /**
   * Store transactions in database
   * 
   * @param walletAddress Wallet address
   * @param transactions Transactions to store
   */
  private async storeTransactions(
    walletAddress: string,
    transactions: Transaction[]
  ): Promise<void> {
    try {
      // Process each transaction
      for (const tx of transactions) {
        // Convert to TokenTransaction format
        const tokenTransaction: Omit<TokenTransaction, 'id'> = {
          wallet_address: walletAddress,
          user_id: undefined, // Would be set if we know the user
          transaction_hash: tx.hash,
          amount: parseFloat(tx.amount),
          token_symbol: tx.token,
          transaction_type: tx.type === TransactionType.IN ? 'in' : 'out',
          timestamp: tx.timestamp || new Date(),
          status: tx.status === TransactionStatus.CONFIRMED ? 'confirmed' : 
                 tx.status === TransactionStatus.PENDING ? 'pending' : 'failed',
          block_number: tx.blockNumber,
          metadata: {
            fromAddress: tx.fromAddress,
            toAddress: tx.toAddress,
            fee: tx.fee
          }
        };
        
        // Store in database (don't wait for completion)
        this.walletRepository.recordTransaction(tokenTransaction)
          .catch(error => {
            logger.error('Error storing transaction', {
              walletAddress,
              transactionHash: tx.hash,
              error: error instanceof Error ? error.message : String(error)
            });
          });
      }
    } catch (error) {
      logger.error('Error processing transactions for storage', {
        walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get transaction count
   * 
   * @param walletAddress Wallet address
   * @param options Transaction options
   * @returns Total transaction count
   */
  private async getTransactionCount(
    walletAddress: string,
    options: TransactionOptions = {}
  ): Promise<number> {
    // This would query the database for the count
    // For now, we'll return a placeholder
    return 100;
  }

  /**
   * Format blockchain transaction to response format
   * 
   * @param transaction Blockchain transaction
   * @returns Formatted transaction response
   */
  private formatTransactionResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.hash, // Use hash as ID for blockchain transactions
      hash: transaction.hash,
      type: transaction.type,
      tokenSymbol: transaction.token,
      amount: transaction.amount,
      formattedAmount: this.formatDecimal(parseFloat(transaction.amount), 2),
      timestamp: transaction.timestamp || new Date(),
      status: transaction.status,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      blockNumber: transaction.blockNumber
    };
  }

  /**
   * Format stored transaction to response format
   * 
   * @param transaction Stored token transaction
   * @returns Formatted transaction response
   */
  private formatTokenTransaction(transaction: TokenTransaction): TransactionResponse {
    return {
      id: transaction.id,
      hash: transaction.transaction_hash,
      type: transaction.transaction_type as 'in' | 'out' | 'self',
      tokenSymbol: transaction.token_symbol,
      amount: transaction.amount.toString(),
      formattedAmount: this.formatDecimal(transaction.amount, 2),
      timestamp: transaction.timestamp,
      status: transaction.status,
      fromAddress: transaction.metadata?.fromAddress,
      toAddress: transaction.metadata?.toAddress,
      blockNumber: transaction.block_number
    };
  }

  /**
   * Format decimal number
   * 
   * @param value Numeric value
   * @param decimals Number of decimal places
   * @returns Formatted string
   */
  private formatDecimal(value: number, decimals: number): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
}
