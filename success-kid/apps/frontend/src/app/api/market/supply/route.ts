import { NextRequest } from 'next/server';

/**
 * Get token supply data
 */
export async function GET(request: NextRequest) {
  // Mock token supply data
  const supplyData = {
    totalSupply: 7000000000,
    circulatingSupply: 3500000000,
    burned: 25000000,
    allocations: [
      {
        id: 'community_rewards',
        name: 'Community Rewards',
        amount: 3500000000,
        percentage: 50,
        description: 'Incentivize platform engagement',
        color: '#1E88E5' // Victory Blue
      },
      {
        id: 'development_team',
        name: 'Development Team',
        amount: 1400000000,
        percentage: 20,
        description: 'Fund development, marketing',
        color: '#4CAF50' // Success Green
      },
      {
        id: 'public_sale',
        name: 'Public Sale',
        amount: 2100000000,
        percentage: 30,
        description: 'Distribution and liquidity',
        color: '#FFC107' // Sand Gold
      }
    ],
    lastUpdated: new Date().toISOString()
  };
  
  return Response.json({
    data: supplyData,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`
    }
  });
}
