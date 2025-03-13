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
 * Verify a signature based on wallet provider
 */
export async function verifySignature(
  message: string,
  signature: string,
  address: string,
  walletType: string
): Promise<boolean> {
  // Different wallets might have different verification methods
  switch (walletType) {
    case 'phantom':
    case 'solflare':
      return verifyPhantomSignature(message, signature, address);
    case 'slope':
      return verifySlopeSignature(message, signature, address);
    default:
      return false;
  }
}

/**
 * Verify a Phantom wallet signature
 */
async function verifyPhantomSignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  try {
    // Convert the message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Decode the signature from base64
    const signatureBytes = Buffer.from(signature, 'base64');
    
    // Decode the public key from base58
    const publicKeyBytes = bs58.decode(address);
    
    // Verify the signature
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    console.error('Phantom signature verification error:', error);
    return false;
  }
}

/**
 * Verify a Slope wallet signature
 */
async function verifySlopeSignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  // This would implement Slope's specific verification
  // For now, reuse the Phantom verification as they're similar
  return verifyPhantomSignature(message, signature, address);
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
export function isTokenHolder(balance: number, minimumBalance = 1): boolean {
  return balance >= minimumBalance;
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

/**
 * Generate a wallet connection deep link for mobile
 */
export function getWalletDeepLink(walletType: string, params: Record<string, string>): string {
  const baseUrls: Record<string, string> = {
    phantom: 'https://phantom.app/ul/connect',
    solflare: 'https://solflare.com/ul/connect',
    slope: 'https://slope.finance/ul/connect'
  };
  
  const url = new URL(baseUrls[walletType] || baseUrls.phantom);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  return url.toString();
}

/**
 * Generate QR code data for wallet connection
 */
export function getQRCodeData(sessionId: string, message: string): string {
  // In a real implementation, this would generate specific QR code data
  // that mobile wallets can interpret
  return JSON.stringify({
    sessionId,
    message,
    type: 'wallet_connection',
    redirectUrl: 'https://success-kid.io/wallet/connect'
  });
}

/**
 * Add a new connected wallet to database
 */
export async function storeWalletConnection(userId: string, walletAddress: string, db: any): Promise<boolean> {
  try {
    await db.users.update({
      where: { id: userId },
      data: {
        walletAddress,
        walletVerified: true,
        walletConnectedAt: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Error storing wallet connection:', error);
    return false;
  }
}

/**
 * Get mock transaction data for a wallet
 */
export function getMockTransactions(address: string, count = 10): any[] {
  // Generate deterministic mock transactions for an address
  const hash = createHash('sha256').update(address).digest('hex');
  const transactions = [];
  
  for (let i = 0; i < count; i++) {
    const itemHash = createHash('sha256').update(`${address}-${i}`).digest('hex');
    const isInbound = parseInt(itemHash.slice(0, 1), 16) % 2 === 0;
    const amount = 10 + parseInt(itemHash.slice(0, 4), 16) % 990;
    const daysAgo = i * 3 + parseInt(itemHash.slice(4, 6), 16) % 5;
    
    transactions.push({
      hash: `${itemHash}${hash.slice(0, 24)}`,
      type: isInbound ? 'in' : 'out',
      amount,
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      fromAddress: isInbound ? `sender-${itemHash.slice(0, 8)}` : address,
      toAddress: isInbound ? address : `receiver-${itemHash.slice(0, 8)}`,
      status: 'confirmed'
    });
  }
  
  return transactions;
}
