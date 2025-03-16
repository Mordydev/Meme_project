/**
 * Wallet Connection Repository
 * 
 * Handles data access for wallet connections
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { WalletConnection, CreateWalletConnectionDto, UpdateWalletConnectionDto } from '../models/wallet-connection';
import { logger } from '../lib/logger';

export class WalletConnectionRepository extends BaseRepository<WalletConnection> {
  constructor(db: Pool) {
    super(db, 'wallet_connections', 'id');
  }
  
  /**
   * Find wallet connection by address
   */
  async findByWalletAddress(address: string): Promise<WalletConnection | null> {
    try {
      const query = 'SELECT * FROM wallet_connections WHERE wallet_address = $1';
      const result = await this.db.query<WalletConnection>(query, [address]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding wallet connection by address', { error, address });
      throw error;
    }
  }
  
  /**
   * Find wallet connections for a user
   */
  async findByUserId(userId: string): Promise<WalletConnection[]> {
    try {
      const query = 'SELECT * FROM wallet_connections WHERE user_id = $1';
      const result = await this.db.query<WalletConnection>(query, [userId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error finding wallet connections for user', { error, userId });
      throw error;
    }
  }
  
  /**
   * Create a new wallet connection
   */
  async createWalletConnection(input: CreateWalletConnectionDto): Promise<WalletConnection> {
    try {
      // Check if wallet is already connected
      const existing = await this.findByWalletAddress(input.wallet_address);
      
      if (existing) {
        throw new Error('Wallet address is already connected to an account');
      }
      
      const query = `
        INSERT INTO wallet_connections
        (id, user_id, wallet_address, is_verified, connected_at, last_verified_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await this.db.query<WalletConnection>(query, [
        input.user_id,
        input.wallet_address,
        input.is_verified ?? false
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating wallet connection', { error, input });
      throw error;
    }
  }
  
  /**
   * Update wallet verification status
   */
  async updateVerificationStatus(
    id: string, 
    update: UpdateWalletConnectionDto
  ): Promise<WalletConnection | null> {
    try {
      const { is_verified, last_verified_at } = update;
      
      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (is_verified !== undefined) {
        updates.push(`is_verified = $${paramIndex++}`);
        values.push(is_verified);
      }
      
      if (last_verified_at !== undefined) {
        updates.push(`last_verified_at = $${paramIndex++}`);
        values.push(last_verified_at);
      } else if (is_verified === true) {
        // Automatically update last_verified_at if verifying
        updates.push(`last_verified_at = NOW()`);
      }
      
      if (updates.length === 0) {
        return this.findById(id);
      }
      
      const query = `
        UPDATE wallet_connections
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await this.db.query<WalletConnection>(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating wallet verification status', { error, id, update });
      throw error;
    }
  }
  
  /**
   * Find verified wallet connections
   */
  async findVerifiedWallets(limit: number = 100): Promise<WalletConnection[]> {
    try {
      const query = `
        SELECT * FROM wallet_connections
        WHERE is_verified = TRUE
        ORDER BY connected_at DESC
        LIMIT $1
      `;
      
      const result = await this.db.query<WalletConnection>(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding verified wallet connections', { error, limit });
      throw error;
    }
  }
  
  /**
   * Count wallet connections (optionally filtered by verified status)
   */
  async countWalletConnections(
    options: { verified?: boolean; daysAgo?: number } = {}
  ): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM wallet_connections WHERE 1=1';
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      // Filter by verification status if provided
      if (options.verified !== undefined) {
        query += ` AND is_verified = $${paramIndex++}`;
        queryParams.push(options.verified);
      }
      
      // Filter by connection date if provided
      if (options.daysAgo !== undefined) {
        query += ` AND connected_at >= NOW() - INTERVAL '${options.daysAgo} days'`;
      }
      
      const result = await this.db.query<{ count: string }>(query, queryParams);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting wallet connections', { error, options });
      throw error;
    }
  }
}
