/**
 * Wallet Service
 * 
 * Business logic for wallet operations and verification
 */
import { randomUUID } from 'crypto';
import { walletRepository } from '../repositories';
import { Wallet, CreateWalletInput } from '../models/wallet';
import { auditLogger } from '../auth/audit';
import { logger } from '../lib/logger';
import { redis } from '../lib/redis';
import { ValidationError, NotFoundError } from '../errors';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

// Message signing session TTL (5 minutes)
const MESSAGE_SESSION_TTL = 5 * 60;

export class WalletService {
  /**
   * Connect a wallet to a user
   */
  async connectWalletToUser(userId: string, walletAddress: string): Promise<Wallet> {
    try {
      // Check if wallet is already connected to this user
      const existingWallet = await walletRepository.findByUserAndAddress(userId, walletAddress);
      
      if (existingWallet) {
        // Update existing wallet
        return await walletRepository.update(existingWallet.id, {
          is_verified: true,
          last_verified_at: new Date()
        });
      }
      
      // Check if wallet is connected to another user
      const connectedToOther = await walletRepository.findByAddress(walletAddress);
      if (connectedToOther && connectedToOther.user_id !== userId) {
        logger.warn('Wallet already connected to another user', {
          walletAddress,
          userId,
          otherUserId: connectedToOther.user_id
        });
        
        // In a real implementation, we might want to handle this differently
        // For now, we'll just create a new connection for this user
      }
      
      // Create new wallet connection
      const wallet = await walletRepository.create({
        user_id: userId,
        wallet_address: walletAddress,
        chain_type: 'solana',
        is_verified: true,
        connected_at: new Date(),
        last_verified_at: new Date()
      });
      
      // Log wallet connection
      auditLogger.logWalletConnection(userId, walletAddress, 'solana');
      
      return wallet;
    } catch (error) {
      logger.error('Error connecting wallet to user', { error, userId, walletAddress });
      throw error;
    }
  }
  
  /**
   * Disconnect a wallet from a user
   */
  async disconnectWalletFromUser(userId: string, walletAddress: string): Promise<boolean> {
    try {
      // Find wallet
      const wallet = await walletRepository.findByUserAndAddress(userId, walletAddress);
      
      if (!wallet) {
        return false;
      }
      
      // Delete wallet connection
      await walletRepository.delete(wallet.id);
      
      // Log wallet disconnection
      auditLogger.logWalletDisconnection(userId, walletAddress);
      
      return true;
    } catch (error) {
      logger.error('Error disconnecting wallet from user', { error, userId, walletAddress });
      throw error;
    }
  }
  
  /**
   * Get all wallets connected to a user
   */
  async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      return await walletRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error getting user wallets', { error, userId });
      throw error;
    }
  }
  
  /**
   * Generate a message for wallet signing
   */
  async generateSigningMessage(walletAddress: string): Promise<{ message: string; sessionId: string }> {
    try {
      // Generate session ID
      const sessionId = randomUUID();
      
      // Create message with timestamp and nonce for security
      const timestamp = Date.now();
      const nonce = randomUUID();
      
      const message = `Sign this message to authenticate with Success Kid Community Platform.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}\n\nThis signature will not trigger a blockchain transaction or incur any gas fees.`;
      
      // Store session data in Redis for later verification
      const sessionData = {
        walletAddress,
        message,
        timestamp,
        nonce,
        createdAt: Date.now()
      };
      
      await redis.setex(
        `signing:${sessionId}`,
        MESSAGE_SESSION_TTL,
        JSON.stringify(sessionData)
      );
      
      return { message, sessionId };
    } catch (error) {
      logger.error('Error generating signing message', { error, walletAddress });
      throw error;
    }
  }
  
  /**
   * Verify a wallet signature
   */
  async verifySignature(
    walletAddress: string,
    signature: string,
    sessionId: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Get session data from Redis
      const sessionData = await redis.get(`signing:${sessionId}`);
      
      if (!sessionData) {
        return { valid: false, error: 'Signing session expired or not found' };
      }
      
      const { message, timestamp, walletAddress: storedAddress } = JSON.parse(sessionData);
      
      // Verify wallet address matches
      if (walletAddress !== storedAddress) {
        return { valid: false, error: 'Wallet address mismatch' };
      }
      
      // Verify signature - this is Solana-specific
      const isValid = this.verifySolanaSignature(walletAddress, message, signature);
      
      if (!isValid) {
        return { valid: false, error: 'Invalid signature' };
      }
      
      // Delete session after successful verification
      await redis.del(`signing:${sessionId}`);
      
      return { valid: true };
    } catch (error) {
      logger.error('Error verifying signature', { error, walletAddress, sessionId });
      return { valid: false, error: 'Signature verification error' };
    }
  }
  
  /**
   * Verify a Solana wallet signature
   * This is a private helper method for verifying signatures from Solana wallets
   */
  private verifySolanaSignature(
    walletAddress: string,
    message: string,
    signature: string
  ): boolean {
    try {
      // Convert wallet address to public key
      const publicKey = bs58.decode(walletAddress);
      
      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(message);
      
      // Convert signature from base64 to bytes
      const signatureBytes = Buffer.from(signature, 'base64');
      
      // Verify signature using tweetnacl
      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey
      );
    } catch (error) {
      logger.error('Error in Solana signature verification', { error, walletAddress });
      return false;
    }
  }
  
  /**
   * Check if a user has a verified wallet
   */
  async hasVerifiedWallet(userId: string): Promise<boolean> {
    try {
      const wallets = await walletRepository.findByUserId(userId);
      return wallets.some(wallet => wallet.is_verified);
    } catch (error) {
      logger.error('Error checking if user has verified wallet', { error, userId });
      return false;
    }
  }
  
  /**
   * Get wallet by address
   */
  async getWalletByAddress(walletAddress: string): Promise<Wallet | null> {
    try {
      return await walletRepository.findByAddress(walletAddress);
    } catch (error) {
      logger.error('Error getting wallet by address', { error, walletAddress });
      throw error;
    }
  }
}

// Create and export singleton instance
export const walletService = new WalletService();
