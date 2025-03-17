/**
 * Key Management Service
 * 
 * Manages encryption keys for the application
 */
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';
import { db } from '../../lib/db';
import { redis } from '../../lib/redis';
import { KeyInfo, KeyGenerationOptions } from './types';

// Constants
const KEY_CACHE_PREFIX = 'encryption:key:';
const KEY_CACHE_TTL = 3600; // 1 hour

/**
 * Key Management Service Class
 */
export class KeyManagementService {
  private keyCache: Map<string, Buffer> = new Map();
  
  /**
   * Create a new encryption key
   * 
   * @param options Key generation options
   * @returns Key ID
   */
  async createKey(options: KeyGenerationOptions = {}): Promise<string> {
    try {
      const keyId = options.metadata?.keyId || randomUUID();
      const keySize = options.keySize || 32; // 256 bits by default
      const algorithm = options.algorithm || 'aes-256-gcm';
      
      // Generate secure random key
      const key = crypto.randomBytes(keySize);
      
      // Store in database
      await db.query(
        `INSERT INTO encryption_keys (
          id, key_data, algorithm, created_at, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          keyId,
          key.toString('base64'),
          algorithm,
          new Date(),
          'active',
          JSON.stringify(options.metadata || {})
        ]
      );
      
      // Cache in memory
      this.keyCache.set(keyId, key);
      
      // Cache in Redis for distributed setups
      await redis.set(
        `${KEY_CACHE_PREFIX}${keyId}`,
        key.toString('base64'),
        'EX',
        KEY_CACHE_TTL
      );
      
      logger.info('Created new encryption key', { 
        keyId, 
        algorithm,
        metadata: options.metadata
      });
      
      return keyId;
    } catch (error) {
      logger.error('Error creating encryption key', { error });
      throw new Error('Failed to create encryption key');
    }
  }
  
  /**
   * Get encryption key by ID
   * 
   * @param keyId Key ID
   * @returns Encryption key
   */
  async getKey(keyId: string): Promise<Buffer> {
    try {
      // Check memory cache first
      if (this.keyCache.has(keyId)) {
        return this.keyCache.get(keyId)!;
      }
      
      // Check Redis cache
      const cachedKey = await redis.get(`${KEY_CACHE_PREFIX}${keyId}`);
      if (cachedKey) {
        const key = Buffer.from(cachedKey, 'base64');
        this.keyCache.set(keyId, key);
        return key;
      }
      
      // Fetch from database
      const result = await db.query(
        'SELECT key_data FROM encryption_keys WHERE id = $1 AND status != $2',
        [keyId, 'compromised']
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Encryption key not found or compromised: ${keyId}`);
      }
      
      // Parse key
      const key = Buffer.from(result.rows[0].key_data, 'base64');
      
      // Cache in memory
      this.keyCache.set(keyId, key);
      
      // Cache in Redis
      await redis.set(
        `${KEY_CACHE_PREFIX}${keyId}`,
        result.rows[0].key_data,
        'EX',
        KEY_CACHE_TTL
      );
      
      return key;
    } catch (error) {
      logger.error('Error getting encryption key', { error, keyId });
      throw new Error('Failed to get encryption key');
    }
  }
  
  /**
   * Get all active key IDs
   * 
   * @returns Array of active key IDs
   */
  async getActiveKeyIds(): Promise<string[]> {
    try {
      const result = await db.query(
        'SELECT id FROM encryption_keys WHERE status = $1 ORDER BY created_at DESC',
        ['active']
      );
      
      return result.rows.map(row => row.id);
    } catch (error) {
      logger.error('Error getting active key IDs', { error });
      throw new Error('Failed to get active key IDs');
    }
  }
  
  /**
   * Get primary key ID (most recently created active key)
   * 
   * @returns Primary key ID
   */
  async getPrimaryKeyId(): Promise<string> {
    try {
      const result = await db.query(
        'SELECT id FROM encryption_keys WHERE status = $1 ORDER BY created_at DESC LIMIT 1',
        ['active']
      );
      
      if (result.rowCount === 0) {
        throw new Error('No active encryption keys found');
      }
      
      return result.rows[0].id;
    } catch (error) {
      logger.error('Error getting primary key ID', { error });
      throw new Error('Failed to get primary key ID');
    }
  }
  
  /**
   * Get key info
   * 
   * @param keyId Key ID
   * @returns Key information
   */
  async getKeyInfo(keyId: string): Promise<KeyInfo> {
    try {
      const result = await db.query(
        `SELECT 
          id, algorithm, created_at, rotated_at, status 
        FROM encryption_keys 
        WHERE id = $1`,
        [keyId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Key not found: ${keyId}`);
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        algorithm: row.algorithm,
        createdAt: row.created_at,
        rotatedAt: row.rotated_at || undefined,
        status: row.status
      };
    } catch (error) {
      logger.error('Error getting key info', { error, keyId });
      throw new Error('Failed to get key info');
    }
  }
  
  /**
   * Mark a key as compromised
   * 
   * @param keyId Key ID to mark as compromised
   */
  async markKeyCompromised(keyId: string): Promise<void> {
    try {
      // Update key status
      await db.query(
        'UPDATE encryption_keys SET status = $1 WHERE id = $2',
        ['compromised', keyId]
      );
      
      // Remove from caches
      this.keyCache.delete(keyId);
      await redis.del(`${KEY_CACHE_PREFIX}${keyId}`);
      
      logger.warn('Marked encryption key as compromised', { keyId });
    } catch (error) {
      logger.error('Error marking key as compromised', { error, keyId });
      throw new Error('Failed to mark key as compromised');
    }
  }
  
  /**
   * Rotate a key
   * 
   * @param oldKeyId Old key ID
   * @returns New key ID
   */
  async rotateKey(oldKeyId: string): Promise<string> {
    try {
      // Get old key info
      const keyInfo = await this.getKeyInfo(oldKeyId);
      
      // Create new key with similar options
      const newKeyId = await this.createKey({
        algorithm: keyInfo.algorithm,
        metadata: {
          rotatedFrom: oldKeyId,
          rotatedAt: new Date().toISOString()
        }
      });
      
      // Update old key status
      await db.query(
        'UPDATE encryption_keys SET status = $1, rotated_at = $2 WHERE id = $3',
        ['rotated', new Date(), oldKeyId]
      );
      
      logger.info('Rotated encryption key', { oldKeyId, newKeyId });
      
      return newKeyId;
    } catch (error) {
      logger.error('Error rotating key', { error, oldKeyId });
      throw new Error('Failed to rotate key');
    }
  }
}

// Export singleton instance
export const keyManagementService = new KeyManagementService();
