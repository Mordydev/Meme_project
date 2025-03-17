/**
 * Idempotency Service
 * 
 * Provides idempotency guarantees for operations that should not be repeated,
 * particularly redemption requests and blockchain transactions.
 */
import { Redis } from 'ioredis';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';

/**
 * Operation status enum
 */
export enum OperationStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Operation result interface
 */
export interface OperationResult {
  status: OperationStatus;
  result?: any;
  error?: string;
  timestamp: string;
}

/**
 * Service for managing operation idempotency
 */
export class IdempotencyService {
  private redis: Redis;
  private keyPrefix: string;
  private defaultTtl: number;
  
  /**
   * Create a new IdempotencyService
   * 
   * @param options - Configuration options
   */
  constructor(options: {
    keyPrefix?: string;
    defaultTtl?: number;
    redis?: Redis;
  } = {}) {
    this.redis = options.redis || getRedisClient();
    this.keyPrefix = options.keyPrefix || 'idempotency:';
    this.defaultTtl = options.defaultTtl || 60 * 60 * 24; // 24 hours default
  }
  
  /**
   * Get the result of a previous operation by idempotency key
   * 
   * @param key - Idempotency key for the operation
   * @returns Operation result or null if not found
   */
  async getOperationResult(key: string): Promise<OperationResult | null> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const data = await this.redis.get(fullKey);
      
      if (!data) {
        return null;
      }
      
      const result = JSON.parse(data) as OperationResult;
      
      // Only return completed or failed operations as results
      if (result.status === OperationStatus.IN_PROGRESS) {
        return null;
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting operation result', { error, key });
      return null;
    }
  }
  
  /**
   * Start a new operation with the given idempotency key
   * 
   * @param key - Idempotency key for the operation
   * @param ttl - Optional TTL in seconds for the key
   * @returns true if operation was started, false if already in progress
   */
  async beginOperation(key: string, ttl: number = this.defaultTtl): Promise<boolean> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      
      // Try to set the key only if it doesn't exist
      const setNxResult = await this.redis.set(
        fullKey,
        JSON.stringify({
          status: OperationStatus.IN_PROGRESS,
          timestamp: new Date().toISOString()
        }),
        'NX',
        'EX',
        ttl
      );
      
      // If result is null, the key already exists
      if (!setNxResult) {
        // Check if the existing operation is stale (in progress for too long)
        const existingData = await this.redis.get(fullKey);
        
        if (existingData) {
          const existingOperation = JSON.parse(existingData) as OperationResult;
          
          if (existingOperation.status === OperationStatus.IN_PROGRESS) {
            const startTime = new Date(existingOperation.timestamp).getTime();
            const now = Date.now();
            const operationAge = now - startTime;
            
            // If operation has been in progress for more than 5 minutes, consider it stale
            if (operationAge > 5 * 60 * 1000) {
              // Override the stale operation
              await this.redis.set(
                fullKey,
                JSON.stringify({
                  status: OperationStatus.IN_PROGRESS,
                  timestamp: new Date().toISOString()
                }),
                'EX',
                ttl
              );
              
              logger.warn('Overriding stale operation', { key, age: operationAge });
              return true;
            }
          }
        }
        
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error beginning operation', { error, key });
      throw error;
    }
  }
  
  /**
   * Mark an operation as completed with its result
   * 
   * @param key - Idempotency key for the operation
   * @param result - Result of the operation
   * @param ttl - Optional TTL in seconds for the key
   */
  async completeOperation(key: string, result: any, ttl: number = this.defaultTtl): Promise<void> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      
      await this.redis.set(
        fullKey,
        JSON.stringify({
          status: OperationStatus.COMPLETED,
          result,
          timestamp: new Date().toISOString()
        }),
        'EX',
        ttl
      );
    } catch (error) {
      logger.error('Error completing operation', { error, key });
      throw error;
    }
  }
  
  /**
   * Mark an operation as failed with the error
   * 
   * @param key - Idempotency key for the operation
   * @param error - Error that occurred
   * @param ttl - Optional TTL in seconds for the key
   */
  async failOperation(key: string, error: Error, ttl: number = this.defaultTtl): Promise<void> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      
      await this.redis.set(
        fullKey,
        JSON.stringify({
          status: OperationStatus.FAILED,
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        }),
        'EX',
        ttl
      );
    } catch (redisError) {
      logger.error('Error failing operation', { error: redisError, key, originalError: error });
      throw redisError;
    }
  }
  
  /**
   * Check if an operation exists
   * 
   * @param key - Idempotency key for the operation
   * @returns true if operation exists, false otherwise
   */
  async operationExists(key: string): Promise<boolean> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking if operation exists', { error, key });
      return false;
    }
  }
  
  /**
   * Clear an operation
   * 
   * @param key - Idempotency key for the operation
   * @returns true if operation was deleted, false otherwise
   */
  async clearOperation(key: string): Promise<boolean> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const deleted = await this.redis.del(fullKey);
      return deleted === 1;
    } catch (error) {
      logger.error('Error clearing operation', { error, key });
      return false;
    }
  }
}
