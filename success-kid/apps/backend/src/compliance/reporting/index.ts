/**
 * Compliance Reporting Module
 * 
 * Provides compliance reporting functionality
 */
import { reportingService } from './service';
import { reportingRoutes } from './routes';
import { ComplianceFramework, ComplianceReport } from './types';

// Export services and routes
export { 
  reportingService,
  reportingRoutes
};

// Export types
export type {
  ComplianceFramework,
  ComplianceReport
};
