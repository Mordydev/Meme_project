/**
 * Transaction Idempotency Service
 * 
 * Ensures points transactions are processed exactly once, even if the
 * request is sent multiple times. Critical for maintaining points integrity.
 */
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';
import { PointsSource } from '../../models/user-points';

/**
 * Transaction key structure
 */
export interface TransactionKey {
  userId: string;
  source: PointsSource;
  amount: number;
  timestamp: number;
  clientRequestId?: string;
}

/**
 * Transaction result interface
 */
export interface TransactionResult {
  transactionId: string;
  success: boolean;
  amount: number;
  balance?: number;
  timestamp: string;
}

/**
 * Service for ensuring transaction idempotency
 */
export class TransactionIdempotencyService {
  private redis: Redis;
  private keyPrefix: string;
  private defaultTtl: number;
  
  /**
   * Create a new TransactionIdempotencyService
   */
  constructor(options: {
    keyPrefix?: string;
    defaultTtl?: number;
    redis?: Redis;
  } = {}) {
    this.redis = options.redis || getRedisClient();
    this.keyPrefix = options.keyPrefix || 'points_tx:';
    this.defaultTtl = options.defaultTtl || 60 * 60 * 24 * 7; // 7 days default
  }
  
  /**
   * Generate a transaction key from components
   */
  generateKey(txKey: TransactionKey): string {
    const components = [
      txKey.userId,
      txKey.source,
      txKey.amount.toString(),
      txKey.timestamp.toString()
    ];
    
    if (txKey.clientRequestId) {
      components.push(txKey.clientRequestId);
    }
    
    return components.join(':');
  }
  
  /**
   * Check if a transaction has already been processed
   * 
   * @param txKey - Transaction key components
   * @returns Transaction result if exists, null otherwise
   */
  async checkExistingTransaction(txKey: TransactionKey): Promise<TransactionResult | null> {
    try {
      const key = `${this.keyPrefix}${this.generateKey(txKey)}`;
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as TransactionResult;
    } catch (error) {
      logger.error('Error checking existing transaction', { error, txKey });
      return null;
    }
  }
  
  /**
   * Record a successful transaction
   * 
   * @param txKey - Transaction key components
   * @param result - Transaction result to store
   * @param ttl - Time to live in seconds
   */
  async recordTransaction(txKey: TransactionKey, result: TransactionResult, ttl: number = this.defaultTtl): Promise<void> {
    try {
      const key = `${this.keyPrefix}${this.generateKey(txKey)}`;
      
      await this.redis.set(
        key,
        JSON.stringify(result),
        'EX',
        ttl
      );
      
      logger.debug('Recorded transaction for idempotency', { txKey, transactionId: result.transactionId });
    } catch (error) {
      logger.error('Error recording transaction', { error, txKey });
      // Non-blocking - failure to record doesn't prevent the transaction
    }
  }
  
  /**
   * Generate a unique transaction ID
   */
  generateTransactionId(): string {
    return uuidv4();
  }
  
  /**
   * Clear a transaction record (for testing/admin purposes)
   * 
   * @param txKey - Transaction key components
   * @returns true if record was deleted, false otherwise
   */
  async clearTransaction(txKey: TransactionKey): Promise<boolean> {
    try {
      const key = `${this.keyPrefix}${this.generateKey(txKey)}`;
      const deleted = await this.redis.del(key);
      return deleted === 1;
    } catch (error) {
      logger.error('Error clearing transaction', { error, txKey });
      return false;
    }
  }
  
  /**
   * Check if a client request ID has been used within a timeframe
   * 
   * @param userId - User ID
   * @param clientRequestId - Client request ID
   * @param timeframeMs - Timeframe in milliseconds to check
   * @returns true if the request ID has been used, false otherwise
   */
  async isClientRequestIdUsed(userId: string, clientRequestId: string, timeframeMs: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    try {
      if (!clientRequestId) {
        return false;
      }
      
      const pattern = `${this.keyPrefix}${userId}:*:*:*:${clientRequestId}`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return false;
      }
      
      // Check if any of the keys are within the timeframe
      const now = Date.now();
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 6) {
          const timestamp = parseInt(parts[5], 10);
          if (!isNaN(timestamp) && now - timestamp < timeframeMs) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking client request ID', { error, userId, clientRequestId });
      return false; // Default to false to allow the transaction
    }
  }
}
