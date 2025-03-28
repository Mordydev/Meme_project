/**
 * Wallet Repository
 * 
 * Handles data access operations for wallet connections and token transactions
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  WalletConnection, 
  CreateWalletConnectionDto, 
  UpdateWalletConnectionDto,
  TokenTransaction,
  TokenBalance
} from '../models/entities/wallet.model';
import { logger } from '../lib/logger';

export class WalletRepository extends BaseRepository<WalletConnection> {
  /**
   * Create a new WalletRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'wallet_connections');
  }

  /**
   * Find wallet connection by address
   * 
   * @param walletAddress Wallet address
   * @returns Wallet connection or null if not found
   */
  async findByAddress(walletAddress: string): Promise<WalletConnection | null> {
    try {
      const query = `
        SELECT * FROM wallet_connections
        WHERE wallet_address = $1
      `;
      
      const result = await this.db.query<WalletConnection>(query, [walletAddress]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding wallet by address', { error, walletAddress });
      throw error;
    }
  }

  /**
   * Find wallet connections by user ID
   * 
   * @param userId User ID
   * @returns Array of wallet connections
   */
  async findByUserId(userId: string): Promise<WalletConnection[]> {
    try {
      const query = `
        SELECT * FROM wallet_connections
        WHERE user_id = $1
        ORDER BY is_primary DESC, connected_at DESC
      `;
      
      const result = await this.db.query<WalletConnection>(query, [userId]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Error finding wallets by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Find primary wallet for a user
   * 
   * @param userId User ID
   * @returns Primary wallet or null if not found
   */
  async findPrimaryWallet(userId: string): Promise<WalletConnection | null> {
    try {
      const query = `
        SELECT * FROM wallet_connections
        WHERE user_id = $1 AND is_primary = true
        LIMIT 1
      `;
      
      const result = await this.db.query<WalletConnection>(query, [userId]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding primary wallet', { error, userId });
      throw error;
    }
  }

  /**
   * Create a new wallet connection
   * 
   * @param data Wallet connection data
   * @returns Created wallet connection
   */
  async createWalletConnection(data: CreateWalletConnectionDto): Promise<WalletConnection> {
    try {
      return this.withTransaction(async (client) => {
        // If this is the first wallet or marked as primary, ensure it's the only primary
        if (data.is_primary) {
          await client.query(`
            UPDATE wallet_connections
            SET is_primary = false
            WHERE user_id = $1
          `, [data.user_id]);
        }
        
        // Add connected_at timestamp
        const wallletData = {
          ...data,
          connected_at: new Date(),
          last_verified_at: data.is_verified ? new Date() : null
        };
        
        // Create wallet connection
        const result = await client.query(`
          INSERT INTO wallet_connections (
            id, user_id, wallet_address, wallet_type, is_verified, 
            connected_at, last_verified_at, display_name, is_primary, metadata
          )
          VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
          RETURNING *
        `, [
          wallletData.user_id,
          wallletData.wallet_address,
          wallletData.wallet_type || 'phantom',
          wallletData.is_verified || false,
          wallletData.connected_at,
          wallletData.last_verified_at,
          wallletData.display_name || null,
          wallletData.is_primary || false,
          JSON.stringify(wallletData.metadata || {})
        ]);
        
        return this.mapToEntity(result.rows[0]);
      });
    } catch (error) {
      logger.error('Error creating wallet connection', { error, data });
      throw error;
    }
  }

  /**
   * Update a wallet connection
   * 
   * @param id Wallet connection ID
   * @param data Wallet connection data to update
   * @returns Updated wallet connection or null if not found
   */
  async updateWalletConnection(id: string, data: UpdateWalletConnectionDto): Promise<WalletConnection | null> {
    try {
      return this.withTransaction(async (client) => {
        // If updating to primary, ensure it's the only primary
        if (data.is_primary) {
          // Get the wallet first to get the user_id
          const walletResult = await client.query(`
            SELECT user_id FROM wallet_connections
            WHERE id = $1
          `, [id]);
          
          if (walletResult.rows.length === 0) {
            return null;
          }
          
          const userId = walletResult.rows[0].user_id;
          
          // Update all other wallets to not be primary
          await client.query(`
            UPDATE wallet_connections
            SET is_primary = false
            WHERE user_id = $1 AND id != $2
          `, [userId, id]);
        }
        
        // Update last_verified_at if changing verification status
        let updateData = { ...data };
        if (data.is_verified === true) {
          updateData.last_verified_at = new Date();
        }
        
        // Update wallet connection
        const result = await client.query(`
          UPDATE wallet_connections
          SET
            ${data.is_verified !== undefined ? 'is_verified = $1,' : ''}
            ${data.display_name !== undefined ? 'display_name = $2,' : ''}
            ${data.is_primary !== undefined ? 'is_primary = $3,' : ''}
            ${data.metadata !== undefined ? 'metadata = $4,' : ''}
            ${data.is_verified === true ? 'last_verified_at = $5' : 'updated_at = NOW()'}
          WHERE id = $6
          RETURNING *
        `, [
          data.is_verified,
          data.display_name,
          data.is_primary,
          data.metadata ? JSON.stringify(data.metadata) : undefined,
          data.is_verified === true ? updateData.last_verified_at : undefined,
          id
        ].filter(param => param !== undefined));
        
        return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
      });
    } catch (error) {
      logger.error('Error updating wallet connection', { error, id, data });
      throw error;
    }
  }

  /**
   * Record a token transaction
   * 
   * @param transaction Transaction data
   * @returns Created transaction
   */
  async recordTransaction(transaction: Omit<TokenTransaction, 'id'>): Promise<TokenTransaction> {
    try {
      // Create transaction record
      const result = await this.db.query(`
        INSERT INTO token_transactions (
          id, wallet_address, user_id, transaction_hash, amount,
          token_symbol, transaction_type, timestamp, status, block_number, metadata
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
        RETURNING *
      `, [
        transaction.wallet_address,
        transaction.user_id || null,
        transaction.transaction_hash,
        transaction.amount,
        transaction.token_symbol || 'SKC',
        transaction.transaction_type,
        transaction.timestamp || new Date(),
        transaction.status || 'pending',
        transaction.block_number || null,
        JSON.stringify(transaction.metadata || {})
      ]);
      
      return {
        id: result.rows[0].id,
        wallet_address: result.rows[0].wallet_address,
        user_id: result.rows[0].user_id,
        transaction_hash: result.rows[0].transaction_hash,
        amount: parseFloat(result.rows[0].amount),
        token_symbol: result.rows[0].token_symbol,
        transaction_type: result.rows[0].transaction_type,
        timestamp: result.rows[0].timestamp,
        status: result.rows[0].status,
        block_number: result.rows[0].block_number,
        metadata: result.rows[0].metadata || {}
      };
    } catch (error) {
      logger.error('Error recording token transaction', { error, transaction });
      throw error;
    }
  }

  /**
   * Update a transaction status
   * 
   * @param transactionHash Transaction hash
   * @param status New status
   * @param blockNumber Optional block number
   * @returns True if updated, false if not found
   */
  async updateTransactionStatus(
    transactionHash: string, 
    status: 'pending' | 'confirmed' | 'failed',
    blockNumber?: number
  ): Promise<boolean> {
    try {
      let query = `
        UPDATE token_transactions
        SET status = $1
      `;
      
      const params: any[] = [status];
      
      if (blockNumber !== undefined) {
        query += `, block_number = $2`;
        params.push(blockNumber);
      }
      
      query += ` WHERE transaction_hash = $${params.length + 1}`;
      params.push(transactionHash);
      
      const result = await this.db.query(query, params);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error updating transaction status', { error, transactionHash, status });
      throw error;
    }
  }

  /**
   * Get token transactions for a wallet
   * 
   * @param walletAddress Wallet address
   * @param limit Maximum transactions to return
   * @param offset Number of transactions to skip
   * @returns Array of token transactions
   */
  async getWalletTransactions(
    walletAddress: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<TokenTransaction[]> {
    try {
      const query = `
        SELECT * FROM token_transactions
        WHERE wallet_address = $1
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [walletAddress, limit, offset]);
      
      return result.rows.map(row => ({
        id: row.id,
        wallet_address: row.wallet_address,
        user_id: row.user_id,
        transaction_hash: row.transaction_hash,
        amount: parseFloat(row.amount),
        token_symbol: row.token_symbol,
        transaction_type: row.transaction_type,
        timestamp: row.timestamp,
        status: row.status,
        block_number: row.block_number,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      logger.error('Error getting wallet transactions', { error, walletAddress, limit, offset });
      throw error;
    }
  }

  /**
   * Get token transactions for a user
   * 
   * @param userId User ID
   * @param limit Maximum transactions to return
   * @param offset Number of transactions to skip
   * @returns Array of token transactions
   */
  async getUserTransactions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<TokenTransaction[]> {
    try {
      const query = `
        SELECT t.*
        FROM token_transactions t
        JOIN wallet_connections w ON t.wallet_address = w.wallet_address
        WHERE w.user_id = $1
        ORDER BY t.timestamp DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [userId, limit, offset]);
      
      return result.rows.map(row => ({
        id: row.id,
        wallet_address: row.wallet_address,
        user_id: row.user_id,
        transaction_hash: row.transaction_hash,
        amount: parseFloat(row.amount),
        token_symbol: row.token_symbol,
        transaction_type: row.transaction_type,
        timestamp: row.timestamp,
        status: row.status,
        block_number: row.block_number,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      logger.error('Error getting user transactions', { error, userId, limit, offset });
      throw error;
    }
  }

  /**
   * Update or create a token balance
   * 
   * @param balance Token balance data
   * @returns Created or updated token balance
   */
  async updateTokenBalance(balance: TokenBalance): Promise<TokenBalance> {
    try {
      const query = `
        INSERT INTO token_balances (
          wallet_address, token_symbol, balance, usd_value, last_updated
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (wallet_address)
        DO UPDATE SET
          token_symbol = $2,
          balance = $3,
          usd_value = $4,
          last_updated = $5
        RETURNING *
      `;
      
      const result = await this.db.query(query, [
        balance.wallet_address,
        balance.token_symbol || 'SKC',
        balance.balance,
        balance.usd_value || null,
        balance.last_updated || new Date()
      ]);
      
      return {
        wallet_address: result.rows[0].wallet_address,
        token_symbol: result.rows[0].token_symbol,
        balance: parseFloat(result.rows[0].balance),
        usd_value: result.rows[0].usd_value ? parseFloat(result.rows[0].usd_value) : undefined,
        last_updated: result.rows[0].last_updated
      };
    } catch (error) {
      logger.error('Error updating token balance', { error, balance });
      throw error;
    }
  }

  /**
   * Get token balance for a wallet
   * 
   * @param walletAddress Wallet address
   * @returns Token balance or null if not found
   */
  async getTokenBalance(walletAddress: string): Promise<TokenBalance | null> {
    try {
      const query = `
        SELECT * FROM token_balances
        WHERE wallet_address = $1
      `;
      
      const result = await this.db.query(query, [walletAddress]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        wallet_address: result.rows[0].wallet_address,
        token_symbol: result.rows[0].token_symbol,
        balance: parseFloat(result.rows[0].balance),
        usd_value: result.rows[0].usd_value ? parseFloat(result.rows[0].usd_value) : undefined,
        last_updated: result.rows[0].last_updated
      };
    } catch (error) {
      logger.error('Error getting token balance', { error, walletAddress });
      throw error;
    }
  }

  /**
   * Count unique wallet connections
   * 
   * @returns Count of unique wallets
   */
  async countUniqueWallets(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(DISTINCT wallet_address) as count
        FROM wallet_connections
      `;
      
      const result = await this.db.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting unique wallets', { error });
      throw error;
    }
  }

  /**
   * Check if a wallet address is already connected
   * 
   * @param walletAddress Wallet address
   * @returns True if connected, false otherwise
   */
  async isWalletConnected(walletAddress: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM wallet_connections
          WHERE wallet_address = $1
        ) as is_connected
      `;
      
      const result = await this.db.query(query, [walletAddress]);
      return result.rows[0].is_connected;
    } catch (error) {
      logger.error('Error checking if wallet is connected', { error, walletAddress });
      throw error;
    }
  }

  /**
   * Map database row to WalletConnection entity
   * 
   * @param row Database row
   * @returns WalletConnection entity
   */
  protected mapToEntity(row: Record<string, any>): WalletConnection {
    return {
      id: row.id,
      user_id: row.user_id,
      wallet_address: row.wallet_address,
      wallet_type: row.wallet_type,
      is_verified: row.is_verified,
      connected_at: row.connected_at,
      last_verified_at: row.last_verified_at,
      display_name: row.display_name,
      is_primary: row.is_primary,
      metadata: row.metadata || {}
    };
  }
}
