/**
 * Logger export file
 * 
 * This file provides a simple export of the logger for backward compatibility.
 * New code should use the more comprehensive logging system in lib/logging.
 */
import { logger as structuredLogger } from './logging/logger';

export { logger as default } from './logging/logger';
export const logger = structuredLogger;