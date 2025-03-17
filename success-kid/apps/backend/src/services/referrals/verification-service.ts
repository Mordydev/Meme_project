/**
 * Referral Verification Service
 * 
 * Handles verification of legitimate referrals and prevents fraud or abuse
 */
import { Pool } from 'pg';
import { ReferralTrackingRepository } from '../../repositories/referral-tracking-repository';
import { UserRepository } from '../../repositories/user-repository';
import { logger } from '../../lib/logger';
import { getRedisClient } from '../../lib/db-client';

export interface VerificationSignal {
  type: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  legitimate: boolean;
  confidenceScore: number;
  signals: VerificationSignal[];
  decision: 'approve' | 'reject' | 'review';
  reasons?: string[];
}

export interface ReviewDecision {
  action: 'approve' | 'reject';
  reason: string;
  reviewerId: string;
}

export interface ReferralVerificationConfig {
  selfReferralThreshold?: number;
  batchSignupThreshold?: number;
  suspiciousTimingThreshold?: number;
  confidenceThresholds?: {
    approve: number;
    review: number;
    reject: number;
  };
  signalWeights?: Record<string, number>;
}

export class ReferralVerificationService {
  private config: ReferralVerificationConfig;
  private redis = getRedisClient();
  
  // Default configuration
  private defaultConfig: ReferralVerificationConfig = {
    selfReferralThreshold: 0.8, // High confidence for self-referral
    batchSignupThreshold: 5, // Number of signups in short period to trigger signal
    suspiciousTimingThreshold: 10, // Seconds between visit and conversion
    confidenceThresholds: {
      approve: 0.8, // Above this is automatically approved
      review: 0.4, // Between review and approve needs manual review
      reject: 0.2 // Below this is automatically rejected
    },
    signalWeights: {
      'self_referral': 0.7,
      'batch_signup': 0.5,
      'timing_pattern': 0.4,
      'quality_signals': 0.3,
      'ip_match': 0.6,
      'device_match': 0.5,
      'network_cluster': 0.6
    }
  };
  
  constructor(
    private db: Pool,
    private referralTrackingRepository: ReferralTrackingRepository,
    private userRepository: UserRepository,
    config?: Partial<ReferralVerificationConfig>
  ) {
    this.config = { ...this.defaultConfig, ...config };
  }
  
  /**
   * Verify a referral for legitimacy
   */
  async verifyReferral(referralId: string): Promise<VerificationResult> {
    try {
      // Get referral details
      const tracking = await this.referralTrackingRepository.findById(referralId);
      if (!tracking) {
        throw new Error(`Referral not found: ${referralId}`);
      }
      
      if (!tracking.converted_user_id) {
        throw new Error(`Referral not converted: ${referralId}`);
      }
      
      // Initialize signals array
      const signals: VerificationSignal[] = [];
      
      // Apply verification rules
      
      // 1. Check for self-referral (same IP/device)
      const selfReferralSignal = await this.checkSelfReferral(tracking);
      if (selfReferralSignal) signals.push(selfReferralSignal);
      
      // 2. Check for batch signups
      const batchSignupSignal = await this.checkBatchSignups(
        tracking.referrer_id, 
        tracking.converted_user_id
      );
      if (batchSignupSignal) signals.push(batchSignupSignal);
      
      // 3. Check for suspicious timing patterns
      const timingSignal = await this.checkTimingPatterns(tracking);
      if (timingSignal) signals.push(timingSignal);
      
      // 4. Check for quality signals (e.g., email verification, profile completion)
      const qualitySignal = await this.checkQualitySignals(tracking.converted_user_id);
      if (qualitySignal) signals.push(qualitySignal);
      
      // Calculate confidence score based on signals
      const confidenceScore = this.calculateConfidenceScore(signals);
      
      // Make verification decision
      const decision = this.makeDecision(confidenceScore, signals);
      
      // If decision is 'review', flag the referral for review
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
    } catch (error) {
      logger.error('Error verifying referral', { error, referralId });
      throw error;
    }
  }
  
  /**
   * Check for self-referral signals
   */
  private async checkSelfReferral(
    tracking: any
  ): Promise<VerificationSignal | null> {
    // Check if referrer and referee have the same IP hash
    const ipQuery = `
      SELECT COUNT(*) as count
      FROM referral_tracking
      WHERE referrer_id = $1 
      AND ip_hash = $2
      AND id != $3
    `;
    
    const ipResult = await this.db.query<{ count: string }>(
      ipQuery, 
      [tracking.converted_user_id, tracking.ip_hash, tracking.id]
    );
    
    const ipCount = parseInt(ipResult.rows[0]?.count || '0', 10);
    
    // Check if referrer and referee have the same user agent
    const uaQuery = `
      SELECT COUNT(*) as count
      FROM referral_tracking
      WHERE referrer_id = $1 
      AND user_agent = $2
      AND id != $3
    `;
    
    const uaResult = await this.db.query<{ count: string }>(
      uaQuery, 
      [tracking.converted_user_id, tracking.user_agent, tracking.id]
    );
    
    const uaCount = parseInt(uaResult.rows[0]?.count || '0', 10);
    
    // If both IP and UA match, high confidence of self-referral
    if (ipCount > 0 && uaCount > 0) {
      return {
        type: 'self_referral',
        severity: 'high',
        reason: 'Referee has same IP and user agent as referrer',
        score: this.config.selfReferralThreshold!,
        metadata: { ipCount, uaCount }
      };
    }
    
    // If only one matches, medium confidence
    if (ipCount > 0 || uaCount > 0) {
      return {
        type: 'possible_self_referral',
        severity: 'medium',
        reason: `Referee has same ${ipCount > 0 ? 'IP' : 'browser'} as referrer`,
        score: this.config.selfReferralThreshold! * 0.7,
        metadata: { ipCount, uaCount }
      };
    }
    
    return null;
  }
  
  /**
   * Check for batch signup patterns
   */
  private async checkBatchSignups(
    referrerId: string,
    refereeId: string
  ): Promise<VerificationSignal | null> {
    // Count recent conversions from this referrer
    const query = `
      SELECT COUNT(*) as count
      FROM referral_tracking
      WHERE referrer_id = $1
      AND converted_user_id IS NOT NULL
      AND conversion_date > NOW() - INTERVAL '1 hour'
    `;
    
    const result = await this.db.query<{ count: string }>(query, [referrerId]);
    const recentConversions = parseInt(result.rows[0]?.count || '0', 10);
    
    if (recentConversions >= this.config.batchSignupThreshold!) {
      return {
        type: 'batch_signup',
        severity: recentConversions >= this.config.batchSignupThreshold! * 2 ? 'high' : 'medium',
        reason: `${recentConversions} conversions in the last hour from same referrer`,
        score: Math.min(0.3 + (recentConversions / 20) * 0.7, 0.9),
        metadata: { recentConversions }
      };
    }
    
    return null;
  }
  
  /**
   * Check for suspicious timing patterns
   */
  private async checkTimingPatterns(tracking: any): Promise<VerificationSignal | null> {
    if (!tracking.conversion_date) {
      return null;
    }
    
    // Calculate seconds between tracking creation and conversion
    const createdAt = new Date(tracking.created_at).getTime();
    const conversionDate = new Date(tracking.conversion_date).getTime();
    const secondsBetween = Math.abs(conversionDate - createdAt) / 1000;
    
    // Suspiciously fast conversion (less than threshold seconds)
    if (secondsBetween < this.config.suspiciousTimingThreshold!) {
      return {
        type: 'timing_pattern',
        severity: 'medium',
        reason: `Conversion happened too quickly (${secondsBetween.toFixed(1)}s)`,
        score: 0.6,
        metadata: { secondsBetween }
      };
    }
    
    // Very large delay might also be suspicious (re-using old links)
    const daysBetween = secondsBetween / 86400;
    if (daysBetween > 30) {
      return {
        type: 'delayed_conversion',
        severity: 'low',
        reason: `Conversion happened after ${daysBetween.toFixed(1)} days`,
        score: 0.3,
        metadata: { daysBetween }
      };
    }
    
    return null;
  }
  
  /**
   * Check for quality signals that indicate legitimacy
   */
  private async checkQualitySignals(userId: string): Promise<VerificationSignal | null> {
    // Look for signals that indicate a real user
    
    // 1. Has the user completed their profile?
    const profileQuery = `
      SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE user_id = $1 AND bio IS NOT NULL AND bio != ''
      ) as has_profile
    `;
    
    // 2. Has the user connected a wallet?
    const walletQuery = `
      SELECT EXISTS(
        SELECT 1 FROM wallet_connections 
        WHERE user_id = $1 AND is_verified = true
      ) as has_wallet
    `;
    
    // 3. Has the user created content?
    const contentQuery = `
      SELECT EXISTS(
        SELECT 1 FROM content
        WHERE user_id = $1
      ) as has_content
    `;
    
    const [profileResult, walletResult, contentResult] = await Promise.all([
      this.db.query<{ has_profile: boolean }>(profileQuery, [userId]),
      this.db.query<{ has_wallet: boolean }>(walletQuery, [userId]),
      this.db.query<{ has_content: boolean }>(contentQuery, [userId])
    ]);
    
    const hasProfile = profileResult.rows[0]?.has_profile || false;
    const hasWallet = walletResult.rows[0]?.has_wallet || false;
    const hasContent = contentResult.rows[0]?.has_content || false;
    
    // Count positive signals
    const positiveSignals = [hasProfile, hasWallet, hasContent].filter(Boolean).length;
    
    // If multiple positive signals, reduce suspicion
    if (positiveSignals >= 2) {
      return {
        type: 'quality_signals',
        severity: 'low',
        reason: 'User shows legitimate engagement patterns',
        score: -0.3, // Negative score to reduce suspicion
        metadata: { hasProfile, hasWallet, hasContent, positiveSignals }
      };
    }
    
    return null;
  }
  
  /**
   * Calculate confidence score based on signals
   */
  private calculateConfidenceScore(signals: VerificationSignal[]): number {
    if (signals.length === 0) {
      return 0; // No suspicious signals
    }
    
    // Calculate weighted score
    const totalWeight = signals.reduce((sum, signal) => {
      const weight = this.config.signalWeights![signal.type] || 0.5;
      return sum + (signal.score * weight);
    }, 0);
    
    // Normalize to 0-1 range, considering negative scores from quality signals
    return Math.max(0, Math.min(1, totalWeight / 2));
  }
  
  /**
   * Make verification decision based on confidence score and signals
   */
  private makeDecision(
    confidenceScore: number, 
    signals: VerificationSignal[]
  ): 'approve' | 'reject' | 'review' {
    const thresholds = this.config.confidenceThresholds!;
    
    // High confidence of fraud, auto-reject
    if (confidenceScore >= thresholds.approve) {
      return 'reject';
    }
    
    // Medium confidence, needs review
    if (confidenceScore >= thresholds.review) {
      return 'review';
    }
    
    // Low confidence, auto-approve unless high severity signals present
    const hasHighSeverity = signals.some(signal => 
      signal.severity === 'high' && signal.score > 0.5
    );
    
    return hasHighSeverity ? 'review' : 'approve';
  }
  
  /**
   * Flag a referral for manual review
   */
  private async flagReferralForReview(referralId: string, reason: string): Promise<void> {
    // Store in flagged referrals table or set flag in Redis
    const key = `referral:flagged:${referralId}`;
    await this.redis.set(key, JSON.stringify({
      reason,
      timestamp: new Date().toISOString(),
      reviewed: false
    }));
    
    // Set expiry to ensure flags don't accumulate forever
    await this.redis.expire(key, 30 * 86400); // 30 days
    
    logger.info('Referral flagged for review', { referralId, reason });
  }
  
  /**
   * Get flagged referrals
   */
  async getFlaggedReferrals(): Promise<{
    referralId: string;
    reason: string;
    timestamp: string;
    reviewed: boolean;
  }[]> {
    // Get all flagged referral keys
    const keys = await this.redis.keys('referral:flagged:*');
    
    if (keys.length === 0) {
      return [];
    }
    
    // Get values for all keys
    const values = await Promise.all(
      keys.map(key => this.redis.get(key))
    );
    
    // Parse and map to referral IDs
    return keys.map((key, index) => {
      const referralId = key.replace('referral:flagged:', '');
      const data = JSON.parse(values[index] || '{}');
      
      return {
        referralId,
        reason: data.reason || 'Unknown',
        timestamp: data.timestamp || new Date().toISOString(),
        reviewed: data.reviewed || false
      };
    });
  }
  
  /**
   * Review a flagged referral
   */
  async reviewFlaggedReferral(
    referralId: string, 
    decision: ReviewDecision
  ): Promise<boolean> {
    const key = `referral:flagged:${referralId}`;
    const flagData = await this.redis.get(key);
    
    if (!flagData) {
      throw new Error(`Referral not flagged: ${referralId}`);
    }
    
    const data = JSON.parse(flagData);
    
    // Update flag data with review information
    const updatedData = {
      ...data,
      reviewed: true,
      reviewedAt: new Date().toISOString(),
      reviewedBy: decision.reviewerId,
      decision: decision.action,
      reviewReason: decision.reason
    };
    
    // Store updated flag data
    await this.redis.set(key, JSON.stringify(updatedData));
    
    // If rejected, need to invalidate any rewards
    if (decision.action === 'reject') {
      // Implementation would depend on reward system
      // This might involve marking the referral as invalid in the database
      // and reversing any points that were awarded
    }
    
    return true;
  }
  
  /**
   * Get risk score for a referrer
   */
  async getReferrerRiskScore(referrerId: string): Promise<number> {
    // Compute risk score based on:
    // 1. Number of flagged referrals
    // 2. Proportion of flagged to total referrals
    // 3. Historical rejection rate
    
    // Get total referrals
    const totalQuery = `
      SELECT COUNT(*) as count
      FROM referral_tracking
      WHERE referrer_id = $1 AND converted_user_id IS NOT NULL
    `;
    
    const totalResult = await this.db.query<{ count: string }>(totalQuery, [referrerId]);
    const totalReferrals = parseInt(totalResult.rows[0]?.count || '0', 10);
    
    if (totalReferrals === 0) {
      return 0; // No referrals, no risk
    }
    
    // Get flagged referrals
    const flaggedKeys = await this.redis.keys(`referral:flagged:*`);
    const flaggedValues = await Promise.all(
      flaggedKeys.map(key => this.redis.get(key))
    );
    
    // Count flagged referrals for this referrer
    let flaggedCount = 0;
    let rejectedCount = 0;
    
    for (let i = 0; i < flaggedKeys.length; i++) {
      const data = JSON.parse(flaggedValues[i] || '{}');
      
      // Skip if no tracking data or different referrer
      const tracking = await this.referralTrackingRepository.findById(
        flaggedKeys[i].replace('referral:flagged:', '')
      );
      
      if (!tracking || tracking.referrer_id !== referrerId) {
        continue;
      }
      
      flaggedCount++;
      
      if (data.reviewed && data.decision === 'reject') {
        rejectedCount++;
      }
    }
    
    // Calculate risk score components
    const flaggedRatio = flaggedCount / totalReferrals;
    const rejectionRatio = flaggedCount > 0 ? rejectedCount / flaggedCount : 0;
    
    // Weighted score (0-1 range)
    const riskScore = (flaggedRatio * 0.4) + (rejectionRatio * 0.6);
    
    return Math.min(1, riskScore);
  }
}
