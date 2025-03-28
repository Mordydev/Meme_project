/**
 * Blockchain Module
 * 
 * This module provides blockchain integration utilities, including provider
 * management, transaction handling, and address verification.
 */

// Re-export types
export * from './types';

// Re-export provider interfaces
export * from './providers/base';
export * from './providers/factory';
export { SolanaProvider } from './providers/solana';

// Re-export utility functions
export * from './utils/address';

// Export singleton access
import { getBlockchainProviderFactory, BlockchainProviderFactory } from './providers/factory';

/**
 * Get blockchain service
 * 
 * @returns Blockchain provider factory
 */
export function getBlockchainService(): BlockchainProviderFactory {
  return getBlockchainProviderFactory();
}

export default {
  getProviderFactory: getBlockchainProviderFactory,
  getService: getBlockchainService,
};
