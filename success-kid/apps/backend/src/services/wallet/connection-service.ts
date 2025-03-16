/**
 * Wallet Connection Service
 * 
 * Handles wallet connection, verification, and management.
 */
import { v4 as uuidv4 } from 'uuid';
import { createVerificationMessage, verifySignature } from '../../lib/wallet-utils';
import { WalletConnectionRepository } from '../../repositories/wallet-connection-repository';
import { logger } from '../../lib/logger';
import { CreateWalletConnectionDto, WalletConnection } from '../../models/wallet-connection';
import { WalletAlreadyConnectedError, WalletConnectionError, WalletVerificationError } from '../../errors/wallet-errors';
import { ValidationError } from '../../errors/base-error';
import { Redis } from 'ioredis';

// Type for verification messages stored in Redis
interface VerificationMessage {
  walletType: string;
  message: string;
  timestamp: number;
  userId: string;
  nonce: string;
  createdAt: string;
  expiresAt: string;
}

// Connection event type
export interface ConnectionEvent {
  id: string;
  userId: string;
  walletAddress: string;
  eventType: 'connection' | 'verification' | 'disconnection';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class WalletConnectionService {
  private static SESSION_TTL = 300; // 5 minutes (in seconds)
  private static SESSION_PREFIX = 'wallet:session:';
  private static EVENT_PREFIX = 'wallet:event:';
  
  constructor(
    private walletConnectionRepository: WalletConnectionRepository,
    private redis: Redis
  ) {}

  /**
   * Generate a verification message for wallet connection
   * 
   * @param userId - The user ID requesting verification
   * @param walletType - The type of wallet (phantom, etc.)
   * @returns The verification session data
   */
  async generateVerificationMessage(
    userId: string, 
    walletType: string
  ): Promise<{ sessionId: string; message: string; expiresAt: Date }> {
    try {
      // Validate wallet type
      if (!this.isSupportedWalletType(walletType)) {
        throw new ValidationError(`Unsupported wallet type: ${walletType}`);
      }
      
      // Generate a unique session ID and nonce
      const sessionId = uuidv4();
      const nonce = uuidv4().substring(0, 8);
      const timestamp = Date.now();
      
      // Calculate expiration (5 minutes from now)
      const expiresAt = new Date(timestamp + WalletConnectionService.SESSION_TTL * 1000);
      
      // Create the verification message
      const message = createVerificationMessage(sessionId, timestamp);
      
      // Store the verification data in Redis for later validation
      const sessionKey = `${WalletConnectionService.SESSION_PREFIX}${sessionId}`;
      const sessionData: VerificationMessage = {
        walletType,
        message,
        timestamp,
        userId,
        nonce,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      };
      
      await this.redis.set(
        sessionKey,
        JSON.stringify(sessionData),
        'EX',
        WalletConnectionService.SESSION_TTL
      );
      
      logger.info('Generated wallet verification message', { 
        userId, 
        walletType,
        sessionId 
      });
      
      return {
        sessionId,
        message,
        expiresAt
      };
    } catch (error) {
      logger.error('Error generating verification message', { 
        error, 
        userId, 
        walletType 
      });
      throw new WalletConnectionError(
        'Failed to generate verification message. Please try again.',
        { originalError: error.message }
      );
    }
  }
  
  /**
   * Verify a wallet signature to confirm ownership
   * 
   * @param sessionId - The ID of the verification session
   * @param signature - The signature provided by the wallet
   * @param address - The wallet address
   * @returns The verified wallet connection
   */
  async verifyWalletSignature(
    sessionId: string,
    signature: string,
    address: string
  ): Promise<{ verified: boolean; walletConnection?: WalletConnection }> {
    try {
      // Normalize the wallet address
      const normalizedAddress = this.normalizeWalletAddress(address);
      
      // Validate wallet address format
      if (!this.isValidWalletAddress(normalizedAddress)) {
        throw new ValidationError('Invalid wallet address format');
      }
      
      // Retrieve the session data from Redis
      const sessionKey = `${WalletConnectionService.SESSION_PREFIX}${sessionId}`;
      const sessionDataRaw = await this.redis.get(sessionKey);
      
      if (!sessionDataRaw) {
        throw new WalletVerificationError(
          'Verification session expired or not found. Please try again.'
        );
      }
      
      // Parse session data
      const sessionData: VerificationMessage = JSON.parse(sessionDataRaw);
      
      // Check for session expiration
      const expiresAt = new Date(sessionData.expiresAt);
      if (expiresAt < new Date()) {
        // Clean up expired session
        await this.redis.del(sessionKey);
        throw new WalletVerificationError('Verification session has expired. Please try again.');
      }
      
      // Verify the signature
      const isValid = await verifySignature(
        sessionData.message,
        signature,
        normalizedAddress,
        sessionData.walletType
      );
      
      if (!isValid) {
        logger.warn('Wallet signature verification failed', {
          sessionId,
          address: normalizedAddress
        });
        throw new WalletVerificationError('Signature verification failed. Please try again.');
      }
      
      // Verification successful, create or update wallet connection
      const userId = sessionData.userId;
      
      // Check if wallet is already connected to another user
      const existingConnection = await this.walletConnectionRepository.findByWalletAddress(normalizedAddress);
      
      if (existingConnection && existingConnection.user_id !== userId) {
        throw new WalletAlreadyConnectedError('This wallet is already connected to another account.');
      }
      
      // Create or update wallet connection
      let walletConnection: WalletConnection;
      
      if (existingConnection) {
        // Update existing connection
        walletConnection = await this.walletConnectionRepository.updateVerificationStatus(
          existingConnection.id,
          {
            is_verified: true,
            last_verified_at: new Date()
          }
        );
      } else {
        // Create new connection
        const connectionData: CreateWalletConnectionDto = {
          user_id: userId,
          wallet_address: normalizedAddress,
          is_verified: true
        };
        
        walletConnection = await this.walletConnectionRepository.createWalletConnection(connectionData);
      }
      
      // Record the successful verification event
      await this.recordConnectionEvent({
        id: uuidv4(),
        userId,
        walletAddress: normalizedAddress,
        eventType: 'verification',
        timestamp: new Date(),
        metadata: {
          sessionId,
          walletType: sessionData.walletType
        }
      });
      
      // Clean up the session
      await this.redis.del(sessionKey);
      
      logger.info('Wallet verification successful', { 
        userId, 
        address: normalizedAddress 
      });
      
      return {
        verified: true,
        walletConnection
      };
    } catch (error) {
      // Pass through our custom errors
      if (
        error instanceof WalletVerificationError ||
        error instanceof WalletAlreadyConnectedError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      
      // Log and throw generic error for other cases
      logger.error('Error verifying wallet signature', { 
        error, 
        sessionId, 
        address 
      });
      throw new WalletConnectionError(
        'Failed to verify wallet ownership. Please try again.',
        { originalError: error.message }
      );
    }
  }
  
  /**
   * Connect a wallet to a user account
   * 
   * @param userId - The user ID to connect the wallet to
   * @param address - The wallet address to connect
   * @param provider - The wallet provider type
   * @returns The connected wallet data
   */
  async connectWallet(
    userId: string, 
    address: string, 
    provider: string = 'unknown'
  ): Promise<WalletConnection> {
    try {
      // Normalize the wallet address
      const normalizedAddress = this.normalizeWalletAddress(address);
      
      // Validate wallet address format
      if (!this.isValidWalletAddress(normalizedAddress)) {
        throw new ValidationError('Invalid wallet address format');
      }
      
      // Check if wallet already connected to another user
      const existingConnection = await this.walletConnectionRepository.findByWalletAddress(normalizedAddress);
      
      if (existingConnection && existingConnection.user_id !== userId) {
        throw new WalletAlreadyConnectedError(
          'This wallet is already connected to another account.'
        );
      }
      
      // Create or update connection
      const connectionData: CreateWalletConnectionDto = {
        user_id: userId,
        wallet_address: normalizedAddress,
        is_verified: false // Requires verification step
      };
      
      // Create wallet connection
      const walletConnection = await this.walletConnectionRepository.createWalletConnection(connectionData);
      
      // Record connection event
      await this.recordConnectionEvent({
        id: uuidv4(),
        userId,
        walletAddress: normalizedAddress,
        eventType: 'connection',
        timestamp: new Date(),
        metadata: {
          provider,
          verified: false
        }
      });
      
      logger.info('Wallet connected successfully', { 
        userId, 
        address: normalizedAddress 
      });
      
      return walletConnection;
    } catch (error) {
      // Pass through custom errors
      if (
        error instanceof WalletAlreadyConnectedError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      
      // Log and throw generic error for other cases
      logger.error('Error connecting wallet', { 
        error, 
        userId, 
        address 
      });
      throw new WalletConnectionError(
        'Failed to connect wallet. Please try again.',
        { originalError: error.message }
      );
    }
  }
  
  /**
   * Disconnect a wallet from a user account
   * 
   * @param userId - The user ID
   * @param address - The wallet address to disconnect
   * @returns True if disconnection was successful
   */
  async disconnectWallet(userId: string, address: string): Promise<boolean> {
    try {
      // Normalize the wallet address
      const normalizedAddress = this.normalizeWalletAddress(address);
      
      // Find the wallet connection
      const existingConnection = await this.walletConnectionRepository.findByWalletAddress(normalizedAddress);
      
      if (!existingConnection) {
        logger.info('Wallet not found to disconnect', {
          userId,
          address: normalizedAddress
        });
        return false;
      }
      
      // Check if the wallet belongs to the user
      if (existingConnection.user_id !== userId) {
        throw new WalletConnectionError('You do not have permission to disconnect this wallet.');
      }
      
      // Delete the wallet connection
      const deleted = await this.walletConnectionRepository.deleteById(existingConnection.id);
      
      if (!deleted) {
        throw new WalletConnectionError('Failed to disconnect wallet. Please try again.');
      }
      
      // Record disconnection event
      await this.recordConnectionEvent({
        id: uuidv4(),
        userId,
        walletAddress: normalizedAddress,
        eventType: 'disconnection',
        timestamp: new Date()
      });
      
      logger.info('Wallet disconnected successfully', {
        userId,
        address: normalizedAddress
      });
      
      return true;
    } catch (error) {
      logger.error('Error disconnecting wallet', {
        error,
        userId,
        address
      });
      
      // Pass through custom errors
      if (error instanceof WalletConnectionError) {
        throw error;
      }
      
      throw new WalletConnectionError(
        'Failed to disconnect wallet. Please try again.',
        { originalError: error.message }
      );
    }
  }
  
  /**
   * Get all wallets connected to a user
   * 
   * @param userId - The user ID
   * @returns Array of connected wallets
   */
  async getWalletsByUser(userId: string): Promise<WalletConnection[]> {
    try {
      return await this.walletConnectionRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error fetching user wallets', {
        error,
        userId
      });
      throw new WalletConnectionError(
        'Failed to fetch wallet connections.',
        { originalError: error.message }
      );
    }
  }
  
  /**
   * Check if a wallet is valid
   * 
   * @param address - The wallet address to validate
   * @returns True if the address is valid
   */
  private isValidWalletAddress(address: string): boolean {
    // Simple validation for now - more sophisticated validation should be added
    // based on the wallet provider type
    return (
      typeof address === 'string' && 
      address.length >= 30 && 
      address.length <= 255
    );
  }
  
  /**
   * Check if the wallet provider is supported
   * 
   * @param walletType - The wallet provider to check
   * @returns True if the wallet type is supported
   */
  private isSupportedWalletType(walletType: string): boolean {
    const supportedWallets = ['phantom', 'solflare', 'slope'];
    return supportedWallets.includes(walletType.toLowerCase());
  }
  
  /**
   * Normalize a wallet address
   * 
   * @param address - The wallet address to normalize
   * @returns The normalized address
   */
  private normalizeWalletAddress(address: string): string {
    return address.trim();
  }
  
  /**
   * Record a wallet connection event
   * 
   * @param event - The connection event to record
   */
  private async recordConnectionEvent(event: ConnectionEvent): Promise<void> {
    try {
      // Store in Redis for analytics and tracking
      const eventKey = `${WalletConnectionService.EVENT_PREFIX}${event.id}`;
      await this.redis.set(eventKey, JSON.stringify(event), 'EX', 86400 * 30); // 30 days TTL
      
      // Add to timeline
      const timelineKey = `${WalletConnectionService.EVENT_PREFIX}${event.userId}:timeline`;
      await this.redis.zadd(timelineKey, Date.now(), event.id);
      
      // Keep timeline limited to last 100 events
      await this.redis.zremrangebyrank(timelineKey, 0, -101);
      
      // Set timeline expiry
      await this.redis.expire(timelineKey, 86400 * 30); // 30 days TTL
    } catch (error) {
      logger.error('Error recording connection event', {
        error,
        event
      });
      // Non-critical operation, log but don't throw
    }
  }
  
  /**
   * Get connection history for a user
   * 
   * @param userId - The user ID
   * @param limit - Maximum number of events to return
   * @returns Array of connection events
   */
  async getConnectionHistory(userId: string, limit: number = 20): Promise<ConnectionEvent[]> {
    try {
      // Get timeline for user
      const timelineKey = `${WalletConnectionService.EVENT_PREFIX}${userId}:timeline`;
      const eventIds = await this.redis.zrevrange(timelineKey, 0, limit - 1);
      
      if (!eventIds || eventIds.length === 0) {
        return [];
      }
      
      // Get details for each event
      const events: ConnectionEvent[] = [];
      
      for (const eventId of eventIds) {
        const eventKey = `${WalletConnectionService.EVENT_PREFIX}${eventId}`;
        const eventData = await this.redis.get(eventKey);
        
        if (eventData) {
          events.push(JSON.parse(eventData));
        }
      }
      
      return events;
    } catch (error) {
      logger.error('Error fetching connection history', {
        error,
        userId
      });
      throw new WalletConnectionError(
        'Failed to fetch connection history.',
        { originalError: error.message }
      );
    }
  }
}
