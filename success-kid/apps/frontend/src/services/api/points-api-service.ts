/**
 * Points API Service
 * Handles all points-related API requests
 */
import { ApiEndpoints, ApiRequests, ApiResponses } from '@success-kid/types';
import { BaseApiService } from './base-api-service';

/**
 * Points API service for points-related operations
 */
export class PointsApiService extends BaseApiService {
  /**
   * Get points balance and history for current user
   * @returns Points balance information
   */
  async getPointsBalance(): Promise<ApiResponses.PointsBalance> {
    return this.get<ApiResponses.PointsBalance>(ApiEndpoints.POINTS_HISTORY);
  }
  
  /**
   * Get detailed points transaction history
   * @param page Page number for pagination
   * @param pageSize Number of items per page
   * @returns Points transaction history
   */
  async getPointsHistory(page = 1, pageSize = 20): Promise<ApiResponses.PointsHistory> {
    return this.get<ApiResponses.PointsHistory>(
      ApiEndpoints.POINTS_HISTORY,
      { page, pageSize }
    );
  }
  
  /**
   * Award points to a user
   * @param data Points award data
   * @returns Status and updated points information
   */
  async awardPoints(data: ApiRequests.AwardPoints): Promise<{ 
    success: boolean;
    amount: number;
    total: number;
  }> {
    return this.post(ApiEndpoints.POINTS_AWARD, data);
  }
  
  /**
   * Redeem points for tokens
   * @param data Points redemption data
   * @returns Status and transaction information
   */
  async redeemPoints(data: ApiRequests.RedeemPoints): Promise<{
    success: boolean;
    transactionId: string;
    pointsRedeemed: number;
    tokensAwarded: number;
    estimatedProcessingTime: string;
  }> {
    return this.post(ApiEndpoints.POINTS_REDEEM, data);
  }
}

// Export singleton instance
export const pointsApiService = new PointsApiService();
