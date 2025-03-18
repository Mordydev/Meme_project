'use client';

/**
 * Monitoring module index
 * 
 * Centralizes access to monitoring utilities.
 */
export * from './error-tracking';
export * from './monitor';

export { default as errorTrackingService } from './error-tracking';
export { default as monitoringService } from './monitor';