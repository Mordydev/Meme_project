import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';
import { nanoid } from 'nanoid';
import { 
  UserWallet, 
  WalletVerificationMessage, 
  UserTokenHoldings, 
  TokenHolderTier, 
  UserTokenBenefits, 
  TokenBenefit 
} from '../models/wallet';
import { ConflictError, NotFoundError } from '../lib/errors';

/**
 * Repository for wallet-related data
 */
export class WalletRepository extends BaseRepository<UserWallet> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'user_wallets');
  }
  
  /**
   * Create a verification message for a user
   * @param userId User ID
   * @returns The verification message
   */
  async createVerificationMessage(userId: string): Promise<WalletVerificationMessage> {
    // Generate a message with a nonce
    const nonce = nanoid(16);
    const message = `Verify your wallet ownership for Wild 'n Out platform. Nonce: ${nonce}`;
    
    // Set expiration time (10 minutes)
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    
    // Store verification message
    const { data, error } = await this.db
      .from('wallet_verification_messages')
      .insert({
        userId,
        message,
        expires,
        createdAt: new Date()
      })
      .select()
      .single();
    
    if (error) {
      this.logger.error(error, 'Failed to create wallet verification message');
      throw new Error('Failed to create wallet verification message');
    }
    
    return data as WalletVerificationMessage;
  }
  
  /**
   * Get the verification message for a user
   * @param userId User ID
   * @returns The verification message or null if not found
   */
  async getVerificationMessage(userId: string): Promise<WalletVerificationMessage | null> {
    const { data, error } = await this.db
      .from('wallet_verification_messages')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      this.logger.error(error, 'Failed to get wallet verification message');
      throw new Error('Failed to get wallet verification message');
    }
    
    return data as WalletVerificationMessage | null;
  }
  
  /**
   * Get user wallet by address
   * @param address Wallet address
   * @returns User wallet or null if not found
   */
  async getWalletByAddress(address: string): Promise<UserWallet | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('address', address)
      .maybeSingle();
    
    if (error) {
      this.logger.error(error, 'Failed to get wallet by address');
      throw new Error('Failed to get wallet by address');
    }
    
    return data as UserWallet | null;
  }
  
  /**
   * Get user by wallet address
   * @param walletAddress Wallet address
   * @returns User ID of the wallet owner or null if not found
   */
  async getUserByWalletAddress(walletAddress: string): Promise<{ id: string; username: string } | null> {
    const { data: wallet, error: walletError } = await this.db
      .from(this.tableName)
      .select('userId')
      .eq('address', walletAddress)
      .maybeSingle();
    
    if (walletError) {
      this.logger.error(walletError, 'Failed to get user ID by wallet address');
      throw new Error('Failed to get user ID by wallet address');
    }
    
    if (!wallet) {
      return null;
    }
    
    // Get user details
    const { data: user, error: userError } = await this.db
      .from('users')
      .select('id, username')
      .eq('id', wallet.userId)
      .single();
    
    if (userError) {
      this.logger.error(userError, 'Failed to get user details by ID');
      throw new Error('Failed to get user details by ID');
    }
    
    return user;
  }
  
  /**
   * Get user wallet
   * @param userId User ID
   * @returns User wallet or null if not found
   */
  async getUserWallet(userId: string): Promise<UserWallet | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('userId', userId)
      .maybeSingle();
    
    if (error) {
      this.logger.error(error, 'Failed to get user wallet');
      throw new Error('Failed to get user wallet');
    }
    
    return data as UserWallet | null;
  }
  
  /**
   * Save or update user wallet
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param verified Whether the wallet is verified
   * @returns The user wallet
   */
  async saveUserWallet(
    userId: string, 
    walletAddress: string, 
    provider: string = 'phantom',
    verified: boolean = false
  ): Promise<UserWallet> {
    // Check if wallet already exists for another user
    const existingWallet = await this.getWalletByAddress(walletAddress);
    if (existingWallet && existingWallet.userId !== userId) {
      throw new ConflictError('Wallet already associated with another user');
    }
    
    // Check if the user already has a wallet
    const userWallet = await this.getUserWallet(userId);
    
    if (userWallet) {
      // Update existing wallet
      const { data, error } = await this.db
        .from(this.tableName)
        .update({
          address: walletAddress,
          provider,
          verified,
          verifiedAt: verified ? new Date() : userWallet.verifiedAt,
          lastUpdatedAt: new Date()
        })
        .eq('id', userWallet.id)
        .select()
        .single();
      
      if (error) {
        this.logger.error(error, 'Failed to update user wallet');
        throw new Error('Failed to update user wallet');
      }
      
      return data as UserWallet;
    } else {
      // Create new wallet
      const { data, error } = await this.db
        .from(this.tableName)
        .insert({
          userId,
          address: walletAddress,
          provider,
          verified,
          verifiedAt: verified ? new Date() : null,
          connectedAt: new Date(),
          lastUpdatedAt: new Date()
        })
        .select()
        .single();
      
      if (error) {
        this.logger.error(error, 'Failed to create user wallet');
        throw new Error('Failed to create user wallet');
      }
      
      return data as UserWallet;
    }
  }
  
  /**
   * Get user token holdings
   * @param userId User ID
   * @returns User token holdings or null if not found
   */
  async getUserTokenHoldings(userId: string): Promise<UserTokenHoldings | null> {
    const { data, error } = await this.db
      .from('user_token_holdings')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();
    
    if (error) {
      this.logger.error(error, 'Failed to get user token holdings');
      throw new Error('Failed to get user token holdings');
    }
    
    return data as UserTokenHoldings | null;
  }
  
  /**
   * Update user token holdings
   * @param userId User ID
   * @param tokenAmount Token amount
   * @param tier Token holder tier
   * @returns The updated user token holdings
   */
  async updateUserTokenHoldings(
    userId: string,
    walletId: string,
    tokenAmount: number,
    tier: TokenHolderTier
  ): Promise<UserTokenHoldings> {
    // Check if user token holdings exist
    const holdings = await this.getUserTokenHoldings(userId);
    
    if (holdings) {
      // Update existing holdings
      const { data, error } = await this.db
        .from('user_token_holdings')
        .update({
          tokenAmount,
          tier,
          lastCheckedAt: new Date(),
          updatedAt: new Date()
        })
        .eq('id', holdings.id)
        .select()
        .single();
      
      if (error) {
        this.logger.error(error, 'Failed to update user token holdings');
        throw new Error('Failed to update user token holdings');
      }
      
      return data as UserTokenHoldings;
    } else {
      // Create new holdings
      const { data, error } = await this.db
        .from('user_token_holdings')
        .insert({
          userId,
          walletId,
          tokenAmount,
          tier,
          lastCheckedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .select()
        .single();
      
      if (error) {
        this.logger.error(error, 'Failed to create user token holdings');
        throw new Error('Failed to create user token holdings');
      }
      
      return data as UserTokenHoldings;
    }
  }
  
  /**
   * Update user token benefits
   * @param userId User ID
   * @param benefits Token benefits data
   * @returns Success indicator
   */
  async updateUserTokenBenefits(userId: string, benefits: UserTokenBenefits): Promise<boolean> {
    // Get user
    const { data: user, error: userError } = await this.db
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        throw new NotFoundError('User', userId);
      }
      this.logger.error(userError, 'Failed to get user');
      throw new Error('Failed to get user');
    }
    
    // Update user benefits in metadata
    const { error } = await this.db
      .from('users')
      .update({
        tokenBenefits: benefits,
        updatedAt: new Date()
      })
      .eq('id', userId);
    
    if (error) {
      this.logger.error(error, 'Failed to update user token benefits');
      throw new Error('Failed to update user token benefits');
    }
    
    return true;
  }
  
  /**
   * Get all token benefits
   * @returns List of all token benefits
   */
  async getAllTokenBenefits(): Promise<TokenBenefit[]> {
    const { data, error } = await this.db
      .from('token_benefits')
      .select('*')
      .order('id');
    
    if (error) {
      this.logger.error(error, 'Failed to get token benefits');
      throw new Error('Failed to get token benefits');
    }
    
    return data as TokenBenefit[];
  }
  
  /**
   * Delete verification messages for a user
   * @param userId User ID
   * @returns Success indicator
   */
  async deleteVerificationMessages(userId: string): Promise<boolean> {
    const { error } = await this.db
      .from('wallet_verification_messages')
      .delete()
      .eq('userId', userId);
    
    if (error) {
      this.logger.error(error, 'Failed to delete wallet verification messages');
      throw new Error('Failed to delete wallet verification messages');
    }
    
    return true;
  }
}
