/**
 * Encryption Types
 * 
 * Type definitions for encryption service
 */

/**
 * Encryption options
 */
export interface EncryptionOptions {
  algorithm: string;
  keyId: string;
  additionalData?: Buffer;
  context?: string;
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  keyId: string;
  algorithm: string;
  iv: string;
  encryptedData: string;
  authTag?: string;
}

/**
 * Key info structure
 */
export interface KeyInfo {
  id: string;
  algorithm: string;
  createdAt: Date;
  rotatedAt?: Date;
  status: 'active' | 'rotated' | 'deprecated' | 'compromised';
}

/**
 * Key rotation result
 */
export interface RotationResult {
  oldKeyId: string;
  newKeyId: string;
  itemsRotated: number;
  errors: Array<{
    item: string;
    error: string;
  }>;
}

/**
 * Key generation options
 */
export interface KeyGenerationOptions {
  keySize?: number;
  algorithm?: string;
  metadata?: Record<string, string>;
}
