'use client';

import { WalletType } from '@/store/useWalletStore';
import { 
  createVerificationMessage, 
  getWalletErrorMessage,
  categorizeWalletError 
} from '@/lib/wallet-utils';
import { AppError } from '@/lib/api-client';

export interface PhantomProvider {
  isPhantom?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
  isConnected: boolean;
  publicKey: { toString: () => string } | null;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solflare?: any;
    slope?: any;
  }
}

export class PhantomAdapter {
  private provider: PhantomProvider | null = null;
  
  constructor() {
    // Check if Phantom is installed
    if (typeof window !== 'undefined' && window.phantom?.solana) {
      this.provider = window.phantom.solana;
    }
  }
  
  /**
   * Check if the Phantom wallet is available
   */
  isAvailable(): boolean {
    return !!this.provider && !!this.provider.isPhantom;
  }
  
  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!this.provider?.isConnected && !!this.provider?.publicKey;
  }
  
  /**
   * Get connected wallet address
   */
  getAddress(): string | null {
    return this.provider?.publicKey?.toString() || null;
  }
  
  /**
   * Connect to Phantom wallet
   */
  async connect(): Promise<string> {
    if (!this.provider) {
      throw new AppError(
        'Phantom wallet not installed',
        'WALLET_NOT_INSTALLED',
        { walletType: 'phantom' },
        400
      );
    }
    
    try {
      const response = await this.provider.connect();
      return response.publicKey.toString();
    } catch (error) {
      const errorType = categorizeWalletError(error);
      throw new AppError(
        getWalletErrorMessage(errorType),
        `WALLET_${errorType.toUpperCase()}`,
        { walletType: 'phantom', originalError: error },
        400
      );
    }
  }
  
  /**
   * Disconnect from Phantom wallet
   */
  async disconnect(): Promise<void> {
    if (!this.provider) {
      return;
    }
    
    try {
      await this.provider.disconnect();
    } catch (error) {
      console.error('Error disconnecting from Phantom:', error);
      throw error;
    }
  }
  
  /**
   * Sign a message to verify wallet ownership
   */
  async signMessage(walletAddress: string): Promise<string> {
    if (!this.provider || !this.provider.isConnected) {
      throw new AppError(
        'Wallet not connected',
        'WALLET_NOT_CONNECTED',
        { walletType: 'phantom' },
        400
      );
    }
    
    try {
      // Create the message to sign
      const timestamp = Date.now();
      const message = createVerificationMessage(walletAddress, timestamp);
      
      // Convert message to Uint8Array
      const encodedMessage = new TextEncoder().encode(message);
      
      // Request signature
      const { signature } = await this.provider.signMessage(encodedMessage, 'utf8');
      
      // Convert signature to base64 string
      return Buffer.from(signature).toString('base64');
    } catch (error) {
      const errorType = categorizeWalletError(error);
      throw new AppError(
        getWalletErrorMessage(errorType),
        `WALLET_${errorType.toUpperCase()}`,
        { walletType: 'phantom', originalError: error },
        400
      );
    }
  }
}

/**
 * Create a Phantom wallet adapter
 */
export const createPhantomAdapter = (): PhantomAdapter => {
  return new PhantomAdapter();
};
