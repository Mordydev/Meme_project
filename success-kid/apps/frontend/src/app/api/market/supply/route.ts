import { NextRequest } from 'next/server';

/**
 * Get token supply data
 */
export async function GET(request: NextRequest) {
  // This is a placeholder implementation with mock data
  // In a real implementation, you would fetch this from blockchain APIs
  
  const totalSupply = 7000000000;
  const circulatingSupply = 3500000000;
  const burned = 35000000;
  
  // Token allocation details
  const allocations = [
    {
      id: 'community',
      name: 'Community Rewards',
      amount: 3500000000,
      percentage: 50,
      description: 'Allocated for community incentives, rewards, and engagement programs',
      color: 'oklch(0.84 0.18 240)' // primary-500
    },
    {
      id: 'team',
      name: 'Team & Development',
      amount: 1050000000,
      percentage: 15,
      description: 'Reserved for team members and ongoing development efforts',
      color: 'oklch(0.85 0.18 85)' // secondary-500
    },
    {
      id: 'marketing',
      name: 'Marketing & Partnerships',
      amount: 700000000,
      percentage: 10,
      description: 'Allocated for marketing campaigns, partnerships, and growth initiatives',
      color: 'oklch(0.85 0.18 135)' // accent-500
    },
    {
      id: 'liquidity',
      name: 'Liquidity Pool',
      amount: 1400000000,
      percentage: 20,
      description: 'Allocated to provide trading liquidity on decentralized exchanges',
      color: 'oklch(0.65 0.17 35)' // alert-700
    },
    {
      id: 'reserve',
      name: 'Treasury Reserve',
      amount: 350000000,
      percentage: 5,
      description: 'Strategic reserve for future opportunities and contingencies',
      color: 'oklch(0.55 0.15 135)' // accent-800
    }
  ];
  
  return Response.json({
    data: {
      totalSupply,
      circulatingSupply,
      burned,
      allocations,
      lastUpdated: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
