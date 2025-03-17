/**
 * PII (Personally Identifiable Information) Module
 * 
 * Provides detection, handling, and protection for PII data
 */
import { piiService } from './service';
import { scanForPii } from './scanner';
import { PiiHandlingPolicy, PiiField, PiiScanResult, PiiDetection } from './types';

// Export types and functions
export {
  piiService,
  scanForPii
};

export type {
  PiiHandlingPolicy,
  PiiField,
  PiiScanResult,
  PiiDetection
};
