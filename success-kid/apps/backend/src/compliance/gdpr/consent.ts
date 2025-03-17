/**
 * Consent Management Service
 * 
 * Manages user consent records for GDPR compliance
 */
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';
import { db } from '../../lib/db';
import { ConsentRecord, ProcessingPurpose, LegalBasis } from './types';
import { auditService } from '../../auth/audit/service';

/**
 * Processing purposes
 */
const PROCESSING_PURPOSES: ProcessingPurpose[] = [
  {
    id: 'essential',
    name: 'Essential Service',
    description: 'Processing necessary for providing the core service',
    legalBasis: LegalBasis.CONTRACT,
    requiresConsent: false,
    version: '1.0',
    activeFrom: new Date('2023-01-01')
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Processing for analytics and service improvement',
    legalBasis: LegalBasis.LEGITIMATE_INTERESTS,
    requiresConsent: true,
    version: '1.0',
    activeFrom: new Date('2023-01-01')
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Processing for marketing and promotional purposes',
    legalBasis: LegalBasis.CONSENT,
    requiresConsent: true,
    version: '1.0',
    activeFrom: new Date('2023-01-01')
  },
  {
    id: 'third_party',
    name: 'Third-Party Sharing',
    description: 'Sharing data with third parties',
    legalBasis: LegalBasis.CONSENT,
    requiresConsent: true,
    version: '1.0',
    activeFrom: new Date('2023-01-01')
  }
];

/**
 * Consent Management Service Class
 */
export class ConsentService {
  private purposes: ProcessingPurpose[] = PROCESSING_PURPOSES;
  
  /**
   * Record user consent
   * 
   * @param userId User ID
   * @param purpose Purpose ID
   * @param granted Whether consent is granted
   * @param source Source of consent (e.g., 'signup', 'preferences')
   * @returns Created consent record
   */
  async recordConsent(
    userId: string,
    purpose: string,
    granted: boolean,
    source: string = 'preferences'
  ): Promise<ConsentRecord> {
    try {
      // Check if purpose exists
      const purposeObj = this.getPurpose(purpose);
      if (!purposeObj) {
        throw new Error(`Unknown purpose: ${purpose}`);
      }
      
      // Generate ID
      const id = randomUUID();
      const now = new Date();
      
      // Create consent record in database
      const result = await db.query(
        `INSERT INTO consent_records (
          id, user_id, purpose, granted, timestamp, source, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          id,
          userId,
          purpose,
          granted,
          now,
          source,
          purposeObj.version
        ]
      );
      
      // Log the consent action in audit log
      await auditService.logEvent({
        type: granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
        userId,
        metadata: {
          purpose,
          source,
          version: purposeObj.version
        },
        severity: 'INFO'
      });
      
      logger.info('Consent record created', {
        userId,
        purpose,
        granted,
        source
      });
      
      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        purpose: result.rows[0].purpose,
        granted: result.rows[0].granted,
        timestamp: result.rows[0].timestamp,
        source: result.rows[0].source,
        version: result.rows[0].version
      };
    } catch (error) {
      logger.error('Error recording consent', { error, userId, purpose, granted });
      throw new Error('Failed to record consent');
    }
  }
  
  /**
   * Check if consent is granted for a purpose
   * 
   * @param userId User ID
   * @param purpose Purpose ID
   * @returns Whether consent is granted
   */
  async checkConsent(userId: string, purpose: string): Promise<boolean> {
    try {
      // Check if purpose exists and whether it requires consent
      const purposeObj = this.getPurpose(purpose);
      if (!purposeObj) {
        throw new Error(`Unknown purpose: ${purpose}`);
      }
      
      // If purpose doesn't require consent, return true
      if (!purposeObj.requiresConsent) {
        return true;
      }
      
      // Get most recent consent record
      const result = await db.query(
        `SELECT * FROM consent_records 
         WHERE user_id = $1 AND purpose = $2 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [userId, purpose]
      );
      
      // If no record exists, consent is not granted
      if (result.rowCount === 0) {
        return false;
      }
      
      // Return granted status from record
      return result.rows[0].granted;
    } catch (error) {
      logger.error('Error checking consent', { error, userId, purpose });
      // Default to false if error occurs
      return false;
    }
  }
  
  /**
   * Withdraw consent for a purpose
   * 
   * @param userId User ID
   * @param purpose Purpose ID
   * @returns Success status
   */
  async withdrawConsent(userId: string, purpose: string): Promise<boolean> {
    try {
      // Record consent as false
      await this.recordConsent(userId, purpose, false, 'withdrawal');
      return true;
    } catch (error) {
      logger.error('Error withdrawing consent', { error, userId, purpose });
      return false;
    }
  }
  
  /**
   * Get consent records for a user
   * 
   * @param userId User ID
   * @returns Consent records grouped by purpose
   */
  async getUserConsents(userId: string): Promise<Record<string, ConsentRecord>> {
    try {
      // Get latest consent record for each purpose
      const result = await db.query(
        `SELECT DISTINCT ON (purpose) *
         FROM consent_records
         WHERE user_id = $1
         ORDER BY purpose, timestamp DESC`,
        [userId]
      );
      
      // Convert rows to record object
      const consents: Record<string, ConsentRecord> = {};
      
      for (const row of result.rows) {
        consents[row.purpose] = {
          id: row.id,
          userId: row.user_id,
          purpose: row.purpose,
          granted: row.granted,
          timestamp: row.timestamp,
          source: row.source,
          version: row.version
        };
      }
      
      return consents;
    } catch (error) {
      logger.error('Error getting user consents', { error, userId });
      return {};
    }
  }
  
  /**
   * Get all processing purposes
   * 
   * @returns Array of processing purposes
   */
  getPurposes(): ProcessingPurpose[] {
    return this.purposes;
  }
  
  /**
   * Get purpose by ID
   * 
   * @param purposeId Purpose ID
   * @returns Processing purpose or undefined if not found
   */
  getPurpose(purposeId: string): ProcessingPurpose | undefined {
    return this.purposes.find(purpose => purpose.id === purposeId);
  }
  
  /**
   * Get consent history for a user and purpose
   * 
   * @param userId User ID
   * @param purpose Purpose ID
   * @returns Array of consent records
   */
  async getConsentHistory(userId: string, purpose: string): Promise<ConsentRecord[]> {
    try {
      const result = await db.query(
        `SELECT * FROM consent_records 
         WHERE user_id = $1 AND purpose = $2 
         ORDER BY timestamp DESC`,
        [userId, purpose]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        purpose: row.purpose,
        granted: row.granted,
        timestamp: row.timestamp,
        source: row.source,
        version: row.version
      }));
    } catch (error) {
      logger.error('Error getting consent history', { error, userId, purpose });
      return [];
    }
  }
}

// Export singleton instance
export const consentService = new ConsentService();
