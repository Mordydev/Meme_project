import { createHash } from 'crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Create a standard message for wallet verification
 */
export function createVerificationMessage(sessionId: string, timestamp: number): string {
  return `Sign this message to connect to Success Kid Platform.\n\nThis request will not trigger a blockchain transaction or cost any fees.\n\nSession ID: ${sessionId}\nTimestamp: ${timestamp}`;
}

/**
 * Verify a wallet signature
 */
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    // Convert the message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Create a message hash for verification
    const messageHash = createHash('sha256').update(messageBytes).digest();
    
    // Decode the signature from base58
    const signatureBytes = bs58.decode(signature);
    
    // Decode the public key from base58
    const publicKeyBytes = bs58.decode(address);
    
    // Verify the signature
    return nacl.sign.detached.verify(
      messageHash,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    console.error('Wallet signature verification error:', error);
    return false;
  }
}

/**
 * Format wallet address for display and storage
 */
export function normalizeWalletAddress(address: string): string {
  // In a real implementation, this would validate and normalize
  // the wallet address format
  return address.trim();
}

/**
 * Check if a wallet is a token holder
 */
export async function isTokenHolder(address: string): Promise<boolean> {
  try {
    // In a real implementation, this would query the blockchain
    // or database to check if the wallet holds tokens above the threshold
    
    // For development, simulate a check
    const lastChar = address.slice(-1);
    const numericValue = parseInt(lastChar, 16);
    
    // Simulate 70% of wallets being holders for testing
    return numericValue < 11; // 0-10 out of 0-15 (for hex)
  } catch (error) {
    console.error('Error checking token holder status:', error);
    return false;
  }
}

/**
 * Get wallet balance from blockchain
 */
export async function getWalletBalance(address: string): Promise<number> {
  try {
    // In a real implementation, this would query the blockchain
    // or token contract to get the actual balance
    
    // For development, generate a consistent pseudo-random balance
    // based on the address to ensure same address always gets same balance
    const hash = createHash('sha256').update(address).digest('hex');
    const decimalPart = parseInt(hash.slice(0, 4), 16) / 0xffff; // 0-1 range
    
    // Generate a balance between 10 and 5000
    return Math.floor(10 + decimalPart * 4990);
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return 0;
  }
}

/**
 * Calculate USD value of token balance
 */
export function calculateUsdValue(tokenBalance: number, price = 0.1): number {
  return tokenBalance * price;
}
