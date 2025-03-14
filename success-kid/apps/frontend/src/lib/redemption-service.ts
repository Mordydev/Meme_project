import { apiClient } from './api-client';

/**
 * Service for interacting with redemption-related API endpoints
 */
export const redemptionService = {
  /**
   * Check redemption eligibility for the current user
   */
  checkEligibility: async () => {
    try {
      const response = await apiClient.get('/api/v1/redemption/eligibility');
      return response.data;
    } catch (error) {
      console.error('Error checking redemption eligibility:', error);
      throw error;
    }
  },
  
  /**
   * Create a new redemption transaction
   * @param pointsAmount Amount of points to redeem
   * @param recipientAddress Wallet address to receive tokens (optional, defaults to connected wallet)
   */
  createRedemptionTransaction: async (pointsAmount: number, recipientAddress?: string) => {
    try {
      const response = await apiClient.post('/api/v1/redemption/transactions', {
        data: {
          pointsAmount,
          recipientAddress,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating redemption transaction:', error);
      throw error;
    }
  },
  
  /**
   * Get transaction status by ID
   * @param transactionId The transaction ID to check
   */
  getTransactionStatus: async (transactionId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/redemption/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw error;
    }
  },
  
  /**
   * Get redemption history
   * @param options Optional filtering and pagination options
   */
  getRedemptionHistory: async (options?: {
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'all';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await apiClient.get(`/api/v1/redemption/transactions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting redemption history:', error);
      throw error;
    }
  },
  
  /**
   * Mock service implementation for development and testing
   */
  mock: {
    /**
     * Mock eligibility check
     */
    checkEligibility: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        isEligible: true,
        requirements: {
          walletConnected: true,
          minimumBalance: true,
          weeklyCapAvailable: true,
        },
        limits: {
          minimumAmount: 1000,
          maximumAmount: 10000,
          weeklyLimit: 10000,
          weeklyUsed: 2500,
          remainingWeeklyLimit: 7500,
          resetsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        pointsBalance: 4500,
        conversionRate: 100, // 100 SP = 1 SKC
      };
    },
    
    /**
     * Mock transaction creation
     */
    createRedemptionTransaction: async (pointsAmount: number, recipientAddress?: string) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        transactionId: `tx_${Date.now().toString(36)}`,
        pointsAmount,
        tokenAmount: pointsAmount / 100,
        recipientAddress: recipientAddress || '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
        status: 'pending',
        createdAt: new Date().toISOString(),
        estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    },
    
    /**
     * Mock transaction status check
     */
    getTransactionStatus: async (transactionId: string) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, determine transaction status based on creation time
      const creationTimestamp = parseInt(transactionId.split('_')[1], 36);
      const elapsed = Date.now() - creationTimestamp;
      
      let status = 'pending';
      let steps = {
        verification: 'pending',
        tokenTransfer: 'pending',
        confirmation: 'pending',
      };
      
      // Simulate status progression based on elapsed time
      if (elapsed > 5000) {
        status = 'processing';
        steps.verification = 'completed';
        steps.tokenTransfer = 'processing';
      }
      
      if (elapsed > 10000) {
        steps.tokenTransfer = 'completed';
        steps.confirmation = 'processing';
      }
      
      if (elapsed > 15000) {
        status = 'completed';
        steps.confirmation = 'completed';
      }
      
      return {
        transactionId,
        pointsAmount: 2500,
        tokenAmount: 25,
        recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
        status,
        createdAt: new Date(creationTimestamp).toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        transactionHash: status === 'completed' ? '4qL9pWzD6RbJKFGvTfQnAZ5uXr3vNP5BnmKRwxJVdYtP8DgSJs2ZARXLKJe1RYqHnVhymgrD76iucN2N6xFUymAP' : undefined,
        steps,
      };
    },
    
    /**
     * Mock redemption history
     */
    getRedemptionHistory: async (options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockTransactions = [
        {
          transactionId: 'tx_1',
          pointsAmount: 5000,
          tokenAmount: 50,
          recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          status: 'completed',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
          transactionHash: '4qL9pWzD6RbJKFGvTfQnAZ5uXr3vNP5BnmKRwxJVdYtP8DgSJs2ZARXLKJe1RYqHnVhymgrD76iucN2N6xFUymAP',
        },
        {
          transactionId: 'tx_2',
          pointsAmount: 2500,
          tokenAmount: 25,
          recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          status: 'completed',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
          transactionHash: '3xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d',
        },
        {
          transactionId: 'tx_3',
          pointsAmount: 1000,
          tokenAmount: 10,
          recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          status: 'processing',
          createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        {
          transactionId: 'tx_4',
          pointsAmount: 3000,
          tokenAmount: 30,
          recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          status: 'completed',
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
          transactionHash: '2xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d',
        },
        {
          transactionId: 'tx_5',
          pointsAmount: 1500,
          tokenAmount: 15,
          recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          status: 'failed',
          createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      // Filter by status if specified
      const filteredTransactions = options?.status && options.status !== 'all'
        ? mockTransactions.filter(tx => tx.status === options.status)
        : mockTransactions;
      
      // Apply pagination
      const limit = options?.limit || 10;
      const offset = options?.offset || 0;
      const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
      
      return {
        transactions: paginatedTransactions,
        pagination: {
          total: filteredTransactions.length,
          limit,
          offset,
        }
      };
    },
  }
};
