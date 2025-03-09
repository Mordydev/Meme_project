import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { config } from '../../config';

/**
 * Interface for encrypted data structure
 */
export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  context: string;
  version: number;
  createdAt: string;
}

/**
 * Data Protection Service for handling sensitive data encryption and sanitization
 * Implements a comprehensive data protection strategy for the platform
 */
export class DataProtectionService {
  private encryptionKey: Buffer;
  private keyCache: Map<string, Buffer>;
  
  constructor(
    private fastify: FastifyInstance
  ) {
    // Initialize key cache
    this.keyCache = new Map();
    
    // Derive master encryption key from environment
    this.encryptionKey = this.deriveEncryptionKey(config.security.encryptionSecret || '');
    
    // Validate encryption key
    if (!this.encryptionKey || this.encryptionKey.length !== 32) {
      fastify.log.warn('Invalid encryption key configuration. Sensitive data protection may be compromised.');
      // Generate a temporary key for this session
      this.encryptionKey = crypto.randomBytes(32);
    }
  }
  
  /**
   * Encrypt sensitive data with AES-256-GCM
   * 
   * @param data The data to encrypt
   * @param context String identifying the data context (e.g., 'wallet', 'personalInfo')
   * @returns EncryptedData object
   */
  async encryptSensitiveData(data: string, context: string): Promise<EncryptedData> {
    try {
      // Get context-specific encryption key
      const encryptionKey = await this.getContextKey(context);
      
      // Generate random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher with AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag for integrity verification
      const tag = cipher.getAuthTag().toString('hex');
      
      // Log encryption operation (without the actual data)
      this.fastify.log.debug({
        action: 'encrypt_data',
        context,
        dataLength: data.length
      }, 'Data encrypted successfully');
      
      return {
        data: encrypted,
        iv: iv.toString('hex'),
        tag,
        context,
        version: 1, // For future encryption scheme changes
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      this.fastify.log.error({
        error,
        context,
        action: 'encrypt_data_failed'
      }, 'Failed to encrypt sensitive data');
      
      throw new Error('Data encryption failed');
    }
  }
  
  /**
   * Decrypt previously encrypted data
   * 
   * @param encryptedData The encrypted data object
   * @returns Decrypted string
   */
  async decryptSensitiveData(encryptedData: EncryptedData): Promise<string> {
    try {
      // Get context-specific encryption key
      const encryptionKey = await this.getContextKey(encryptedData.context);
      
      // Convert IV and tag back to buffers
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
      
      // Set auth tag for integrity verification
      decipher.setAuthTag(tag);
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Log decryption operation (without the actual data)
      this.fastify.log.debug({
        action: 'decrypt_data',
        context: encryptedData.context,
        dataLength: decrypted.length
      }, 'Data decrypted successfully');
      
      return decrypted;
    } catch (error) {
      this.fastify.log.error({
        error,
        context: encryptedData.context,
        action: 'decrypt_data_failed'
      }, 'Failed to decrypt sensitive data');
      
      throw new Error('Data decryption failed - data may be tampered with or corrupted');
    }
  }
  
  /**
   * Sanitize user data based on audience context
   * 
   * @param userData User data object to sanitize
   * @param audience Target audience for the data
   * @returns Sanitized data object
   */
  sanitizeUserData(userData: any, audience: 'public' | 'private' | 'admin'): any {
    if (!userData) return null;
    
    // Clone to avoid modifying original
    const sanitized = { ...userData };
    
    // Apply audience-specific sanitization
    switch (audience) {
      case 'public':
        // Remove sensitive fields for public display
        delete sanitized.email;
        delete sanitized.walletAddress;
        delete sanitized.phoneNumber;
        delete sanitized.personalDetails;
        delete sanitized.verificationDetails;
        delete sanitized.emailVerified;
        delete sanitized.ipHistory;
        delete sanitized.lastLoginAt;
        
        // Sanitize profile data if present
        if (sanitized.profile) {
          delete sanitized.profile.privateContactInfo;
        }
        break;
        
      case 'private':
        // Limited personal data for the user themselves
        // User can see their own data, but still protect some fields
        delete sanitized.internalNotes;
        delete sanitized.adminFlags;
        delete sanitized.riskScore;
        delete sanitized.ipHistory;
        delete sanitized.moderation;
        
        // Show email but not full wallet address
        if (sanitized.walletAddress) {
          sanitized.walletAddress = this.maskWalletAddress(sanitized.walletAddress);
        }
        break;
        
      case 'admin':
        // Admin can see all fields
        // No sanitization needed
        break;
    }
    
    // Always sanitize any payment information
    if (sanitized.paymentDetails) {
      if (sanitized.paymentDetails.cardNumber) {
        sanitized.paymentDetails.cardNumber = this.maskCardNumber(
          sanitized.paymentDetails.cardNumber
        );
      }
    }
    
    return sanitized;
  }
  
  /**
   * Hash personal identifiable information (PII) for storage
   * 
   * @param pii The PII to hash
   * @param salt Optional salt to use (will generate if not provided)
   * @returns Hashed PII with salt
   */
  hashPII(pii: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    
    // Create HMAC with SHA-256
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(pii + useSalt);
    
    return {
      hash: hmac.digest('hex'),
      salt: useSalt
    };
  }
  
  /**
   * Verify if a PII matches a previously hashed value
   * 
   * @param pii The PII to verify
   * @param hash The hash to compare against
   * @param salt The salt used for the hash
   * @returns Boolean indicating if the PII matches
   */
  verifyPII(pii: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashPII(pii, salt);
    return computedHash === hash;
  }
  
  /**
   * Detect if an object contains PII that should be protected
   * 
   * @param data Object to scan for PII
   * @returns Array of paths to PII found
   */
  detectPII(data: any): string[] {
    const piiPaths: string[] = [];
    
    // Simple PII patterns
    const piiPatterns = {
      email: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      phone: /(\+\d{1,3})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
      ssn: /\d{3}-\d{2}-\d{4}/,
      creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/
    };
    
    // Recursively scan object
    const scan = (obj: any, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if key suggests PII
        const piiKeys = ['email', 'phone', 'ssn', 'creditCard', 'password', 'secret', 'address'];
        if (piiKeys.some(k => key.toLowerCase().includes(k))) {
          piiPaths.push(currentPath);
          return;
        }
        
        // If it's a string, check against PII patterns
        if (typeof value === 'string') {
          for (const [patternName, pattern] of Object.entries(piiPatterns)) {
            if (pattern.test(value)) {
              piiPaths.push(`${currentPath} (possible ${patternName})`);
              break;
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          // Recurse into nested objects
          scan(value, currentPath);
        }
      });
    };
    
    scan(data);
    return piiPaths;
  }
  
  /**
   * Generate a pseudonymized identifier for analytics or tracking
   * 
   * @param userId User ID to pseudonymize
   * @param context Context where this identifier will be used
   * @returns Pseudonymized identifier
   */
  generatePseudonymizedId(userId: string, context: string): string {
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(`${userId}-${context}-${config.security.pseudonymizationSalt || ''}`);
    return hmac.digest('hex');
  }
  
  /**
   * Helper to mask wallet address for display
   */
  private maskWalletAddress(address: string): string {
    if (!address || address.length < 8) return address;
    
    const prefix = address.slice(0, 4);
    const suffix = address.slice(-4);
    
    return `${prefix}...${suffix}`;
  }
  
  /**
   * Helper to mask credit card number
   */
  private maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    
    // Remove spaces and other separators
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Keep only last 4 digits
    const lastFour = cleaned.slice(-4);
    
    // Replace rest with asterisks
    return '•'.repeat(cleaned.length - 4) + lastFour;
  }
  
  /**
   * Get encryption key for specific context
   */
  private async getContextKey(context: string): Promise<Buffer> {
    // Check if context key is cached
    if (this.keyCache.has(context)) {
      return this.keyCache.get(context)!;
    }
    
    // Derive context-specific key using HMAC
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(context);
    const contextKey = hmac.digest();
    
    // Cache the context key
    this.keyCache.set(context, contextKey);
    
    return contextKey;
  }
  
  /**
   * Derive encryption key from secret
   */
  private deriveEncryptionKey(secret: string): Buffer {
    if (!secret) {
      throw new Error('Encryption secret not configured');
    }
    
    // Use PBKDF2 to derive a key from the secret
    return crypto.pbkdf2Sync(
      secret,
      config.security.encryptionSalt || 'wildnout-platform',
      10000,
      32,
      'sha256'
    );
  }
}
