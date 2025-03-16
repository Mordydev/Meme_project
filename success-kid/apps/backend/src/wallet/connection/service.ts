/**
 * Wallet Connection Service
 * 
 * Handles wallet connection, tracking, and management.
 */
import { v4 as uuidv4 } from 'uuid';
import { WalletRepository } from '../../repositories/wallet-repository';
import { CreateWalletConnectionDto, WalletConnection } from '../../models/entities/wallet.model';
import { logger } from '../../lib/logger';
import { isValidAddress } from '../../blockchain/utils/address';
import { AppError, ConflictError, ValidationError } from '../../errors';

/**
 * Wallet Connection Service
 */
export class WalletConnectionService {
  /**
   * Create wallet connection service
   * 
   * @param walletRepository Wallet repository
   */
  constructor(private readonly walletRepository: WalletRepository) {}

  /**
   * Connect a wallet to a user account
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param walletType Wallet type (phantom, etc.)
   * @param isPrimary Whether this is the primary wallet
   * @returns Wallet connection
   */
  async connectWallet(
    userId: string,
    walletAddress: string,
    walletType: string = 'phantom',
    isPrimary: boolean = false
  ): Promise<WalletConnection> {
    logger.info('Connecting wallet', { userId, walletAddress, walletType });
    
    // Validate wallet address
    if (!isValidAddress(walletAddress)) {
      throw new ValidationError('Invalid wallet address format');
    }
    
    // Check if wallet already connected to another user
    const existingConnection = await this.walletRepository.findByAddress(walletAddress);
    if (existingConnection && existingConnection.user_id !== userId) {
      throw new ConflictError('Wallet already connected to another account');
    }
    
    // Create or update connection
    if (existingConnection && existingConnection.user_id === userId) {
      logger.info('Wallet already connected to this user', { userId, walletAddress });
      
      // Update the wallet connection
      const updateResult = await this.walletRepository.updateWalletConnection(
        existingConnection.id,
        { is_primary: isPrimary }
      );
      
      if (!updateResult) {
        throw new AppError('Failed to update existing wallet connection', 'DATABASE_ERROR', 500);
      }
      
      return updateResult;
    }
    
    // Create new wallet connection
    const walletData: CreateWalletConnectionDto = {
      user_id: userId,
      wallet_address: walletAddress,
      wallet_type: walletType as any, // Type conversion
      is_verified: false,
      is_primary: isPrimary,
      display_name: `${walletType} Wallet`
    };
    
    const connection = await this.walletRepository.createWalletConnection(walletData);
    logger.info('Wallet connected successfully', { userId, walletAddress, connectionId: connection.id });
    
    return connection;
  }

  /**
   * Disconnect a wallet from a user account
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns True if disconnected, false if not found
   */
  async disconnectWallet(userId: string, walletAddress: string): Promise<boolean> {
    logger.info('Disconnecting wallet', { userId, walletAddress });
    
    // Find the wallet connection
    const existingConnection = await this.walletRepository.findByAddress(walletAddress);
    
    if (!existingConnection || existingConnection.user_id !== userId) {
      logger.warn('Wallet not found or not connected to this user', { userId, walletAddress });
      return false;
    }
    
    // Delete the connection
    const deleteResult = await this.walletRepository.delete(existingConnection.id);
    
    if (deleteResult) {
      logger.info('Wallet disconnected successfully', { userId, walletAddress });
    }
    
    return deleteResult;
  }

  /**
   * Get wallet connections for a user
   * 
   * @param userId User ID
   * @returns Array of wallet connections
   */
  async getWalletsByUser(userId: string): Promise<WalletConnection[]> {
    logger.info('Getting wallets for user', { userId });
    
    return this.walletRepository.findByUserId(userId);
  }

  /**
   * Get primary wallet for a user
   * 
   * @param userId User ID
   * @returns Primary wallet or null if not found
   */
  async getPrimaryWallet(userId: string): Promise<WalletConnection | null> {
    logger.info('Getting primary wallet for user', { userId });
    
    return this.walletRepository.findPrimaryWallet(userId);
  }

  /**
   * Set a wallet as primary
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns Updated wallet connection
   */
  async setPrimaryWallet(userId: string, walletAddress: string): Promise<WalletConnection | null> {
    logger.info('Setting primary wallet', { userId, walletAddress });
    
    // Find the wallet connection
    const existingConnection = await this.walletRepository.findByAddress(walletAddress);
    
    if (!existingConnection || existingConnection.user_id !== userId) {
      logger.warn('Wallet not found or not connected to this user', { userId, walletAddress });
      throw new ValidationError('Wallet not found or not connected to this user');
    }
    
    // Set as primary
    return this.walletRepository.updateWalletConnection(
      existingConnection.id,
      { is_primary: true }
    );
  }

  /**
   * Check if a wallet is connected to a user
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns True if connected, false otherwise
   */
  async isWalletConnectedToUser(userId: string, walletAddress: string): Promise<boolean> {
    logger.info('Checking if wallet is connected to user', { userId, walletAddress });
    
    const connection = await this.walletRepository.findByAddress(walletAddress);
    
    return !!connection && connection.user_id === userId;
  }
}
