/**
 * Idempotency Service
 * 
 * Provides idempotency guarantees for transaction processing.
 */
import * as Redis from 'ioredis';
import { logger } from '../../lib/logger';

/**
 * Operation result generic type
 */
export type OperationResult = any;

/**
 * Operation status enum
 */
export enum OperationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Idempotency service for ensuring operations are executed only once
 */
export class IdempotencyService {
  private readonly EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours
  
  /**
   * Create a new IdempotencyService
   * 
   * @param redis Redis client
   */
  constructor(private readonly redis: Redis.Redis) {}

  /**
   * Get the result of a previous operation by key
   * 
   * @param key Idempotency key
   * @returns Operation result or null if not found
   */
  async getOperationResult(key: string): Promise<OperationResult | null> {
    try {
      const data = await this.redis.get(`idempotency:${key}`);
      
      if (!data) {
        return null;
      }
      
      const parsed = JSON.parse(data);
      
      // Only return results for completed operations
      if (parsed.status === OperationStatus.COMPLETED) {
        return parsed.result;
      }
      
      if (parsed.status === OperationStatus.FAILED) {
        // Reconstruct error
        const error = new Error(parsed.error.message);
        error.name = parsed.error.name;
        error.stack = parsed.error.stack;
        throw error;
      }
      
      // Operation is still pending
      return null;
    } catch (error) {
      logger.error('Error getting operation result', { key, error });
      
      // If there was an error, return null to allow retry
      return null;
    }
  }

  /**
   * Begin a new operation
   * 
   * @param key Idempotency key
   */
  async beginOperation(key: string): Promise<void> {
    try {
      // Mark operation as pending
      await this.redis.set(
        `idempotency:${key}`,
        JSON.stringify({
          status: OperationStatus.PENDING,
          startedAt: new Date().toISOString()
        }),
        'EX',
        this.EXPIRY_SECONDS,
        'NX' // Only set if key doesn't exist
      );
    } catch (error) {
      logger.error('Error beginning operation', { key, error });
      
      // Allow operation to continue even if idempotency fails
    }
  }

  /**
   * Complete an operation successfully
   * 
   * @param key Idempotency key
   * @param result Operation result
   */
  async completeOperation(key: string, result: OperationResult): Promise<void> {
    try {
      await this.redis.set(
        `idempotency:${key}`,
        JSON.stringify({
          status: OperationStatus.COMPLETED,
          result,
          completedAt: new Date().toISOString()
        }),
        'EX',
        this.EXPIRY_SECONDS
      );
    } catch (error) {
      logger.error('Error completing operation', { key, error });
      
      // Allow operation to continue even if idempotency fails
    }
  }

  /**
   * Mark an operation as failed
   * 
   * @param key Idempotency key
   * @param error Error that caused the failure
   */
  async failOperation(key: string, error: Error): Promise<void> {
    try {
      await this.redis.set(
        `idempotency:${key}`,
        JSON.stringify({
          status: OperationStatus.FAILED,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          failedAt: new Date().toISOString()
        }),
        'EX',
        this.EXPIRY_SECONDS
      );
    } catch (redisError) {
      logger.error('Error marking operation as failed', { key, error, redisError });
      
      // Allow operation to continue even if idempotency fails
    }
  }

  /**
   * Clear an operation entry
   * 
   * @param key Idempotency key
   */
  async clearOperation(key: string): Promise<void> {
    try {
      await this.redis.del(`idempotency:${key}`);
    } catch (error) {
      logger.error('Error clearing operation', { key, error });
    }
  }
}
