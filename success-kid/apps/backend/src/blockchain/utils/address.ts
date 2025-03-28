/**
 * Blockchain Address Utilities
 * 
 * Utility functions for wallet address operations.
 */
import { getBlockchainProviderFactory } from '../providers/factory';
import { logger } from '../../lib/logger';

/**
 * Validate a wallet address format
 * 
 * @param address Wallet address to validate
 * @returns True if address format is valid
 */
export function isValidAddress(address: string): boolean {
  try {
    // Try to determine the provider from the address
    const providerFactory = getBlockchainProviderFactory();
    const provider = providerFactory.getProviderForAddress(address);
    
    // Use the provider's validation function
    return provider.isAddressValid(address);
  } catch (error) {
    logger.error('Error validating address', { address, error });
    return false;
  }
}

/**
 * Format address for display by truncating
 * 
 * @param address Full wallet address
 * @param startChars Characters to show at start (default: 6)
 * @param endChars Characters to show at end (default: 4)
 * @returns Formatted address string with ellipsis in middle
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return '';
  
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
