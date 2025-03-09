import { Logger } from 'pino';
import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';
import * as nacl from 'tweetnacl';
import { WalletRepository } from '../repositories/wallet-repository';
import { BlockchainService } from './blockchain-service';
import { EventEmitter, EventType } from '../lib/events';
import { TokenService } from './token-service';
import { AppError, ValidationError, NotFoundError } from '../lib/errors';
import { 
  WalletVerification,
  UserWallet,
  TokenHolderTier
} from '../models/wallet';
import { AuditService } from './core/audit-service';

/**
 * Service for wallet-related operations
 */
export class WalletService {
  constructor(
    private walletRepository: WalletRepository,
    private blockchainService: BlockchainService,
    private tokenService: TokenService,
    private auditService: AuditService,
    private eventEmitter: EventEmitter,
    private logger: Logger
  ) {}
  
  /**
   * Generate a verification message for wallet ownership proof
   * @param userId User ID
   * @returns The verification message
   */
  async generateVerificationMessage(userId: string): Promise<{ message: string; expires: Date }> {
    // Delete any existing verification messages
    await this.walletRepository.deleteVerificationMessages(userId);
    
    // Create new verification message
    const verificationMessage = await this.walletRepository.createVerificationMessage(userId);
    
    return {
      message: verificationMessage.message,
      expires: verificationMessage.expires
    };
  }
  
  /**
   * Verify wallet ownership using signature
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param signature Signature of the verification message
   * @returns Wallet verification result
   */
  async verifyWallet(
    userId: string,
    walletAddress: string,
    signature: string
  ): Promise<WalletVerification> {
    // Get stored verification message
    const verification = await this.walletRepository.getVerificationMessage(userId);
    
    if (!verification || new Date() > verification.expires) {
      throw AppError.validation('Verification expired or not found');
    }
    
    // Verify signature validity
    try {
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(verification.message);
      const signatureBytes = bs58.decode(signature);
      
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );
      
      if (!isValid) {
        // Log verification attempt for security monitoring
        await this.auditService.logSecurityEvent(
          'wallet_verification_failed',
          userId,
          { walletAddress, reason: 'invalid_signature' },
          'medium'
        );
        
        throw AppError.validation('Invalid signature');
      }
      
      // Verify wallet not already associated with another user
      const existingUser = await this.walletRepository.getUserByWalletAddress(walletAddress);
      if (existingUser && existingUser.id !== userId) {
        throw AppError.validation('Wallet already associated with another account');
      }
      
      // Associate wallet with user
      const wallet = await this.walletRepository.saveUserWallet(
        userId, 
        walletAddress, 
        'phantom', 
        true
      );
      
      // Emit wallet connected event
      await this.eventEmitter.emit(EventType.WALLET_CONNECTED, {
        userId,
        walletAddress,
        timestamp: new Date().toISOString()
      });
      
      // Update token holdings in the background
      this.updateTokenHoldings(userId, walletAddress)
        .catch(error => {
          this.logger.error(
            { error, userId, walletAddress }, 
            'Failed to update token holdings after verification'
          );
        });
      
      return {
        userId,
        walletAddress,
        verified: true,
        verifiedAt: wallet.verifiedAt || new Date()
      };
    } catch (error) {
      // Handle different error types
      if (error instanceof AppError) throw error;
      
      // Log unexpected errors
      this.logger.error({ error, userId, walletAddress }, 'Wallet verification error');
      throw AppError.validation('Wallet verification failed');
    }
  }
  
  /**
   * Connect a wallet without full verification (temporary association)
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns The connected wallet
   */
  async connectWallet(userId: string, walletAddress: string): Promise<UserWallet> {
    try {
      // Validate wallet address format
      new PublicKey(walletAddress);
      
      // Save unverified wallet connection
      const wallet = await this.walletRepository.saveUserWallet(
        userId,
        walletAddress,
        'phantom',
        false
      );
      
      // Emit wallet connected event
      await this.eventEmitter.emit(EventType.WALLET_CONNECTED, {
        userId,
        walletAddress,
        timestamp: new Date().toISOString()
      });
      
      return wallet;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      
      this.logger.error({ error, userId, walletAddress }, 'Wallet connection error');
      throw AppError.validation('Invalid wallet address');
    }
  }
  
  /**
   * Update token holdings for a user's wallet
   * @param userId User ID
   * @param walletAddress Wallet address
   * @returns Success indicator
   */
  async updateTokenHoldings(userId: string, walletAddress: string): Promise<boolean> {
    try {
      // Get wallet
      const wallet = await this.walletRepository.getUserWallet(userId);
      
      if (!wallet || !wallet.verified) {
        throw AppError.validation('No verified wallet found for user');
      }
      
      // Get token balance from blockchain
      const tokenAmount = await this.blockchainService.getTokenBalance(walletAddress);
      
      // Determine tier based on token amount
      const tier = this.tokenService.getUserTier(tokenAmount);
      
      // Update holdings record
      await this.walletRepository.updateUserTokenHoldings(
        userId,
        wallet.id,
        tokenAmount,
        tier.name
      );
      
      // Update user benefits
      await this.tokenService.refreshUserBenefits(userId);
      
      return true;
    } catch (error) {
      this.logger.error({ error, userId, walletAddress }, 'Failed to update token holdings');
      
      // Don't throw error, just return false to indicate failure
      return false;
    }
  }
  
  /**
   * Get a user's wallet
   * @param userId User ID
   * @returns The user's wallet or null if not found
   */
  async getUserWallet(userId: string): Promise<UserWallet | null> {
    return this.walletRepository.getUserWallet(userId);
  }
  
  /**
   * Disconnect a user's wallet
   * @param userId User ID
   * @returns Success indicator
   */
  async disconnectWallet(userId: string): Promise<boolean> {
    const wallet = await this.walletRepository.getUserWallet(userId);
    
    if (!wallet) {
      throw new NotFoundError('Wallet');
    }
    
    // Delete wallet
    await this.db.from('user_wallets').delete().eq('id', wallet.id);
    
    // Remove token holdings
    await this.db.from('user_token_holdings').delete().eq('userId', userId);
    
    // Remove benefits
    await this.walletRepository.updateUserTokenBenefits(userId, {
      holdings: 0,
      tier: TokenHolderTier.BRONZE,
      updatedAt: new Date(),
      benefits: [],
      multiplier: 1
    });
    
    return true;
  }
}
