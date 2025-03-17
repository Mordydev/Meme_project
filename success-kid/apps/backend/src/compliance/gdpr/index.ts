/**
 * GDPR Compliance Module
 * 
 * Handles GDPR compliance features including data subject requests,
 * consent management, and data portability
 */
import { gdprService } from './service';
import { consentService } from './consent';
import { exportService } from './export';
import { gdprRoutes } from './routes';

// Export services and routes
export { 
  gdprService,
  consentService,
  exportService,
  gdprRoutes
};

// Export types
export * from './types';
