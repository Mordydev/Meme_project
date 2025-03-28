/**
 * Encryption Key Management
 * 
 * This module provides functionality for managing encryption keys.
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { KeyInfo } from './types';

/**
 * Key storage entry
 */
interface KeyEntry {
  /**
   * Key ID
   */
  id: string;
  
  /**
   * Key material (encryption key)
   */
  key: Buffer;
  
  /**
   * When the key was created
   */
  createdAt: Date;
  
  /**
   * When the key expires
   */
  expiresAt?: Date;
  
  /**
   * Whether the key is active (can be used for encryption)
   */
  active: boolean;
  
  /**
   * Key algorithm
   */
  algorithm: string;
  
  /**
   * Key size in bits
   */
  size: number;
}

/**
 * Key management service
 */
export class KeyManager {
  private keys: Map<string, KeyEntry> = new Map();
  private masterKey: Buffer;
  private activeKeyId: string | null = null;
  private defaultAlgorithm: string;
  private defaultKeySize: number;
  private keyRotationDays: number;
  
  /**
   * Create a new key manager
   */
  constructor(options: {
    masterKey?: string;
    defaultAlgorithm?: string;
    defaultKeySize?: number;
    keyRotationDays?: number;
  } = {}) {
    // Initialize master key (used to encrypt keys at rest)
    this.masterKey = options.masterKey 
      ? Buffer.from(options.masterKey, 'hex')
      : randomBytes(32); // 256 bits
    
    this.defaultAlgorithm = options.defaultAlgorithm || 'aes-256-gcm';
    this.defaultKeySize = options.defaultKeySize || 256;
    this.keyRotationDays = options.keyRotationDays || 90;
    
    // Generate initial key if none exists
    this.generateKey();
    
    logger.info('Key manager initialized');
  }
  
  /**
   * Generate a new encryption key
   */
  generateKey(
    options: {
      algorithm?: string;
      size?: number;
      active?: boolean;
    } = {}
  ): KeyInfo {
    const algorithm = options.algorithm || this.defaultAlgorithm;
    const size = options.size || this.defaultKeySize;
    const active = options.active !== undefined ? options.active : true;
    
    // Determine key size in bytes
    const keyBytes = Math.ceil(size / 8);
    
    // Generate key material
    const key = randomBytes(keyBytes);
    
    // Create key entry
    const id = uuidv4();
    const now = new Date();
    
    const keyEntry: KeyEntry = {
      id,
      key,
      createdAt: now,
      expiresAt: new Date(now.getTime() + (this.keyRotationDays * 24 * 60 * 60 * 1000)),
      active,
      algorithm,
      size
    };
    
    // Store key
    this.keys.set(id, keyEntry);
    
    // Update active key if this is active and we don't have an active key
    if (active && !this.activeKeyId) {
      this.activeKeyId = id;
    }
    
    logger.info('Generated new encryption key', { id, algorithm, size });
    
    return this.getKeyInfo(id);
  }
  
  /**
   * Get a key by ID
   */
  async getKey(keyId: string): Promise<Buffer> {
    const keyEntry = this.keys.get(keyId);
    
    if (!keyEntry) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    return keyEntry.key;
  }
  
  /**
   * Get information about a key
   */
  getKeyInfo(keyId: string): KeyInfo {
    const keyEntry = this.keys.get(keyId);
    
    if (!keyEntry) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    return {
      id: keyEntry.id,
      createdAt: keyEntry.createdAt.toISOString(),
      expiresAt: keyEntry.expiresAt?.toISOString(),
      active: keyEntry.active,
      algorithm: keyEntry.algorithm,
      size: keyEntry.size
    };
  }
  
  /**
   * Get all key information
   */
  getAllKeys(): KeyInfo[] {
    return Array.from(this.keys.values()).map(key => ({
      id: key.id,
      createdAt: key.createdAt.toISOString(),
      expiresAt: key.expiresAt?.toISOString(),
      active: key.active,
      algorithm: key.algorithm,
      size: key.size
    }));
  }
  
  /**
   * Get the active key ID
   */
  getActiveKeyId(): string {
    if (!this.activeKeyId) {
      // Generate a new active key if none exists
      const keyInfo = this.generateKey();
      this.activeKeyId = keyInfo.id;
    }
    
    return this.activeKeyId;
  }
  
  /**
   * Set a key as active
   */
  setActiveKey(keyId: string): void {
    if (!this.keys.has(keyId)) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    // Update key status
    for (const [id, key] of this.keys.entries()) {
      key.active = id === keyId;
    }
    
    this.activeKeyId = keyId;
    
    logger.info('Set active encryption key', { keyId });
  }
  
  /**
   * Delete a key
   */
  deleteKey(keyId: string): void {
    // Cannot delete active key
    if (keyId === this.activeKeyId) {
      throw new Error('Cannot delete active key');
    }
    
    if (!this.keys.has(keyId)) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    this.keys.delete(keyId);
    
    logger.info('Deleted encryption key', { keyId });
  }
  
  /**
   * Rotate keys
   */
  rotateKeys(): { oldKeyId: string; newKeyId: string } {
    // Remember old active key
    const oldKeyId = this.activeKeyId;
    
    if (!oldKeyId) {
      throw new Error('No active key to rotate');
    }
    
    // Generate new key with same settings as current
    const oldKey = this.keys.get(oldKeyId)!;
    
    const newKeyInfo = this.generateKey({
      algorithm: oldKey.algorithm,
      size: oldKey.size,
      active: true
    });
    
    // Set new key as active
    this.setActiveKey(newKeyInfo.id);
    
    // Mark old key as inactive
    oldKey.active = false;
    
    logger.info('Rotated encryption keys', { oldKeyId, newKeyId: newKeyInfo.id });
    
    return { oldKeyId, newKeyId: newKeyInfo.id };
  }
  
  /**
   * Export keys for backup (encrypted with master key)
   */
  exportKeys(): string {
    const keysExport = {
      keys: Array.from(this.keys.entries()).map(([id, key]) => ({
        id,
        key: key.key.toString('base64'),
        createdAt: key.createdAt.toISOString(),
        expiresAt: key.expiresAt?.toISOString(),
        active: key.active,
        algorithm: key.algorithm,
        size: key.size
      })),
      activeKeyId: this.activeKeyId
    };
    
    // Encrypt with master key
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    let encrypted = cipher.update(JSON.stringify(keysExport), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      data: encrypted
    });
  }
  
  /**
   * Import keys from backup
   */
  importKeys(exportData: string): void {
    try {
      const { iv, authTag, data } = JSON.parse(exportData);
      
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        Buffer.from(iv, 'base64')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));
      
      let decrypted = decipher.update(data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      const keysImport = JSON.parse(decrypted);
      
      // Import keys
      this.keys.clear();
      
      for (const keyData of keysImport.keys) {
        this.keys.set(keyData.id, {
          id: keyData.id,
          key: Buffer.from(keyData.key, 'base64'),
          createdAt: new Date(keyData.createdAt),
          expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt) : undefined,
          active: keyData.active,
          algorithm: keyData.algorithm,
          size: keyData.size
        });
      }
      
      this.activeKeyId = keysImport.activeKeyId;
      
      logger.info('Imported encryption keys', {
        keyCount: keysImport.keys.length,
        activeKeyId: this.activeKeyId
      });
    } catch (error) {
      logger.error('Error importing keys', { error });
      throw new Error('Failed to import keys');
    }
  }
}

// Export singleton instance
export const keyManager = new KeyManager();
