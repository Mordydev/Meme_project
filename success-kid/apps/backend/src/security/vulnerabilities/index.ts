/**
 * Vulnerabilities Prevention Module
 * 
 * Provides detection and prevention of common security vulnerabilities
 */
import { vulnerabilityService } from './service';
import { scanRequest } from './scanner';
import { securityPatterns } from './patterns';

// Export functions and service
export {
  vulnerabilityService,
  scanRequest,
  securityPatterns
};
