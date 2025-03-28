/**
 * Idempotency Service
 * 
 * Ensures redemption operations are processed exactly once,
 * even if they are requested multiple times.
 */
import { logger } from '../../../lib/logger';

/**
 * Operation result
 */
export interface OperationResult {
  success: boolean;
  data: any;
  timestamp: Date;
}

/**
 * Idempotency service
 */
export class IdempotencyService {
  // In-memory store for idempotency keys
  // In production, use Redis or another distributed store
  private operations = new Map<string, {
    inProgress: boolean;
    result?: OperationResult;
    started: Date;
  }>();
  
  /**
   * Get operation result for idempotency key
   * 
   * @param key Idempotency key
   * @returns Operation result or null if not found
   */
  async getOperationResult(key: string): Promise<OperationResult | null> {
    const operation = this.operations.get(key);
    
    if (operation && operation.result) {
      logger.debug('Found existing operation result', { key });
      return operation.result;
    }
    
    return null;
  }

  /**
   * Begin operation with idempotency key
   * 
   * @param key Idempotency key
   * @returns True if operation can proceed, false if already in progress
   */
  async beginOperation(key: string): Promise<boolean> {
    const operation = this.operations.get(key);
    
    // If operation exists and is in progress or has result, don't proceed
    if (operation) {
      logger.debug('Operation already exists', { key, inProgress: operation.inProgress });
      return false;
    }
    
    // Record operation as in progress
    this.operations.set(key, {
      inProgress: true,
      started: new Date()
    });
    
    logger.debug('Operation begun', { key });
    return true;
  }

  /**
   * Complete operation with result
   * 
   * @param key Idempotency key
   * @param data Result data
   */
  async completeOperation(key: string, data: any): Promise<void> {
    const operation = this.operations.get(key);
    
    if (!operation) {
      logger.warn('Attempted to complete non-existent operation', { key });
      return;
    }
    
    // Update operation with result
    this.operations.set(key, {
      ...operation,
      inProgress: false,
      result: {
        success: true,
        data,
        timestamp: new Date()
      }
    });
    
    logger.debug('Operation completed', { key });
  }

  /**
   * Mark operation as failed
   * 
   * @param key Idempotency key
   * @param error Error that occurred
   */
  async failOperation(key: string, error: Error): Promise<void> {
    const operation = this.operations.get(key);
    
    if (!operation) {
      logger.warn('Attempted to fail non-existent operation', { key });
      return;
    }
    
    // Update operation with failure
    this.operations.set(key, {
      ...operation,
      inProgress: false,
      result: {
        success: false,
        data: { error: error.message },
        timestamp: new Date()
      }
    });
    
    logger.debug('Operation failed', { key, error: error.message });
  }

  /**
   * Clear operation
   * 
   * @param key Idempotency key
   */
  async clearOperation(key: string): Promise<void> {
    this.operations.delete(key);
    logger.debug('Operation cleared', { key });
  }

  /**
   * Clean up old operations (for maintenance)
   * 
   * @param maxAgeMs Maximum age in milliseconds
   */
  async cleanupOldOperations(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let count = 0;
    
    // Find and remove old operations
    for (const [key, operation] of this.operations.entries()) {
      const age = now - operation.started.getTime();
      
      if (age > maxAgeMs) {
        this.operations.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      logger.info(`Cleaned up ${count} old operations`);
    }
    
    return count;
  }
}
