/**
 * Enhanced Wallet Verification Service
 * 
 * Handles the verification of wallet ownership through message signing with
 * improved security, error handling, and user experience.
 */
import { v4 as uuidv4 } from 'uuid';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { logger } from '../../lib/logger';
import { getBlockchainProviderManager } from '../../blockchain/providers/provider-manager';
import { WalletRepository } from '../../repositories/wallet-repository';
import { 
  WalletVerificationError,
  ValidationError,
  SystemError
} from '../../errors';

// Verification message expiration (15 minutes)
const MESSAGE_EXPIRATION = 15 * 60 * 1000;

// Maximum verification attempts before temporary block
const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Verification session
 */
interface VerificationSession {
  id: string;
  userId: string;
  walletAddress: string;
  message: string;
  nonce: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
}

/**
 * Verification result
 */
interface VerificationResult {
  success: boolean;
  walletAddress: string;
  isVerified: boolean;
  userId: string;
  verifiedAt?: Date;
  error?: string;
}

/**
 * Enhanced wallet verification service
 */
export class EnhancedWalletVerificationService {
  // In-memory store of verification sessions (would move to Redis in production)
  private verificationSessions: Map<string, VerificationSession> = new Map();
  
  /**
   * Create wallet verification service
   * 
   * @param walletRepository Wallet repository
   */
  constructor(private readonly walletRepository: WalletRepository) {
    // Start cleanup of expired sessions
    this.scheduleSessionCleanup();
  }
  
  /**
   * Schedule periodic cleanup of expired verification sessions
   */
  private scheduleSessionCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Check every minute
  }
  
  /**
   * Clean up expired verification sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let expiredCount = 0;
    
    for (const [id, session] of this.verificationSessions.entries()) {
      if (session.expiresAt < now) {
        this.verificationSessions.delete(id);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug(`Cleaned up ${expiredCount} expired verification sessions`);
    }
  }
  
  /**
   * Create a verification session for wallet ownership verification
   * 
   * @param userId User ID
   * @param walletAddress Wallet address to verify
   * @returns Verification session details
   */
  async createVerificationSession(
    userId: string, 
    walletAddress: string
  ): Promise<{ sessionId: string; message: string; expiresAt: Date }> {
    logger.info('Creating wallet verification session', { userId, walletAddress });
    
    // Validate wallet address format
    const blockchainManager = getBlockchainProviderManager();
    if (!blockchainManager.isAddressValid(walletAddress)) {
      throw new ValidationError('Invalid wallet address format');
    }
    
    // Check if wallet already connected to another user
    const existingWallet = await this.walletRepository.findByAddress(walletAddress);
    if (existingWallet && existingWallet.userId !== userId && existingWallet.isVerified) {
      throw new ValidationError('Wallet already connected to another account');
    }
    
    // Generate unique session ID
    const sessionId = uuidv4();
    
    // Generate unique nonce
    const nonce = uuidv4();
    
    // Get current timestamp
    const now = new Date();
    
    // Calculate expiration time
    const expiresAt = new Date(now.getTime() + MESSAGE_EXPIRATION);
    
    // Create verification message
    const message = this.createVerificationMessage(userId, walletAddress, nonce, expiresAt);
    
    // Store verification session
    const session: VerificationSession = {
      id: sessionId,
      userId,
      walletAddress,
      message,
      nonce,
      createdAt: now,
      expiresAt,
      attempts: 0
    };
    
    this.verificationSessions.set(sessionId, session);
    
    logger.info('Wallet verification session created', { 
      sessionId,
      userId,
      walletAddress,
      expiresAt
    });
    
    return {
      sessionId,
      message,
      expiresAt
    };
  }
  
  /**
   * Create a verification message for signing
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param nonce Unique nonce
   * @param expiresAt Expiration date
   * @returns Message to sign
   */
  private createVerificationMessage(
    userId: string,
    walletAddress: string,
    nonce: string,
    expiresAt: Date
  ): string {
    return [
      'Sign this message to verify your wallet address ownership on Success Kid Community Platform.',
      '',
      `Wallet address: ${walletAddress}`,
      `User ID: ${userId}`,
      `Nonce: ${nonce}`,
      `Expires: ${expiresAt.toISOString()}`,
      '',
      'This signature will never be used for any blockchain transactions or to authorize any transfers.',
      'It is only used for verification purposes.'
    ].join('\n');
  }
  
  /**
   * Verify wallet ownership from signature
   * 
   * @param sessionId Verification session ID
   * @param signature Signature to verify
   * @returns Verification result
   */
  async verifySignature(
    sessionId: string, 
    signature: string
  ): Promise<VerificationResult> {
    logger.info('Verifying wallet signature', { sessionId });
    
    // Get verification session
    const session = this.verificationSessions.get(sessionId);
    
    if (!session) {
      throw new WalletVerificationError('Verification session not found');
    }
    
    // Check if session has expired
    if (session.expiresAt < new Date()) {
      this.verificationSessions.delete(sessionId);
      throw new WalletVerificationError('Verification session has expired');
    }
    
    // Check if too many attempts
    session.attempts += 1;
    if (session.attempts > MAX_VERIFICATION_ATTEMPTS) {
      this.verificationSessions.delete(sessionId);
      throw new WalletVerificationError('Too many verification attempts. Please start a new verification process.');
    }
    
    try {
      // For Solana: Verify the signature using native verification
      const messageBytes = new TextEncoder().encode(session.message);
      const signatureBytes = bs58.decode(signature);
      
      // Get wallet public key
      const publicKeyBytes = bs58.decode(session.walletAddress);
      
      // Verify using the tweetnacl library for Solana
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
      
      if (!isValid) {
        logger.warn('Invalid signature for wallet verification', {
          sessionId,
          walletAddress: session.walletAddress
        });
        
        return {
          success: false,
          walletAddress: session.walletAddress,
          isVerified: false,
          userId: session.userId,
          error: 'Invalid signature'
        };
      }
      
      // Update wallet verification status in database
      const verifiedAt = new Date();
      const updatedWallet = await this.walletRepository.updateVerificationStatus(
        session.userId,
        session.walletAddress,
        true,
        verifiedAt
      );
      
      if (!updatedWallet) {
        throw new SystemError('Failed to update wallet verification status');
      }
      
      // Cleanup session
      this.verificationSessions.delete(sessionId);
      
      logger.info('Wallet verification successful', {
        userId: session.userId,
        walletAddress: session.walletAddress
      });
      
      return {
        success: true,
        walletAddress: session.walletAddress,
        isVerified: true,
        userId: session.userId,
        verifiedAt
      };
    } catch (error) {
      // Keep track of attempt but don't delete session yet
      logger.error('Error verifying wallet signature', {
        sessionId,
        walletAddress: session.walletAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof WalletVerificationError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new WalletVerificationError('Failed to verify signature');
    }
  }
  
  /**
   * Check if a wallet is verified for a user
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns True if wallet is verified for the user
   */
  async isWalletVerified(userId: string, walletAddress: string): Promise<boolean> {
    const wallet = await this.walletRepository.findByUserAndAddress(userId, walletAddress);
    return wallet ? wallet.isVerified : false;
  }
  
  /**
   * Check if a wallet address is already verified for any user
   * 
   * @param walletAddress Wallet address to check
   * @returns True if wallet is already verified for any user
   */
  async isWalletAddressVerified(walletAddress: string): Promise<boolean> {
    const wallet = await this.walletRepository.findByAddress(walletAddress);
    return wallet ? wallet.isVerified : false;
  }
  
  /**
   * Reset verification status for a wallet
   * 
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns True if reset was successful
   */
  async resetVerificationStatus(userId: string, walletAddress: string): Promise<boolean> {
    const result = await this.walletRepository.updateVerificationStatus(
      userId,
      walletAddress,
      false,
      null
    );
    
    return !!result;
  }
}
