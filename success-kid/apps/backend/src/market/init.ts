/**
 * Market Service Initialization
 * 
 * This module initializes all market-related services.
 */
import { logger } from '../lib/logger';
import { priceService } from './price/service';
import { marketCapService } from './marketcap/service';
import { transactionFeedService } from './transactions/service';
import { milestoneService } from './milestones/service';

/**
 * Initialize market services
 */
export async function initializeMarketServices(): Promise<void> {
  try {
    logger.info('Initializing market services...');
    
    // Start automatic price updates for SKC token
    priceService.startPriceUpdates('SKC');
    
    // Start milestone checking for SKC token
    milestoneService.startMilestoneChecking('SKC');
    
    // Start transaction feed updates for SKC token
    transactionFeedService.startTransactionUpdates('SKC');
    
    logger.info('Market services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize market services', { error });
    throw error;
  }
}
