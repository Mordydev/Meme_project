/**
 * Encryption Types
 * 
 * This module defines types for the encryption services.
 */

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  /**
   * ID of the key used for encryption
   */
  keyId: string;
  
  /**
   * Algorithm used for encryption
   */
  algorithm: string;
  
  /**
   * Initialization vector, base64 encoded
   */
  iv: string;
  
  /**
   * Authentication tag for AEAD algorithms, base64 encoded
   */
  authTag?: string;
  
  /**
   * Encrypted data, base64 encoded
   */
  encryptedData: string;
  
  /**
   * Additional authenticated data, base64 encoded
   */
  aad?: string;
  
  /**
   * Metadata for this encrypted data
   */
  metadata?: Record<string, any>;
  
  /**
   * When this data was encrypted
   */
  createdAt: string;
}

/**
 * Key information
 */
export interface KeyInfo {
  /**
   * Key ID
   */
  id: string;
  
  /**
   * When the key was created
   */
  createdAt: string;
  
  /**
   * When the key expires
   */
  expiresAt?: string;
  
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
 * Key rotation result
 */
export interface RotationResult {
  /**
   * Old key ID
   */
  oldKeyId: string;
  
  /**
   * New key ID
   */
  newKeyId: string;
  
  /**
   * Number of records re-encrypted
   */
  recordsReEncrypted: number;
  
  /**
   * Whether the rotation is complete
   */
  complete: boolean;
  
  /**
   * When the rotation started
   */
  startedAt: string;
  
  /**
   * When the rotation completed
   */
  completedAt?: string;
}

/**
 * Encryption options
 */
export interface EncryptionOptions {
  /**
   * Encryption algorithm to use
   */
  algorithm: string;
  
  /**
   * Key ID to use for encryption
   */
  keyId: string;
  
  /**
   * Additional authenticated data for AEAD algorithms
   */
  additionalData?: Buffer;
  
  /**
   * Context for ensuring proper encryption, used in record selection
   */
  context?: string;
  
  /**
   * Additional key-value pairs to store with the encrypted data
   */
  metadata?: Record<string, any>;
}
