/**
 * GDPR Consent Management
 * 
 * This module provides functionality for managing user consent for GDPR compliance.
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';
import { ConsentRecord } from './service';

// In-memory storage for consent records (would be a database in production)
const consentRecords: ConsentRecord[] = [];

/**
 * Valid consent purposes
 */
export const CONSENT_PURPOSES = [
  'marketing_email',
  'marketing_sms',
  'analytics',
  'third_party_sharing',
  'personalization',
  'push_notifications'
];

/**
 * Record a consent action
 */
export async function recordConsentAction(
  userId: string,
  purpose: string,
  granted: boolean
): Promise<ConsentRecord> {
  try {
    // Validate purpose
    if (!CONSENT_PURPOSES.includes(purpose)) {
      throw new Error(`Invalid consent purpose: ${purpose}`);
    }
    
    // Create consent record
    const record: ConsentRecord = {
      id: uuidv4(),
      userId,
      purpose,
      granted,
      timestamp: new Date(),
      source: 'user_action'
    };
    
    // Store record
    consentRecords.push(record);
    
    // Audit consent action
    await auditService.logEvent({
      userId,
      action: granted ? 'consent.granted' : 'consent.declined',
      resource: AuditResource.USER,
      resourceId: userId,
      ip: 'system',
      status: 'success',
      metadata: {
        purpose,
        consentId: record.id
      }
    });
    
    logger.info(`User ${userId} ${granted ? 'granted' : 'declined'} consent for ${purpose}`);
    
    return record;
  } catch (error) {
    logger.error('Error recording consent action', { error, userId, purpose });
    throw error;
  }
}

/**
 * Withdraw consent
 */
export async function withdrawConsentAction(
  userId: string,
  purpose: string
): Promise<void> {
  try {
    // Validate purpose
    if (!CONSENT_PURPOSES.includes(purpose)) {
      throw new Error(`Invalid consent purpose: ${purpose}`);
    }
    
    // Create withdrawal record
    const record: ConsentRecord = {
      id: uuidv4(),
      userId,
      purpose,
      granted: false,
      timestamp: new Date(),
      source: 'user_withdrawal'
    };
    
    // Store record
    consentRecords.push(record);
    
    // Audit withdrawal action
    await auditService.logEvent({
      userId,
      action: 'consent.withdrawn',
      resource: AuditResource.USER,
      resourceId: userId,
      ip: 'system',
      status: 'success',
      metadata: {
        purpose,
        consentId: record.id
      }
    });
    
    logger.info(`User ${userId} withdrew consent for ${purpose}`);
  } catch (error) {
    logger.error('Error withdrawing consent', { error, userId, purpose });
    throw error;
  }
}

/**
 * Check if user has granted consent
 */
export async function hasConsent(
  userId: string,
  purpose: string
): Promise<boolean> {
  try {
    // Find the most recent consent record for this user and purpose
    const records = consentRecords
      .filter(r => r.userId === userId && r.purpose === purpose)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (records.length === 0) {
      return false;
    }
    
    // Return the granted status of the most recent record
    return records[0].granted;
  } catch (error) {
    logger.error('Error checking consent', { error, userId, purpose });
    return false; // Default to no consent on error
  }
}

/**
 * Get all consent records for a user
 */
export async function getUserConsentRecords(
  userId: string
): Promise<ConsentRecord[]> {
  try {
    // Return all consent records for this user
    return consentRecords
      .filter(r => r.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    logger.error('Error getting consent records', { error, userId });
    return [];
  }
}

/**
 * Get current consent status for all purposes
 */
export async function getUserConsentStatus(
  userId: string
): Promise<Record<string, boolean>> {
  try {
    const status: Record<string, boolean> = {};
    
    // Check each purpose
    for (const purpose of CONSENT_PURPOSES) {
      status[purpose] = await hasConsent(userId, purpose);
    }
    
    return status;
  } catch (error) {
    logger.error('Error getting consent status', { error, userId });
    return {};
  }
}
