/**
 * JWT Service
 * 
 * Provides functionality for generating, verifying, and managing JWT tokens
 */
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { logger } from '../../lib/logger';

/**
 * Token payload interface
 */
export interface TokenPayload {
  sub: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

/**
 * JWT verification options
 */
export interface VerifyOptions {
  ignoreExpiration?: boolean;
  audience?: string | string[];
  issuer?: string;
}

/**
 * JWT service for token management
 */
export class JwtService {
  /**
   * Secret key for signing tokens
   */
  private readonly secretKey: string;
  
  /**
   * Token expiration time in seconds
   */
  private readonly expiresIn: number;
  
  /**
   * Token issuer
   */
  private readonly issuer: string;
  
  /**
   * Token audience
   */
  private readonly audience: string;
  
  /**
   * Create JWT service
   * @param secretKey JWT secret key
   * @param options Additional options
   */
  constructor(
    secretKey: string,
    options: {
      expiresIn?: number;
      issuer?: string;
      audience?: string;
    } = {}
  ) {
    this.secretKey = secretKey;
    this.expiresIn = options.expiresIn || 60 * 60 * 24; // 24 hours
    this.issuer = options.issuer || 'success-kid-platform';
    this.audience = options.audience || 'success-kid-users';
  }
  
  /**
   * Generate JWT token
   * @param payload Token payload
   * @param expiresIn Expiration time in seconds
   * @returns JWT token
   */
  sign(payload: TokenPayload, expiresIn?: number): string {
    try {
      const token = jwt.sign(
        payload,
        this.secretKey,
        {
          expiresIn: expiresIn || this.expiresIn,
          issuer: this.issuer,
          audience: this.audience
        }
      );
      
      return token;
    } catch (error) {
      logger.error('Error signing JWT token', { error });
      throw error;
    }
  }
  
  /**
   * Verify JWT token
   * @param token JWT token
   * @param options Verification options
   * @returns Token payload
   */
  async verify(token: string, options: VerifyOptions = {}): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(
        token,
        this.secretKey,
        {
          ignoreExpiration: options.ignoreExpiration || false,
          audience: options.audience || this.audience,
          issuer: options.issuer || this.issuer
        }
      ) as TokenPayload;
      
      return payload;
    } catch (error) {
      logger.error('Error verifying JWT token', { error, token: token.substring(0, 10) + '...' });
      throw error;
    }
  }
  
  /**
   * Decode JWT token without verification
   * @param token JWT token
   * @returns Token payload
   */
  decode(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      logger.error('Error decoding JWT token', { error });
      return null;
    }
  }
  
  /**
   * Generate refresh token
   * @param userId User ID
   * @param expiresIn Expiration time in seconds
   * @returns Refresh token
   */
  generateRefreshToken(userId: string, expiresIn?: number): string {
    return this.sign(
      {
        sub: userId,
        type: 'refresh'
      },
      expiresIn || 60 * 60 * 24 * 30 // 30 days
    );
  }
}

// Create and export singleton
let jwtService: JwtService | null = null;

/**
 * Get JWT service instance
 * @returns JWT service
 */
export function getJwtService(): JwtService {
  if (!jwtService) {
    jwtService = new JwtService(
      config.auth.jwtSecret,
      {
        expiresIn: config.auth.jwtExpiresIn,
        issuer: config.auth.jwtIssuer,
        audience: config.auth.jwtAudience
      }
    );
  }
  
  return jwtService;
}

export default getJwtService;
