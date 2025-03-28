/**
 * Error Scenarios
 * 
 * Collection of error scenario definitions for testing error handling.
 */
import { ErrorType } from '../index';

/**
 * Validation result interface
 */
export interface ValidationResult {
  passed: boolean;
  message?: string;
}

/**
 * Error scenario interface
 */
export interface ErrorScenario {
  name: string;
  description: string;
  targetService: string;
  errorType: ErrorType;
  setup(): Promise<void>;
  inject(): Promise<void>;
  validate(response: any): Promise<ValidationResult>;
  cleanup(): Promise<void>;
}

// Export specific error scenarios
export * from './validation';
export * from './resource';
export * from './network';

// Default export for convenient imports
export default {
  validation: require('./validation'),
  resource: require('./resource'),
  network: require('./network'),
};
