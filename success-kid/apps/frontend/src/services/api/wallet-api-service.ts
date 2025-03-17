/**
 * Wallet API Service
 * Handles all wallet-related API requests
 */
import { ApiEndpoints, ApiRequests, ApiResponses } from '@success-kid/types';
import { BaseApiService } from './base-api-service';

/**
 * Wallet API service for wallet-related operations
 */
export class WalletApiService extends BaseApiService {
  /**
   * Connect a wallet to the user's account
   * @param data Wallet connection data with signature
   * @returns Wallet connection information
   */
  async connectWallet(data: ApiRequests.ConnectWallet): Promise<ApiResponses.WalletConnection> {
    return this.post<ApiResponses.WalletConnection>(ApiEndpoints.WALLET_CONNECT, data);
  }
  
  /**
   * Verify wallet ownership
   * @param data Verification data with signature
   * @returns Verification status
   */
  async verifyWallet(data: ApiRequests.ConnectWallet): Promise<{
    verified: boolean;
    address: string;
  }> {
    return this.post(ApiEndpoints.WALLET_VERIFY, data);
  }
  
  /**
   * Get wallet connection status and details
   * @returns Wallet connection information if connected
   */
  async getWalletStatus(): Promise<ApiResponses.WalletConnection | null> {
    try {
      return await this.get<ApiResponses.WalletConnection>(`${ApiEndpoints.WALLET_CONNECT}/status`);
    } catch (error) {
      // If no wallet is connected, return null instead of throwing
      if (error && 'status' in error && error.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

// Export singleton instance
export const walletApiService = new WalletApiService();
