/**
 * API Services Export
 * Central export for all API services
 */
export * from './base-api-service';
export * from './points-api-service';
export * from './wallet-api-service';

// Export API services
import { pointsApiService } from './points-api-service';
import { walletApiService } from './wallet-api-service';

// Create a unified API service object for convenience
export const api = {
  points: pointsApiService,
  wallet: walletApiService,
  // Add more services here as they are created
};
