/**
 * API Client for making HTTP requests
 */

/**
 * Custom error class for API errors
 */
export class AppError extends Error {
  status: number;
  code?: string;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

// In a real implementation, this would be a proper API client like Axios or fetch wrapper
export const apiClient = {
  /**
   * Make a GET request
   */
  get: async <T>(url: string, options?: RequestInit): Promise<{ data: T }> => {
    console.log(`GET request to ${url}`);
    
    // Mock implementation
    // In production, this would make a real HTTP request
    if (url === '/api/v1/market/milestones') {
      // Mock milestone data
      return {
        data: {
          currentMarketCap: 75000,
          milestones: [
            { id: '1', value: 50000, label: '$50K', description: 'Initial milestone', achievedAt: '2023-08-15T00:00:00Z' },
            { id: '2', value: 100000, label: '$100K', description: 'Second milestone', achievedAt: null },
            { id: '3', value: 500000, label: '$500K', description: 'Growth milestone', achievedAt: null },
            { id: '4', value: 1000000, label: '$1M', description: 'Major milestone', achievedAt: null },
            { id: '5', value: 5000000, label: '$5M', description: 'Expansion milestone', achievedAt: null },
          ],
          nextMilestone: {
            id: '2',
            value: 100000,
            label: '$100K',
            description: 'Second milestone',
            achievedAt: null,
            progress: 75
          }
        } as unknown as T
      };
    }
    
    if (url === '/api/v1/market/supply') {
      // Mock token supply data
      return {
        data: {
          totalSupply: 7000000000, // 7 billion total supply
          circulatingSupply: 1500000000, // 1.5 billion in circulation
          burned: 50000000, // 50 million burned
          allocations: [
            {
              id: 'community',
              name: 'Community Rewards',
              amount: 3500000000,
              percentage: 50,
              description: 'Allocated for community rewards and incentives',
              color: '#1E88E5' // Primary blue
            },
            {
              id: 'development',
              name: 'Development Team',
              amount: 1400000000,
              percentage: 20,
              description: 'For core team and development costs',
              color: '#4CAF50' // Success green
            },
            {
              id: 'marketing',
              name: 'Marketing',
              amount: 700000000,
              percentage: 10,
              description: 'Allocated for marketing and promotion',
              color: '#FFC107' // Sand gold
            },
            {
              id: 'liquidity',
              name: 'Liquidity',
              amount: 700000000,
              percentage: 10,
              description: 'Providing market liquidity',
              color: '#9C27B0' // Purple
            },
            {
              id: 'treasury',
              name: 'Treasury',
              amount: 650000000,
              percentage: 9.3,
              description: 'Reserved for future development and governance',
              color: '#FF5722' // Orange
            },
            {
              id: 'burned',
              name: 'Burned',
              amount: 50000000,
              percentage: 0.7,
              description: 'Permanently removed from circulation',
              color: '#F44336' // Action red
            }
          ]
        } as unknown as T
      };
    }
    
    if (url.startsWith('/api/v1/market/price')) {
      // Mock price data
      const mockPriceData = Array.from({ length: 24 }, (_, i) => {
        const timestamp = Date.now() - (23 - i) * 3600 * 1000;
        const price = 0.00015 + (Math.sin(i / 3) * 0.00002);
        return { timestamp, price };
      });
      
      return {
        data: {
          prices: mockPriceData,
          basePrice: 0.00015,
          priceChange: 0.0000021,
          priceChangePercent: 1.4
        } as unknown as T
      };
    }
    
    if (url === '/api/v1/market/stats') {
      // Mock market stats
      return {
        data: {
          stats: {
            marketCap: 1500000,
            volume24h: 250000,
            volume7d: 2000000,
            liquidity: 500000,
            holders: 5200,
            trades24h: 324,
            price: 0.00015,
            priceChange24h: 0.0000021,
            priceChangePercent24h: 1.4,
            allTimeHigh: {
              price: 0.00025,
              date: '2023-09-01T12:34:56Z'
            }
          },
          lastUpdated: new Date().toISOString()
        } as unknown as T
      };
    }
    
    if (url.startsWith('/api/v1/market/transactions')) {
      // Mock transaction data
      const mockTransactions = Array.from({ length: 10 }, (_, i) => ({
        hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        type: ['buy', 'sell', 'transfer'][Math.floor(Math.random() * 3)] as 'buy' | 'sell' | 'transfer',
        amount: Math.floor(Math.random() * 10000000) + 100000,
        price: 0.00015 + (Math.random() * 0.00005 - 0.000025),
        value: Math.floor(Math.random() * 10000) + 100,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
        fromAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        toAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        isSignificant: Math.random() > 0.9
      }));
      
      return {
        data: {
          transactions: mockTransactions,
          pagination: {
            total: 156,
            limit: 10,
            offset: 0
          }
        } as unknown as T
      };
    }
    
    return { 
      data: { 
        // Return empty mock data for now
      } as unknown as T 
    };
  },
  
  /**
   * Make a POST request
   */
  post: async <T>(url: string, data?: { data?: any }, options?: RequestInit): Promise<{ data: T }> => {
    console.log(`POST request to ${url} with data:`, data);
    
    // Mock implementation
    // In production, this would make a real HTTP request
    return { 
      data: { 
        // Return empty mock data for now
        success: true,
        isVerified: true
      } as unknown as T 
    };
  },
  
  /**
   * Make a PUT request
   */
  put: async <T>(url: string, data?: any, options?: RequestInit): Promise<{ data: T }> => {
    console.log(`PUT request to ${url} with data:`, data);
    
    // Mock implementation
    return { 
      data: { 
        // Return empty mock data for now
      } as unknown as T 
    };
  },
  
  /**
   * Make a DELETE request
   */
  delete: async <T>(url: string, options?: RequestInit): Promise<{ data: T }> => {
    console.log(`DELETE request to ${url}`);
    
    // Mock implementation
    return { 
      data: { 
        // Return empty mock data for now
      } as unknown as T 
    };
  }
};
