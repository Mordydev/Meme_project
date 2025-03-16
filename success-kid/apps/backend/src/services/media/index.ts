/**
 * Media Services Index
 * 
 * Exports all media-related services.
 */

// Storage services
export * from './storage';

// Upload services
export * from './upload/service';

// Processing services
export * from './processing/service';

// Metadata services
export * from './metadata/service';

// Access services
export * from './access/service';

// Cache services
export * from './cache/service';

// Transform services
export * from './transform/service';

// Maintenance services
export * from './maintenance/service';

/**
 * Media service module
 */
import { storage } from './storage';
import { uploadService } from './upload/service';
import { processingService } from './processing/service';
import { metadataService } from './metadata/service';
import { accessService } from './access/service';
import { mediaCacheService } from './cache/service';
import { transformService } from './transform/service';
import { maintenanceService } from './maintenance/service';
import { logger } from '../../lib/logger';

/**
 * Initialize all media services
 */
export function initializeMediaServices(): boolean {
  try {
    logger.info('Initializing media services');
    
    // Additional initialization logic could go here
    
    logger.info('Media services initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize media services', { error });
    return false;
  }
}

/**
 * Media service object for convenient access to all services
 */
export const mediaService = {
  storage,
  upload: uploadService,
  processing: processingService,
  metadata: metadataService,
  access: accessService,
  cache: mediaCacheService,
  transform: transformService,
  maintenance: maintenanceService,
  
  initialize: initializeMediaServices
};
