/**
 * Wallet Verification Service
 * 
 * Handles wallet ownership verification through cryptographic signatures.
 */
import { randomBytes } from 'crypto';
import { WalletRepository } from '../../repositories/wallet-repository';
import { WalletConnection } from '../../models/entities/wallet.model';
import { logger } from '../../lib/logger';
import { ValidationError, NotFoundError } from '../../errors';
import { getBlockchainProviderFactory } from '../../blockchain';

/**
 * Verification message data
 */
export interface VerificationMessage {
  message: string;
  userId: string;
  walletAddress: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Verification status response
 */
export interface VerificationStatus {
  isVerified: boolean;
  walletAddress: string;
  lastVerified?: Date;
}

/**
 * Wallet verification service
 */
export class WalletVerificationService {
  // In-memory store of verification requests
  // In production, use Redis or another distributed store
  private verificationRequests = new Map<string, VerificationMessage>();
  
  /**
   * Create wallet verification service
   * 
   * @param walletRepository Wallet repository
   */
  constructor(private readonly walletRepository: WalletRepository) {}

  /**
   * Generate a verification message for signing
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns Verification message data
   */
  generateVerificationMessage(userId: string, walletAddress: string): VerificationMessage {
    logger.info('Generating verification message', { userId, walletAddress });
    
    const nonce = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + (5 * 60 * 1000); // 5 minutes
    
    const message = `Connect wallet to Success Kid Platform\n\nWallet: ${walletAddress}\nUser: ${userId}\nNonce: ${nonce}\nTimestamp: ${timestamp}\nExpires: ${expiresAt}`;
    
    // Store verification request
    const verificationData: VerificationMessage = {
      message,
      userId,
      walletAddress,
      nonce,
      timestamp,
      expiresAt
    };
    
    this.verificationRequests.set(`${userId}:${walletAddress}`, verificationData);
    
    return verificationData;
  }

  /**
   * Verify a wallet signature
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param signature Signature
   * @param message Message that was signed
   * @returns Updated wallet connection
   */
  async verifySignature(
    userId: string,
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<WalletConnection> {
    logger.info('Verifying wallet signature', { userId, walletAddress });
    
    // Get the verification request
    const requestKey = `${userId}:${walletAddress}`;
    const verificationRequest = this.verificationRequests.get(requestKey);
    
    if (!verificationRequest) {
      throw new ValidationError('No pending verification request found');
    }
    
    // Check if expired
    if (Date.now() > verificationRequest.expiresAt) {
      this.verificationRequests.delete(requestKey);
      throw new ValidationError('Verification request expired');
    }
    
    // Check if message matches
    if (message !== verificationRequest.message) {
      throw new ValidationError('Invalid message content');
    }
    
    // Check if wallet exists
    const wallet = await this.walletRepository.findByAddress(walletAddress);
    
    if (!wallet) {
      throw new NotFoundError('Wallet connection not found');
    }
    
    if (wallet.user_id !== userId) {
      throw new ValidationError('Wallet not connected to this user');
    }
    
    try {
      // Get blockchain provider for this wallet
      const providerFactory = getBlockchainProviderFactory();
      const provider = providerFactory.getProviderForAddress(walletAddress);
      
      // Verify signature
      const verificationResult = await provider.verifyMessage(
        walletAddress,
        message,
        signature
      );
      
      if (!verificationResult.verified) {
        throw new ValidationError('Invalid signature');
      }
      
      // Mark wallet as verified
      const updatedWallet = await this.walletRepository.updateWalletConnection(
        wallet.id,
        { is_verified: true }
      );
      
      if (!updatedWallet) {
        throw new Error('Failed to update wallet verification status');
      }
      
      // Clear the verification request
      this.verificationRequests.delete(requestKey);
      
      logger.info('Wallet verified successfully', { userId, walletAddress });
      
      return updatedWallet;
    } catch (error) {
      logger.error('Error verifying wallet signature', { 
        userId, 
        walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new ValidationError('Signature verification failed');
    }
  }

  /**
   * Get verification status for a wallet
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns Verification status
   */
  async getVerificationStatus(userId: string, walletAddress: string): Promise<VerificationStatus> {
    logger.info('Getting verification status', { userId, walletAddress });
    
    const wallet = await this.walletRepository.findByAddress(walletAddress);
    
    if (!wallet) {
      throw new NotFoundError('Wallet connection not found');
    }
    
    if (wallet.user_id !== userId) {
      throw new ValidationError('Wallet not connected to this user');
    }
    
    return {
      isVerified: wallet.is_verified,
      walletAddress: wallet.wallet_address,
      lastVerified: wallet.last_verified_at || undefined
    };
  }
}
