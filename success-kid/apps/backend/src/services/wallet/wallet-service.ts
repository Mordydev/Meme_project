/**
 * Wallet Service
 * 
 * Manages user wallet connections and interactions with blockchain wallets.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { ValidationError, WalletError } from '../../errors';

/**
 * Interface for wallet connection data
 */
export interface WalletConnection {
  id: string;
  userId: string;
  address: string;
  chainId: string;
  isVerified: boolean;
  connectedAt: Date;
  verifiedAt?: Date;
  lastUsedAt?: Date;
}

/**
 * Service for managing user wallets
 */
export class WalletService {
  /**
   * Create a new WalletService
   * 
   * @param db Database connection pool
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private db: Pool,
    private eventBus: EventBus
  ) {}

  /**
   * Connect a wallet to a user account
   * 
   * @param userId User ID
   * @param address Wallet address
   * @param chainId Chain ID
   * @param signature Optional signature for verification
   * @returns Connected wallet
   */
  async connectWallet(
    userId: string,
    address: string,
    chainId: string,
    signature?: string
  ): Promise<WalletConnection> {
    try {
      // Check if wallet is already connected to this user
      const existingWallet = await this.getUserWalletByAddress(address);
      
      if (existingWallet) {
        if (existingWallet.userId === userId) {
          // Already connected to this user, update last used
          await this.db.query(
            'UPDATE wallet_connections SET last_used_at = NOW() WHERE id = $1',
            [existingWallet.id]
          );
          
          return existingWallet;
        } else {
          // Connected to another user
          throw new ValidationError('Wallet is already connected to another account');
        }
      }
      
      // Check if signature is provided for verification
      const isVerified = !!signature;
      
      // Create wallet connection
      const wallet = await this.createWalletConnection({
        userId,
        address,
        chainId,
        isVerified,
        signature
      });
      
      // Emit event
      await this.eventBus.publish(EventType.WALLET_CONNECTED, {
        userId,
        walletAddress: address,
        chainId,
        isVerified
      });
      
      return wallet;
    } catch (error) {
      logger.error('Error connecting wallet', { userId, address, error });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new WalletError('Failed to connect wallet', error);
    }
  }
  
  /**
   * Get user's connected wallet
   * 
   * @param userId User ID
   * @returns Connected wallet or null if not found
   */
  async getUserWallet(userId: string): Promise<WalletConnection | null> {
    try {
      const result = await this.db.query(
        `SELECT 
          id, user_id, address, chain_id, is_verified, 
          connected_at, verified_at, last_used_at
        FROM wallet_connections
        WHERE user_id = $1
        ORDER BY connected_at DESC
        LIMIT 1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const wallet = result.rows[0];
      
      return {
        id: wallet.id,
        userId: wallet.user_id,
        address: wallet.address,
        chainId: wallet.chain_id,
        isVerified: wallet.is_verified,
        connectedAt: wallet.connected_at,
        verifiedAt: wallet.verified_at,
        lastUsedAt: wallet.last_used_at
      };
    } catch (error) {
      logger.error('Error getting user wallet', { userId, error });
      return null;
    }
  }
  
  /**
   * Check if user has a connected wallet
   * 
   * @param userId User ID
   * @returns Whether user has a connected wallet
   */
  async hasConnectedWallet(userId: string): Promise<boolean> {
    const wallet = await this.getUserWallet(userId);
    return !!wallet;
  }
  
  /**
   * Get wallet by address
   * 
   * @param address Wallet address
   * @returns Connected wallet or null if not found
   */
  async getUserWalletByAddress(address: string): Promise<WalletConnection | null> {
    try {
      const result = await this.db.query(
        `SELECT 
          id, user_id, address, chain_id, is_verified, 
          connected_at, verified_at, last_used_at
        FROM wallet_connections
        WHERE address = $1`,
        [address]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const wallet = result.rows[0];
      
      return {
        id: wallet.id,
        userId: wallet.user_id,
        address: wallet.address,
        chainId: wallet.chain_id,
        isVerified: wallet.is_verified,
        connectedAt: wallet.connected_at,
        verifiedAt: wallet.verified_at,
        lastUsedAt: wallet.last_used_at
      };
    } catch (error) {
      logger.error('Error getting wallet by address', { address, error });
      return null;
    }
  }
  
  /**
   * Create a wallet connection
   * 
   * @param data Wallet data
   * @returns Created wallet connection
   */
  private async createWalletConnection(data: {
    userId: string;
    address: string;
    chainId: string;
    isVerified: boolean;
    signature?: string;
  }): Promise<WalletConnection> {
    const now = new Date();
    
    const result = await this.db.query(
      `INSERT INTO wallet_connections(
        id, user_id, address, chain_id, is_verified, 
        connected_at, verified_at, last_used_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        uuidv4(),
        data.userId,
        data.address,
        data.chainId,
        data.isVerified,
        now,
        data.isVerified ? now : null,
        now
      ]
    );
    
    const wallet = result.rows[0];
    
    return {
      id: wallet.id,
      userId: wallet.user_id,
      address: wallet.address,
      chainId: wallet.chain_id,
      isVerified: wallet.is_verified,
      connectedAt: wallet.connected_at,
      verifiedAt: wallet.verified_at,
      lastUsedAt: wallet.last_used_at
    };
  }
  
  /**
   * Verify a wallet connection with a signature
   * 
   * @param userId User ID
   * @param address Wallet address
   * @param signature Signature
   * @returns Verified wallet connection
   */
  async verifyWallet(
    userId: string,
    address: string,
    signature: string
  ): Promise<WalletConnection> {
    try {
      // Get current wallet connection
      const wallet = await this.getUserWalletByAddress(address);
      
      if (!wallet) {
        throw new ValidationError('Wallet not found');
      }
      
      if (wallet.userId !== userId) {
        throw new ValidationError('Wallet belongs to another user');
      }
      
      if (wallet.isVerified) {
        // Already verified
        return wallet;
      }
      
      // In a real implementation, verify the signature here
      // For now, assume it's valid
      
      // Update wallet to verified
      const result = await this.db.query(
        `UPDATE wallet_connections 
        SET is_verified = true, verified_at = NOW(), last_used_at = NOW() 
        WHERE id = $1
        RETURNING *`,
        [wallet.id]
      );
      
      const updatedWallet = result.rows[0];
      
      // Emit event
      await this.eventBus.publish(EventType.WALLET_VERIFIED, {
        userId,
        walletAddress: address,
        chainId: wallet.chainId
      });
      
      return {
        id: updatedWallet.id,
        userId: updatedWallet.user_id,
        address: updatedWallet.address,
        chainId: updatedWallet.chain_id,
        isVerified: updatedWallet.is_verified,
        connectedAt: updatedWallet.connected_at,
        verifiedAt: updatedWallet.verified_at,
        lastUsedAt: updatedWallet.last_used_at
      };
    } catch (error) {
      logger.error('Error verifying wallet', { userId, address, error });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new WalletError('Failed to verify wallet', error);
    }
  }
  
  /**
   * Disconnect a wallet
   * 
   * @param userId User ID
   * @param address Wallet address
   * @returns Whether the disconnection was successful
   */
  async disconnectWallet(userId: string, address: string): Promise<boolean> {
    try {
      const wallet = await this.getUserWalletByAddress(address);
      
      if (!wallet) {
        throw new ValidationError('Wallet not found');
      }
      
      if (wallet.userId !== userId) {
        throw new ValidationError('Wallet belongs to another user');
      }
      
      // Delete wallet connection
      await this.db.query(
        'DELETE FROM wallet_connections WHERE id = $1',
        [wallet.id]
      );
      
      // Emit event
      await this.eventBus.publish(EventType.WALLET_DISCONNECTED, {
        userId,
        walletAddress: address
      });
      
      return true;
    } catch (error) {
      logger.error('Error disconnecting wallet', { userId, address, error });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      return false;
    }
  }
}
