/**
 * Wallet Verification
 * 
 * Verify wallet ownership through message signing
 */
import { utils } from 'ethers';
import { decodeBase58 } from 'bs58';
import { PublicKey } from '@solana/web3.js';
import { nacl } from 'tweetnacl';
import { logger } from '../../lib/logger';
import { env } from '../../config/environment';

/**
 * Message to sign for verification
 * Should include a standard prefix and domain to prevent phishing
 */
export function getSignatureMessage(walletAddress: string): string {
  const domain = env.APP_DOMAIN || 'success-kid.com';
  
  return `Sign this message to verify you own this wallet address: ${walletAddress}\n\nThis signature will not trigger a blockchain transaction or cost any gas fees.\n\nDomain: ${domain}\nTimestamp: ${Date.now()}`;
}

/**
 * Verify EVM wallet signature (Ethereum, etc.)
 */
export function verifyEvmSignature(
  address: string,
  message: string,
  signature: string
): boolean {
  try {
    // Recover the address from the signature
    const signerAddress = utils.verifyMessage(message, signature);
    
    // Check if recovered address matches claimed address
    return signerAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    logger.error('EVM signature verification error', { error, address });
    return false;
  }
}

/**
 * Verify Solana wallet signature
 */
export function verifySolanaSignature(
  address: string,
  message: string,
  signature: string
): boolean {
  try {
    // Convert address to public key
    const publicKey = new PublicKey(address);
    
    // Decode signature from base58
    const signatureBytes = decodeBase58(signature);
    
    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Verify signature
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch (error) {
    logger.error('Solana signature verification error', { error, address });
    return false;
  }
}

/**
 * Verify wallet signature based on chain type
 */
export function verifyWalletSignature(
  address: string,
  message: string,
  signature: string,
  chainType: 'evm' | 'solana' = 'solana'
): boolean {
  switch (chainType) {
    case 'evm':
      return verifyEvmSignature(address, message, signature);
    case 'solana':
      return verifySolanaSignature(address, message, signature);
    default:
      logger.error('Unsupported chain type for signature verification', { chainType });
      return false;
  }
}
