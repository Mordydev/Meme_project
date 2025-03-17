/**
 * Referral Code Service
 * 
 * Service for generating and managing referral codes
 */
import { customAlphabet } from 'nanoid';
import { 
  ReferralCodeRepository,
  ReferralCampaignRepository
} from '../../repositories/referral';
import { 
  ReferralCode,
  GenerateReferralCodeDto
} from '../../models/entities/referral.model';
import { EventBus } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { ValidationError, NotFoundError, ConflictError } from '../../errors';

// Create nanoid generator for referral codes
// Using a custom alphabet without similar-looking characters
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

/**
 * Configuration for code generation
 */
interface CodeGenerationConfig {
  defaultLength: number;
  customCodeMinLength: number;
  customCodeMaxLength: number;
  reservedPrefixes: string[];
  profanityList: string[];
}

/**
 * Service for referral code management
 */
export class ReferralCodeService {
  /**
   * Default configuration for code generation
   */
  private readonly config: CodeGenerationConfig = {
    defaultLength: 8,
    customCodeMinLength: 6,
    customCodeMaxLength: 20,
    reservedPrefixes: ['ADMIN', 'MOD', 'TEST', 'SYSTEM'],
    profanityList: [] // Would contain inappropriate terms to block
  };

  /**
   * Create a new ReferralCodeService instance
   */
  constructor(
    private referralCodeRepository: ReferralCodeRepository,
    private referralCampaignRepository: ReferralCampaignRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Generate a new referral code for a user
   * 
   * @param options Referral code options
   * @returns Generated referral code
   */
  async generateCode(options: GenerateReferralCodeDto): Promise<ReferralCode> {
    // Check if the user already has an active code
    const existingCode = await this.referralCodeRepository.findActiveByUserId(options.user_id);
    
    // If user already has a code and isn't requesting a custom one, return the existing code
    if (existingCode && !options.custom_code) {
      return existingCode;
    }
    
    // If user is requesting a custom code
    if (options.custom_code) {
      // Validate custom code
      this.validateCustomCode(options.custom_code);
      
      // Check if code is unique
      const isUnique = !(await this.referralCodeRepository.isCodeInUse(options.custom_code));
      if (!isUnique) {
        throw new ConflictError('Custom code is already in use');
      }
      
      // Create the code
      const code = await this.referralCodeRepository.generateCode({
        ...options,
        custom_code: options.custom_code
      });
      
      // Emit event
      this.eventBus.publish('referral.code_generated', {
        userId: options.user_id,
        codeId: code.id,
        codeValue: code.code,
        isCustom: true
      });
      
      logger.info(`Custom referral code generated for user ${options.user_id}: ${code.code}`);
      
      return code;
    }
    
    // Generate a random code with retries
    let codeValue: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!isUnique && attempts < maxAttempts) {
      codeValue = this.generateRandomCode();
      isUnique = !(await this.referralCodeRepository.isCodeInUse(codeValue));
      attempts++;
    }
    
    // If we couldn't generate a unique code, use UUID-based fallback
    if (!isUnique) {
      throw new Error('Failed to generate a unique referral code after multiple attempts');
    }
    
    // Create the code
    const code = await this.referralCodeRepository.generateCode({
      ...options,
      custom_code: codeValue
    });
    
    // Emit event
    this.eventBus.publish('referral.code_generated', {
      userId: options.user_id,
      codeId: code.id,
      codeValue: code.code,
      isCustom: false
    });
    
    logger.info(`Referral code generated for user ${options.user_id}: ${code.code}`);
    
    return code;
  }

  /**
   * Get active referral code for a user
   * 
   * @param userId User ID
   * @returns Active referral code or null if not found
   */
  async getUserCode(userId: string): Promise<ReferralCode | null> {
    return this.referralCodeRepository.findActiveByUserId(userId);
  }

  /**
   * Validate a referral code
   * 
   * @param code Referral code to validate
   * @returns Validation result with referrer information
   */
  async validateCode(code: string): Promise<{
    valid: boolean;
    referrerId?: string;
    active?: boolean;
  }> {
    // Find the code
    const referralCode = await this.referralCodeRepository.findByCode(code);
    
    // If code doesn't exist
    if (!referralCode) {
      return { valid: false };
    }
    
    // Check if code is active
    if (!referralCode.is_active) {
      return { valid: false, referrerId: referralCode.user_id, active: false };
    }
    
    // Check if code has expired
    if (referralCode.expires_at && new Date() > referralCode.expires_at) {
      return { valid: false, referrerId: referralCode.user_id, active: false };
    }
    
    // Check if code has reached usage limit
    if (referralCode.max_uses !== null && referralCode.uses >= referralCode.max_uses) {
      return { valid: false, referrerId: referralCode.user_id, active: false };
    }
    
    return { valid: true, referrerId: referralCode.user_id, active: true };
  }

  /**
   * Deactivate a referral code
   * 
   * @param userId User ID
   * @param codeId Code ID to deactivate
   * @returns Deactivated code
   */
  async deactivateCode(userId: string, codeId: string): Promise<ReferralCode> {
    // Find the code
    const code = await this.referralCodeRepository.findById(codeId);
    
    // Verify code exists
    if (!code) {
      throw new NotFoundError('Referral code', codeId);
    }
    
    // Check ownership
    if (code.user_id !== userId) {
      throw new ValidationError('Cannot deactivate a code that belongs to another user');
    }
    
    // Deactivate the code
    const deactivatedCode = await this.referralCodeRepository.deactivateCode(codeId);
    
    // Emit event
    this.eventBus.publish('referral.code_deactivated', {
      userId,
      codeId,
      codeValue: deactivatedCode.code
    });
    
    logger.info(`Referral code deactivated: ${codeId}`);
    
    return deactivatedCode;
  }

  /**
   * Get a referral link for sharing
   * 
   * @param userId User ID
   * @param baseUrl Base URL for the referral link
   * @param customCode Optional custom code part
   * @returns Referral link information
   */
  async getReferralLink(
    userId: string, 
    baseUrl: string = 'https://successkid.io/join', 
    customCode?: string
  ): Promise<{
    code: string;
    url: string;
    qrCodeUrl: string;
  }> {
    let code: ReferralCode;
    
    if (customCode) {
      // Generate a custom code
      code = await this.generateCode({
        user_id: userId,
        custom_code: customCode
      });
    } else {
      // Get or generate a code
      const existingCode = await this.referralCodeRepository.findActiveByUserId(userId);
      
      if (existingCode) {
        code = existingCode;
      } else {
        code = await this.generateCode({ user_id: userId });
      }
    }
    
    const url = `${baseUrl}?ref=${code.code}`;
    const qrCodeUrl = `https://successkid.io/api/qr?code=${code.code}`;
    
    return {
      code: code.code,
      url,
      qrCodeUrl
    };
  }

  /**
   * Generate a random referral code
   * 
   * @returns Random referral code
   */
  private generateRandomCode(): string {
    return nanoid();
  }

  /**
   * Validate a custom referral code
   * 
   * @param code Custom code to validate
   * @throws ValidationError if code is invalid
   */
  private validateCustomCode(code: string): void {
    // Check length
    if (code.length < this.config.customCodeMinLength) {
      throw new ValidationError(`Custom code must be at least ${this.config.customCodeMinLength} characters`);
    }
    
    if (code.length > this.config.customCodeMaxLength) {
      throw new ValidationError(`Custom code cannot exceed ${this.config.customCodeMaxLength} characters`);
    }
    
    // Check format
    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      throw new ValidationError('Custom code can only contain letters, numbers, underscores, and hyphens');
    }
    
    // Check for reserved prefixes
    for (const prefix of this.config.reservedPrefixes) {
      if (code.toUpperCase().startsWith(prefix)) {
        throw new ValidationError(`Custom code cannot start with reserved prefix '${prefix}'`);
      }
    }
    
    // Check for profanity
    for (const term of this.config.profanityList) {
      if (code.toUpperCase().includes(term.toUpperCase())) {
        throw new ValidationError('Custom code contains inappropriate content');
      }
    }
  }
}
