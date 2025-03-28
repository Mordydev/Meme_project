/**
 * Referral Verifier
 * 
 * Verifies referrals to prevent fraud and abuse
 */
import { ReferralRepository } from '../../../repositories/referral';
import { logger } from '../../../lib/logger';

/**
 * Verification signal indicating a potential issue
 */
export interface VerificationSignal {
  type: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  reason: string;
  details?: Record<string, any>;
}

/**
 * Result of referral verification
 */
export interface VerificationResult {
  legitimate: boolean;
  confidenceScore: number;
  signals: VerificationSignal[];
  decision: 'approve' | 'reject' | 'review';
  reasons?: string[];
}

/**
 * Service for verifying referrals and detecting fraud
 */
export class ReferralVerifier {
  /**
   * Create a new ReferralVerifier instance
   */
  constructor(
    private referralRepository: ReferralRepository
  ) {}

  /**
   * Verify a referral relationship
   * 
   * @param referralId Referral ID to verify
   * @returns Verification result
   */
  async verifyReferral(referralId: string): Promise<VerificationResult> {
    // Get referral details
    const referral = await this.referralRepository.findById(referralId);
    if (!referral) {
      return {
        legitimate: false,
        confidenceScore: 0,
        signals: [{
          type: 'missing_referral',
          severity: 'high',
          confidence: 1.0,
          reason: 'Referral does not exist'
        }],
        decision: 'reject'
      };
    }

    // Initialize signals array
    const signals: VerificationSignal[] = [];

    // Apply verification rules
    await this.applyVerificationRules(referral, signals);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(signals);

    // Make verification decision
    const decision = this.makeDecision(confidenceScore, signals);

    // If decision is 'review', flag the referral
    if (decision === 'review') {
      await this.flagReferralForReview(referralId, 'Suspicious signals detected');
    }

    return {
      legitimate: decision !== 'reject',
      confidenceScore,
      signals,
      decision,
      reasons: signals.map(s => s.reason)
    };
  }

  /**
   * Apply verification rules to detect fraud signals
   * 
   * @param referral Referral to verify
   * @param signals Array to populate with detected signals
   */
  private async applyVerificationRules(referral: any, signals: VerificationSignal[]): Promise<void> {
    // Rule 1: Check for self-referral
    if (referral.referrer_id === referral.referred_id) {
      signals.push({
        type: 'self_referral',
        severity: 'high',
        confidence: 1.0,
        reason: 'Referrer and referred user are the same'
      });
    }

    // Rule 2: Check for batch signups from the same referrer
    const recentReferrals = await this.getRecentReferralsFromSameReferrer(referral.referrer_id);
    if (recentReferrals > 10) {
      signals.push({
        type: 'batch_signups',
        severity: 'medium',
        confidence: 0.7,
        reason: 'Unusually high number of referrals in a short time period',
        details: {
          count: recentReferrals,
          threshold: 10,
          timeWindow: '1 hour'
        }
      });
    }

    // Rule 3: Check referral history of the referrer
    const referrerStats = await this.getReferrerStats(referral.referrer_id);
    
    if (referrerStats.total > 50 && referrerStats.conversionRate < 10) {
      signals.push({
        type: 'low_conversion_rate',
        severity: 'medium',
        confidence: 0.6,
        reason: 'Referrer has a very low conversion rate with many referrals',
        details: {
          totalReferrals: referrerStats.total,
          convertedReferrals: referrerStats.converted,
          conversionRate: referrerStats.conversionRate
        }
      });
    }

    // Additional rules would be implemented in a real system
    // Example: IP address checking, device fingerprinting, etc.
  }

  /**
   * Calculate confidence score based on signals
   * 
   * @param signals Detected verification signals
   * @returns Confidence score (0-1)
   */
  private calculateConfidenceScore(signals: VerificationSignal[]): number {
    if (signals.length === 0) {
      return 1.0; // No signals means high confidence in legitimacy
    }

    // Calculate weighted average of signal confidences
    const weights = {
      'low': 0.3,
      'medium': 0.6,
      'high': 1.0
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      const weight = weights[signal.severity];
      weightedSum += (1 - signal.confidence) * weight;
      totalWeight += weight;
    }

    // Return inverse score (1 = legitimate, 0 = fraudulent)
    return totalWeight > 0 ? 1 - (weightedSum / totalWeight) : 1.0;
  }

  /**
   * Make a decision based on confidence score and signals
   * 
   * @param confidenceScore Confidence score
   * @param signals Detected verification signals
   * @returns Decision: approve, reject, or review
   */
  private makeDecision(confidenceScore: number, signals: VerificationSignal[]): 'approve' | 'reject' | 'review' {
    // Check for any high-severity signals
    const hasHighSeverity = signals.some(s => s.severity === 'high' && s.confidence > 0.8);
    if (hasHighSeverity) {
      return 'reject';
    }

    // Decision based on confidence score
    if (confidenceScore >= 0.9) {
      return 'approve';
    } else if (confidenceScore >= 0.5) {
      return 'review';
    } else {
      return 'reject';
    }
  }

  /**
   * Flag a referral for manual review
   * 
   * @param referralId Referral ID to flag
   * @param reason Reason for flagging
   */
  private async flagReferralForReview(referralId: string, reason: string): Promise<void> {
    // In a real implementation, this would store the flag in the database
    // For now, we'll just log it
    logger.warn(`Referral flagged for review: ${referralId}`, { reason });
  }

  /**
   * Get number of recent referrals from the same referrer
   * 
   * @param referrerId Referrer ID
   * @returns Number of recent referrals
   */
  private async getRecentReferralsFromSameReferrer(referrerId: string): Promise<number> {
    // Calculate time threshold (1 hour ago)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // In a real implementation, this would query the database
    // For now, return a random number for demonstration
    return Math.floor(Math.random() * 15);
  }

  /**
   * Get referrer statistics for fraud detection
   * 
   * @param referrerId Referrer ID
   * @returns Referrer statistics
   */
  private async getReferrerStats(referrerId: string): Promise<{
    total: number;
    converted: number;
    conversionRate: number;
  }> {
    // In a real implementation, this would calculate actual stats
    // For now, return simulated statistics
    const stats = await this.referralRepository.getReferralStats(referrerId);
    
    const total = stats.total;
    const converted = stats.completed + stats.converted + stats.rewarded;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;
    
    return {
      total,
      converted,
      conversionRate
    };
  }

  /**
   * Check for unusual activity patterns
   * 
   * @param userId User ID to check
   * @returns Whether unusual activity is detected
   */
  async detectAbusePatterns(userId: string): Promise<{
    suspicious: boolean;
    patterns: string[];
    riskScore: number;
  }> {
    // In a real implementation, this would analyze various signals
    // For now, return a simple result
    return {
      suspicious: false,
      patterns: [],
      riskScore: 0.1
    };
  }

  /**
   * Check referral rate limits for a user
   * 
   * @param userId User ID to check
   * @returns Whether user has exceeded rate limits
   */
  async checkRateLimits(userId: string): Promise<{
    allowed: boolean;
    currentCount: number;
    limit: number;
    resetTime?: Date;
  }> {
    // Get user's referral count in the past 24 hours
    const currentCount = 0; // Would be calculated from database

    // Default daily limit
    const limit = 20;

    // Calculate reset time (next day)
    const resetTime = new Date();
    resetTime.setHours(24, 0, 0, 0);

    return {
      allowed: currentCount < limit,
      currentCount,
      limit,
      resetTime
    };
  }
}
