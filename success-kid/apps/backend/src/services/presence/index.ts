/**
 * Presence Service
 * 
 * Manages user presence and activity status across the platform
 */
import { PresenceService } from './presence-service';
import { getDbClient } from '../../lib/db-client';
import { redis } from '../../lib/redis';
import { logger } from '../../lib/logger';

// Store singleton instance
let presenceService: PresenceService | null = null;

/**
 * Get presence service instance
 * @returns Presence service
 */
export function getPresenceService(): PresenceService {
  if (!presenceService) {
    const db = getDbClient();
    presenceService = new PresenceService(db, redis);
    logger.info('Presence service initialized');
  }
  
  return presenceService;
}

export { PresenceService } from './presence-service';
export { PresenceStatus } from '../../models/presence';
