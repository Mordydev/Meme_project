/**
 * Encryption Service
 * 
 * Provides encryption, decryption, and key management
 */
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';
import { db } from '../../lib/db';
import { redis } from '../../lib/redis';
import { 
  EncryptionOptions, 
  EncryptedData, 
  KeyInfo,
  RotationResult,
  KeyGenerationOptions
} from './types';

// Default encryption settings
const DEFAULT_ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY_SIZE = 32; // 256 bits
const KEY_CACHE_TTL = 3600; // 1 hour
const KEY_CACHE_PREFIX = 'encryption:key:';

/**
 * Encryption Service Class
 */
export class EncryptionService {
  private keyCache: Map<string, Buffer> = new Map();
  private defaultKeyId: string;
  
  constructor() {
    // Get default key ID from environment or use fixed value for development
    this.defaultKeyId = process.env.DEFAULT_ENCRYPTION_KEY_ID || 'dev-key-1';
  }
  
  /**
   * Initialize the encryption service
   */
  async initialize(): Promise<void> {
    try {
      // Check if default key exists
      const keyExists = await this.keyExists(this.defaultKeyId);
      
      if (!keyExists) {
        // Generate default key if it doesn't exist
        await this.generateKey({
          keySize: DEFAULT_KEY_SIZE,
          algorithm: DEFAULT_ALGORITHM,
          metadata: {
            description: 'Default encryption key',
            environment: process.env.NODE_ENV || 'development'
          }
        });
        
        logger.info('Generated default encryption key', { keyId: this.defaultKeyId });
      }
    } catch (error) {
      logger.error('Error initializing encryption service', { error });
      
      // For development, create an in-memory key if DB access fails
      if (process.env.NODE_ENV === 'development') {
        const devKey = crypto.randomBytes(DEFAULT_KEY_SIZE);
        this.keyCache.set(this.defaultKeyId, devKey);
        logger.warn('Using in-memory encryption key for development');
      }
    }
  }
  
  /**
   * Check if a key exists
   * 
   * @param keyId Key ID
   * @returns Whether key exists
   */
  async keyExists(keyId: string): Promise<boolean> {
    // Check cache first
    if (this.keyCache.has(keyId)) {
      return true;
    }
    
    try {
      // Check Redis cache
      const cachedKey = await redis.get(`${KEY_CACHE_PREFIX}${keyId}`);
      if (cachedKey) {
        return true;
      }
      
      // Check database
      const result = await db.query(
        'SELECT COUNT(*) FROM encryption_keys WHERE id = $1',
        [keyId]
      );
      
      return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
      logger.error('Error checking key existence', { error, keyId });
      return false;
    }
  }
  
  /**
   * Generate a new encryption key
   * 
   * @param options Key generation options
   * @returns Key ID
   */
  async generateKey(options: KeyGenerationOptions = {}): Promise<string> {
    try {
      const keyId = this.defaultKeyId || randomUUID();
      const keySize = options.keySize || DEFAULT_KEY_SIZE;
      const algorithm = options.algorithm || DEFAULT_ALGORITHM;
      
      // Generate cryptographically secure random key
      const key = crypto.randomBytes(keySize);
      
      // Store key in database
      await db.query(
        `INSERT INTO encryption_keys (
          id, key_data, algorithm, created_at, metadata
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          keyId,
          key.toString('base64'),
          algorithm,
          new Date(),
          JSON.stringify(options.metadata || {})
        ]
      );
      
      // Cache key
      this.keyCache.set(keyId, key);
      
      // Also cache in Redis for distributed deployments
      await redis.set(
        `${KEY_CACHE_PREFIX}${keyId}`,
        key.toString('base64'),
        'EX',
        KEY_CACHE_TTL
      );
      
      return keyId;
    } catch (error) {
      logger.error('Error generating encryption key', { error });
      throw new Error('Failed to generate encryption key');
    }
  }
  
  /**
   * Get an encryption key
   * 
   * @param keyId Key ID
   * @returns Key buffer
   */
  async getKey(keyId: string): Promise<Buffer> {
    try {
      // Check memory cache
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
      
      // Get from database
      const result = await db.query(
        'SELECT key_data FROM encryption_keys WHERE id = $1',
        [keyId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Encryption key not found: ${keyId}`);
      }
      
      // Parse key and cache it
      const key = Buffer.from(result.rows[0].key_data, 'base64');
      this.keyCache.set(keyId, key);
      
      // Also cache in Redis for distributed deployments
      await redis.set(
        `${KEY_CACHE_PREFIX}${keyId}`,
        result.rows[0].key_data,
        'EX',
        KEY_CACHE_TTL
      );
      
      return key;
    } catch (error) {
      logger.error('Error retrieving encryption key', { error, keyId });
      throw new Error('Failed to retrieve encryption key');
    }
  }
  
  /**
   * Encrypt data
   * 
   * @param data Data to encrypt
   * @param options Encryption options
   * @returns Encrypted data
   */
  async encrypt(
    data: string | Buffer,
    options: Partial<EncryptionOptions> = {}
  ): Promise<EncryptedData> {
    try {
      // Get encryption parameters
      const algorithm = options.algorithm || DEFAULT_ALGORITHM;
      const keyId = options.keyId || this.defaultKeyId;
      
      // Get encryption key
      const key = await this.getKey(keyId);
      
      // Generate initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher with selected algorithm
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      
      // Add authentication data if provided (for GCM mode)
      if (options.additionalData) {
        if (algorithm.includes('gcm')) {
          cipher.setAAD(options.additionalData);
        } else {
          logger.warn('Additional data is only supported with GCM mode');
        }
      }
      
      // Encrypt data
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const encryptedContent = Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final()
      ]);
      
      // Get authentication tag for GCM mode
      let authTag: Buffer | undefined;
      if (algorithm.includes('gcm')) {
        authTag = cipher.getAuthTag();
      }
      
      const result: EncryptedData = {
        keyId,
        algorithm,
        iv: iv.toString('base64'),
        encryptedData: encryptedContent.toString('base64')
      };
      
      // Add auth tag if available
      if (authTag) {
        result.authTag = authTag.toString('base64');
      }
      
      return result;
    } catch (error) {
      logger.error('Encryption error', { error });
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt data
   * 
   * @param encryptedData Encrypted data
   * @returns Decrypted data as buffer
   */
  async decrypt(encryptedData: EncryptedData): Promise<Buffer> {
    try {
      // Get encryption key
      const key = await this.getKey(encryptedData.keyId);
      
      // Parse IV and encrypted content
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const content = Buffer.from(encryptedData.encryptedData, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);
      
      // Set auth tag for GCM mode
      if (encryptedData.algorithm.includes('gcm')) {
        if (!encryptedData.authTag) {
          throw new Error('Authentication tag missing for GCM mode');
        }
        
        const authTag = Buffer.from(encryptedData.authTag, 'base64');
        decipher.setAuthTag(authTag);
      }
      
      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(content),
        decipher.final()
      ]);
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error', { error });
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Rotate encryption key
   * 
   * @param oldKeyId Old key ID
   * @param newKeyId New key ID (if not provided, a new key will be generated)
   * @returns Rotation result
   */
  async rotateKey(
    oldKeyId: string, 
    newKeyId?: string
  ): Promise<RotationResult> {
    try {
      // Validate old key exists
      const oldKeyExists = await this.keyExists(oldKeyId);
      if (!oldKeyExists) {
        throw new Error(`Old key does not exist: ${oldKeyId}`);
      }
      
      // Generate or validate new key
      let actualNewKeyId = newKeyId;
      if (!actualNewKeyId) {
        actualNewKeyId = await this.generateKey();
      } else {
        const newKeyExists = await this.keyExists(actualNewKeyId);
        if (!newKeyExists) {
          throw new Error(`New key does not exist: ${actualNewKeyId}`);
        }
      }
      
      // Initialize result
      const result: RotationResult = {
        oldKeyId,
        newKeyId: actualNewKeyId,
        itemsRotated: 0,
        errors: []
      };
      
      // In a real implementation, this would find all data encrypted with the old key
      // and re-encrypt it with the new key
      
      // Update key status
      await db.query(
        `UPDATE encryption_keys 
         SET status = 'rotated', rotated_at = $2 
         WHERE id = $1`,
        [oldKeyId, new Date()]
      );
      
      return result;
    } catch (error) {
      logger.error('Key rotation error', { error, oldKeyId, newKeyId });
      throw new Error('Failed to rotate encryption key');
    }
  }
  
  /**
   * Get encryption key info
   * 
   * @param keyId Key ID
   * @returns Key information
   */
  async getKeyInfo(keyId: string): Promise<KeyInfo> {
    try {
      // Get key info from database
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
      
      return {
        id: result.rows[0].id,
        algorithm: result.rows[0].algorithm,
        createdAt: result.rows[0].created_at,
        rotatedAt: result.rows[0].rotated_at,
        status: result.rows[0].status
      };
    } catch (error) {
      logger.error('Error retrieving key info', { error, keyId });
      throw new Error('Failed to retrieve key information');
    }
  }
  
  /**
   * Helper method to encrypt sensitive fields in an object
   * 
   * @param data Object with sensitive fields
   * @param fields Array of field paths to encrypt
   * @returns Object with encrypted fields
   */
  async encryptFields(
    data: Record<string, any>,
    fields: string[]
  ): Promise<Record<string, any>> {
    try {
      // Clone data
      const encryptedData = JSON.parse(JSON.stringify(data));
      
      // Process each field
      for (const field of fields) {
        // Get value using path
        const value = this.getNestedValue(data, field);
        
        // Skip undefined/null values
        if (value == null) continue;
        
        // Encrypt value
        const encrypted = await this.encrypt(
          typeof value === 'string' ? value : JSON.stringify(value)
        );
        
        // Set encrypted value
        this.setNestedValue(encryptedData, field, encrypted);
      }
      
      return encryptedData;
    } catch (error) {
      logger.error('Error encrypting fields', { error });
      throw new Error('Failed to encrypt fields');
    }
  }
  
  /**
   * Helper method to decrypt sensitive fields in an object
   * 
   * @param data Object with encrypted fields
   * @param fields Array of field paths to decrypt
   * @returns Object with decrypted fields
   */
  async decryptFields(
    data: Record<string, any>,
    fields: string[]
  ): Promise<Record<string, any>> {
    try {
      // Clone data
      const decryptedData = JSON.parse(JSON.stringify(data));
      
      // Process each field
      for (const field of fields) {
        // Get encrypted value
        const encryptedValue = this.getNestedValue(data, field);
        
        // Skip undefined/null values
        if (encryptedValue == null) continue;
        
        // Decrypt value
        const decrypted = await this.decrypt(encryptedValue);
        
        // Parse JSON if possible
        let parsedValue: any;
        try {
          parsedValue = JSON.parse(decrypted.toString());
        } catch {
          // Not JSON, use as string
          parsedValue = decrypted.toString();
        }
        
        // Set decrypted value
        this.setNestedValue(decryptedData, field, parsedValue);
      }
      
      return decryptedData;
    } catch (error) {
      logger.error('Error decrypting fields', { error });
      throw new Error('Failed to decrypt fields');
    }
  }
  
  /**
   * Get nested value from object using dot notation path
   * 
   * @param obj Object to get value from
   * @param path Path to value
   * @returns Value at path
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    return keys.reduce((o, key) => (o || {})[key], obj);
  }
  
  /**
   * Set nested value in object using dot notation path
   * 
   * @param obj Object to set value in
   * @param path Path to set value at
   * @param value Value to set
   */
  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split('.');
    
    // Handle all keys except the last one
    const lastKey = keys.pop()!;
    const target = keys.reduce((o, key) => {
      if (o[key] === undefined) o[key] = {};
      return o[key];
    }, obj);
    
    // Set value on target
    target[lastKey] = value;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
