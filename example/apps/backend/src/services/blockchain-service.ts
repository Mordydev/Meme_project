import { Connection, PublicKey, TokenAmount, TokenBalance, AccountInfo } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { CircuitBreaker } from '../lib/blockchain/circuit-breaker';
import { config } from '../config';
import { Logger } from 'pino';
import { DependencyError } from '../lib/errors';

/**
 * Interface for blockchain connection statistics
 */
interface ConnectionStats {
  successful: number;
  failed: number;
  latency: number[];
  lastUsed: Date;
  lastError?: Error;
}

/**
 * Blockchain service for interacting with Solana blockchain
 */
export class BlockchainService {
  private connections: Connection[] = [];
  private connectionIndex = 0;
  private connectionStats: Map<number, ConnectionStats> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private tokenMint: PublicKey;
  
  constructor(private readonly logger: Logger) {
    // Initialize multiple RPC connections for redundancy
    this.connections = config.solana.rpcUrls.map((url, i) => {
      // Create a new connection
      const connection = new Connection(url, 'confirmed');
      
      // Initialize connection stats
      this.connectionStats.set(i, {
        successful: 0,
        failed: 0,
        latency: [],
        lastUsed: new Date()
      });
      
      // Create circuit breaker for each connection
      this.circuitBreakers.set(`rpc-${i}`, new CircuitBreaker(`solana-rpc-${i}`, {
        failureThreshold: 3,
        resetTimeout: 30000, // 30 seconds
        monitor: true,
        logger: this.logger
      }));
      
      return connection;
    });
    
    if (this.connections.length === 0) {
      throw new Error('No Solana RPC connections configured');
    }
    
    try {
      this.tokenMint = new PublicKey(config.solana.tokenMint);
    } catch (error) {
      throw new Error(`Invalid Solana token mint address: ${config.solana.tokenMint}`);
    }
    
    this.logger.info({
      connections: this.connections.length,
      tokenMint: config.solana.tokenMint,
      network: config.solana.networkType
    }, 'Blockchain service initialized');
  }
  
  /**
   * Execute an operation with automatic retries and circuit breaker protection
   */
  async executeWithRetry<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
    // Try each connection with circuit breaker
    const errors: { connectionIndex: number; error: Error }[] = [];
    
    for (let attempt = 0; attempt < this.connections.length * 2; attempt++) {
      // Rotate through connections with smart selection
      const connectionIndex = this.selectConnection();
      const connection = this.connections[connectionIndex];
      const breaker = this.circuitBreakers.get(`rpc-${connectionIndex}`);
      
      if (!breaker) {
        this.logger.warn({ connectionIndex }, 'No circuit breaker found for connection');
        continue;
      }
      
      // Skip if circuit is open
      if (breaker.isOpen()) {
        this.logger.debug({ connectionIndex }, 'Circuit is open, skipping connection');
        continue;
      }
      
      try {
        // Track operation time for latency stats
        const startTime = Date.now();
        
        // Execute operation through circuit breaker
        const result = await breaker.execute(() => operation(connection));
        
        // Update success stats
        const stats = this.connectionStats.get(connectionIndex);
        if (stats) {
          stats.successful++;
          stats.lastUsed = new Date();
          stats.latency.push(Date.now() - startTime);
          
          // Keep only the last 10 latency measurements
          if (stats.latency.length > 10) {
            stats.latency.shift();
          }
        }
        
        return result;
      } catch (error) {
        // Update failure stats
        const stats = this.connectionStats.get(connectionIndex);
        if (stats) {
          stats.failed++;
          stats.lastError = error as Error;
        }
        
        // Log and collect error
        this.logger.warn({ 
          error, 
          connectionIndex,
          rpcUrl: config.solana.rpcUrls[connectionIndex],
          attempt: attempt + 1
        }, 'Blockchain operation failed');
        
        errors.push({ 
          connectionIndex, 
          error: error as Error 
        });
      }
    }
    
    // All attempts failed
    const blockchainError = new DependencyError(
      'solana',
      'All blockchain connections failed',
      { errors: errors.map(e => ({ index: e.connectionIndex, message: e.error.message })) }
    );
    
    this.logger.error({ 
      errors: errors.map(e => ({ 
        index: e.connectionIndex, 
        message: e.error.message,
        stack: e.error.stack 
      }))
    }, 'All blockchain connections failed');
    
    throw blockchainError;
  }
  
  /**
   * Get token balance for an address
   */
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      
      return await this.executeWithRetry(async (connection) => {
        // Find the associated token account
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          walletPublicKey,
          { mint: this.tokenMint }
        );
        
        // Sum up all token balances (should usually be just one account)
        let totalBalance = 0;
        
        for (const { account } of tokenAccounts.value) {
          const tokenAmount = account.data.parsed.info.tokenAmount;
          totalBalance += parseInt(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
        }
        
        return totalBalance;
      });
    } catch (error) {
      this.logger.error({ error, walletAddress }, 'Failed to get token balance');
      throw new DependencyError('solana', `Failed to get token balance: ${error.message}`);
    }
  }
  
  /**
   * Get transaction details
   */
  async getTransaction(signature: string) {
    return this.executeWithRetry(async (connection) => {
      return connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });
    });
  }
  
  /**
   * Get the latest block height
   */
  async getBlockHeight(): Promise<number> {
    return this.executeWithRetry(async (connection) => {
      return connection.getBlockHeight();
    });
  }
  
  /**
   * Verify a message signature
   */
  async verifyMessageSignature(
    message: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Import necessary libraries directly in the method to avoid initialization issues
      const { verify } = await import('@solana/web3.js-wallet-adapter');
      const bs58 = await import('bs58');
      
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      
      return verify(publicKeyBytes, messageBytes, signatureBytes);
    } catch (error) {
      this.logger.error({ error, publicKey }, 'Failed to verify message signature');
      throw new DependencyError('solana', `Failed to verify message signature: ${error.message}`);
    }
  }
  
  /**
   * Get the health of all connections
   */
  getConnectionHealth(): { 
    total: number;
    healthy: number;
    stats: Record<number, ConnectionStats>; 
  } {
    const stats: Record<number, ConnectionStats> = {};
    let healthy = 0;
    
    // Build stats object and count healthy connections
    for (let i = 0; i < this.connections.length; i++) {
      const connectionStats = this.connectionStats.get(i);
      const circuitState = this.circuitBreakers.get(`rpc-${i}`)?.getState();
      
      if (connectionStats) {
        stats[i] = { ...connectionStats };
        
        // Connection is healthy if circuit is not open
        if (circuitState !== 1) { // CircuitState.OPEN
          healthy++;
        }
      }
    }
    
    return {
      total: this.connections.length,
      healthy,
      stats
    };
  }
  
  /**
   * Intelligently select the best connection to use
   */
  private selectConnection(): number {
    // Simple implementation for now: round-robin selection
    this.connectionIndex = (this.connectionIndex + 1) % this.connections.length;
    return this.connectionIndex;
    
    // Future implementation:
    // - Could use stats to prioritize connections with lower latency
    // - Could use error rates to avoid problematic connections
    // - Could implement weighted selection based on past performance
  }
}
