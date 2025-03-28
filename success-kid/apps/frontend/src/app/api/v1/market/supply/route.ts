import { NextResponse } from 'next/server';
import { TokenAllocation } from '@/types';

// Token supply and allocation data
const totalSupply = 7000000000; // 7 billion tokens
const circulatingSupply = 2310000000; // 33% in circulation
const burned = 140000000; // 2% burned

// Token allocations
const allocations: TokenAllocation[] = [
  {
    id: 'community_rewards',
    name: 'Community Rewards',
    amount: 3500000000, // 50% of total
    percentage: 50,
    description: 'Tokens reserved for community engagement rewards, distributed through platform activity',
    color: '#1E88E5' // Victory Blue
  },
  {
    id: 'development',
    name: 'Development Team',
    amount: 1400000000, // 20% of total
    percentage: 20,
    description: 'Allocated to the development team, vesting over time to fund ongoing platform improvements',
    color: '#4CAF50' // Success Green
  },
  {
    id: 'public_sale',
    name: 'Public Sale',
    amount: 1050000000, // 15% of total
    percentage: 15,
    description: 'Tokens available through public sale events for initial distribution',
    color: '#FFC107' // Sand Gold
  },
  {
    id: 'liquidity',
    name: 'Liquidity Pool',
    amount: 700000000, // 10% of total
    percentage: 10,
    description: 'Reserved for providing trading liquidity across various platforms',
    color: '#9C27B0' // Purple
  },
  {
    id: 'marketing',
    name: 'Marketing',
    amount: 210000000, // 3% of total
    percentage: 3,
    description: 'Used for marketing initiatives, partnerships, and growth activities',
    color: '#FF9800' // Orange
  },
  {
    id: 'burned',
    name: 'Burned',
    amount: burned, // 2% burned
    percentage: 2,
    description: 'Tokens permanently removed from circulation',
    color: '#F44336' // Action Red
  }
];

export async function GET() {
  return NextResponse.json({
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
