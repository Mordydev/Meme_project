import { 
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Connection,
  Keypair
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { logger } from '../../lib/logger';
import { AppError, ValidationError } from '../../lib/errors';
import { redisClient } from '../../lib/redis-client';

// Message nonce TTL in seconds (5 minutes)
const MESSAGE_NONCE_TTL = 5 * 60;

/**
 * Service for wallet-based authentication
 */
export class WalletAuthService {
  /**
   * Generate a challenge message for wallet signature verification
   * 
   * @param walletAddress Wallet address to verify
   * @returns Challenge message and nonce
   */
  async generateChallengeMessage(walletAddress: string): Promise<{ message: string; nonce: string }> {
    try {
      // Validate wallet address
      this.validateWalletAddress(walletAddress);
      
      // Generate random nonce
      const nonce = Math.floor(Math.random() * 1000000).toString();
      
      // Generate challenge message
      const message = `Sign this message to verify wallet ownership for Success Kid Platform. Nonce: ${nonce}`;
      
      // Store nonce in Redis with expiration
      await redisClient.set(
        `wallet:challenge:${walletAddress}`, 
        nonce, 
        'EX', 
        MESSAGE_NONCE_TTL
      );
      
      return { message, nonce };
    } catch (error) {
      logger.error('Error generating challenge message', { walletAddress, error });
      throw new AppError('Failed to generate challenge message', 'WALLET_ERROR', 500);
    }
  }
  
  /**
   * Verify a wallet signature
   * 
   * @param walletAddress Wallet address
   * @param signature Signature to verify
   * @param nonce Nonce used in the original message
   * @returns True if signature is valid
   */
  async verifyWalletSignature(walletAddress: string, signature: string, nonce: string): Promise<boolean> {
    try {
      // Validate inputs
      this.validateWalletAddress(walletAddress);
      
      if (!signature) {
        throw new ValidationError('Signature is required');
      }
      
      if (!nonce) {
        throw new ValidationError('Nonce is required');
      }
      
      // Retrieve stored nonce
      const storedNonce = await redisClient.get(`wallet:challenge:${walletAddress}`);
      
      // Check if nonce exists and matches
      if (!storedNonce) {
        logger.warn('Challenge nonce not found or expired', { walletAddress });
        return false;
      }
      
      if (storedNonce !== nonce) {
        logger.warn('Challenge nonce mismatch', { walletAddress, nonce, storedNonce });
        return false;
      }
      
      // Recreate message that was signed
      const message = `Sign this message to verify wallet ownership for Success Kid Platform. Nonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(message);
      
      // Convert wallet address to public key
      const publicKey = new PublicKey(walletAddress);
      
      // Decode signature
      const signatureBytes = bs58.decode(signature);
      
      // Verify signature
      const result = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );
      
      // Clean up - remove nonce after verification
      await redisClient.del(`wallet:challenge:${walletAddress}`);
      
      return result;
    } catch (error) {
      logger.error('Error verifying wallet signature', { walletAddress, error });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new AppError('Failed to verify wallet signature', 'WALLET_VERIFICATION_FAILED', 500);
    }
  }
  
  /**
   * Associate a wallet with a user account
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param verified Whether the wallet has been verified
   */
  async linkWalletToUser(userId: string, walletAddress: string, verified: boolean = false): Promise<void> {
    try {
      // Validate wallet address
      this.validateWalletAddress(walletAddress);
      
      // TODO: Add wallet to user's profile in database
      // This is a placeholder for actual database integration
      logger.info('Linking wallet to user', { userId, walletAddress, verified });
      
      // For now, we'll just log this operation
      // In a real implementation, this would update a database record
    } catch (error) {
      logger.error('Error linking wallet to user', { userId, walletAddress, error });
      throw new AppError('Failed to link wallet to user', 'WALLET_LINK_FAILED', 500);
    }
  }
  
  /**
   * Remove wallet association from a user account
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   */
  async unlinkWalletFromUser(userId: string, walletAddress: string): Promise<void> {
    try {
      // Validate wallet address
      this.validateWalletAddress(walletAddress);
      
      // TODO: Remove wallet from user's profile in database
      // This is a placeholder for actual database integration
      logger.info('Unlinking wallet from user', { userId, walletAddress });
      
      // For now, we'll just log this operation
      // In a real implementation, this would update a database record
    } catch (error) {
      logger.error('Error unlinking wallet from user', { userId, walletAddress, error });
      throw new AppError('Failed to unlink wallet from user', 'WALLET_UNLINK_FAILED', 500);
    }
  }
  
  /**
   * Validate wallet address format
   * 
   * @param walletAddress Wallet address to validate
   * @throws ValidationError if address is invalid
   */
  private validateWalletAddress(walletAddress: string): void {
    if (!walletAddress) {
      throw new ValidationError('Wallet address is required');
    }
    
    try {
      // Attempt to create a PublicKey object to validate the address
      new PublicKey(walletAddress);
    } catch (error) {
      throw new ValidationError('Invalid wallet address format');
    }
  }
}

// Export singleton instance
export const walletAuthService = new WalletAuthService();
