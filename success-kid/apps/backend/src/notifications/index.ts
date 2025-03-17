/**
 * Notifications Module
 * 
 * Central exports for the notifications module.
 */

export * from './models';
export * from './repository';
export * from './service';
export * from './preferences/service';

// Export singleton instances
export { notificationService } from './service';
export { preferencesService } from './preferences/service';
export { templateService } from './templates/service';
