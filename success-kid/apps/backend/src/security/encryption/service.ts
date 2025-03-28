/**
 * Encryption Service
 * 
 * This module provides a service for encrypting and decrypting data.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { keyManager } from './keys';
import { EncryptedData, EncryptionOptions, RotationResult } from './types';

/**
 * Default encryption options
 */
const defaultEncryptionOptions: Partial<EncryptionOptions> = {
  algorithm: 'aes-256-gcm'
};

/**
 * Encryption Service
 */
export class EncryptionService {
  /**
   * Encrypt data
   */
  async encrypt(
    data: string | Buffer,
    options: Partial<EncryptionOptions> = {}
  ): Promise<EncryptedData> {
    try {
      // Merge options with defaults
      const encryptOptions: EncryptionOptions = {
        ...defaultEncryptionOptions,
        keyId: options.keyId || keyManager.getActiveKeyId(),
        algorithm: options.algorithm || defaultEncryptionOptions.algorithm!,
        additionalData: options.additionalData,
        context: options.context,
        metadata: options.metadata
      };
      
      // Get encryption key
      const key = await keyManager.getKey(encryptOptions.keyId);
      
      // Generate initialization vector
      const iv = randomBytes(16);
      
      // Create cipher with selected algorithm
      const cipher = createCipheriv(encryptOptions.algorithm, key, iv);
      
      // Add authentication data if provided
      if (encryptOptions.additionalData) {
        cipher.setAAD(encryptOptions.additionalData);
      }
      
      // Encrypt data
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const encryptedContent = Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final()
      ]);
      
      // Create encrypted data object
      const result: EncryptedData = {
        keyId: encryptOptions.keyId,
        algorithm: encryptOptions.algorithm,
        iv: iv.toString('base64'),
        encryptedData: encryptedContent.toString('base64'),
        createdAt: new Date().toISOString()
      };
      
      // Add authentication tag for AEAD algorithms (like GCM)
      if (encryptOptions.algorithm.includes('gcm')) {
        result.authTag = cipher.getAuthTag().toString('base64');
      }
      
      // Add additional authenticated data if provided
      if (encryptOptions.additionalData) {
        result.aad = encryptOptions.additionalData.toString('base64');
      }
      
      // Add metadata if provided
      if (encryptOptions.metadata) {
        result.metadata = encryptOptions.metadata;
      }
      
      return result;
    } catch (error) {
      logger.error('Encryption error', { error });
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt data
   */
  async decrypt(encryptedData: EncryptedData): Promise<Buffer> {
    try {
      // Get decryption key
      const key = await keyManager.getKey(encryptedData.keyId);
      
      // Create decipher
      const decipher = createDecipheriv(
        encryptedData.algorithm,
        key,
        Buffer.from(encryptedData.iv, 'base64')
      );
      
      // Set auth tag for AEAD algorithms
      if (encryptedData.authTag) {
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
      }
      
      // Set additional authenticated data if provided
      if (encryptedData.aad) {
        decipher.setAAD(Buffer.from(encryptedData.aad, 'base64'));
      }
      
      // Decrypt data
      const encryptedBuffer = Buffer.from(encryptedData.encryptedData, 'base64');
      
      const decryptedData = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]);
      
      return decryptedData;
    } catch (error) {
      logger.error('Decryption error', { error });
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Re-encrypt data with a new key
   */
  async reEncrypt(
    encryptedData: EncryptedData,
    newKeyId: string
  ): Promise<EncryptedData> {
    try {
      // Decrypt data
      const decryptedData = await this.decrypt(encryptedData);
      
      // Re-encrypt with new key
      const reEncryptedData = await this.encrypt(decryptedData, {
        keyId: newKeyId,
        algorithm: encryptedData.algorithm,
        additionalData: encryptedData.aad 
          ? Buffer.from(encryptedData.aad, 'base64') 
          : undefined,
        context: encryptedData.metadata?.context,
        metadata: encryptedData.metadata
      });
      
      return reEncryptedData;
    } catch (error) {
      logger.error('Re-encryption error', { error });
      throw new Error('Failed to re-encrypt data');
    }
  }
  
  /**
   * Rotate encryption keys
   */
  async rotateKey(oldKeyId: string, newKeyId: string): Promise<RotationResult> {
    try {
      // Simulate key rotation for data stored in database
      // In a real implementation, this would query and update encrypted records
      
      const result: RotationResult = {
        oldKeyId,
        newKeyId,
        recordsReEncrypted: 0,
        complete: true,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };
      
      logger.info('Key rotation completed', {
        oldKeyId,
        newKeyId,
        recordsReEncrypted: result.recordsReEncrypted
      });
      
      return result;
    } catch (error) {
      logger.error('Key rotation error', { error });
      throw new Error('Failed to rotate encryption key');
    }
  }
  
  /**
   * Encrypt a field value
   */
  async encryptField(
    value: string,
    context: string,
    additionalData?: Record<string, any>
  ): Promise<string> {
    // Convert value to string if needed
    const valueString = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Create AAD buffer from context
    const aadBuffer = Buffer.from(context);
    
    // Encrypt the value
    const encrypted = await this.encrypt(valueString, {
      additionalData: aadBuffer,
      context,
      metadata: additionalData
    });
    
    // Return serialized encrypted data
    return JSON.stringify(encrypted);
  }
  
  /**
   * Decrypt a field value
   */
  async decryptField(encryptedValue: string): Promise<string> {
    try {
      // Parse encrypted data
      const encryptedData = JSON.parse(encryptedValue) as EncryptedData;
      
      // Decrypt the value
      const decryptedBuffer = await this.decrypt(encryptedData);
      
      // Return as string
      return decryptedBuffer.toString('utf8');
    } catch (error) {
      logger.error('Field decryption error', { error });
      throw new Error('Failed to decrypt field value');
    }
  }
  
  /**
   * Get the active encryption key
   */
  getActiveKey(): string {
    return keyManager.getActiveKeyId();
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
