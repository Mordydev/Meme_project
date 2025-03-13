import { NextResponse } from 'next/server';
import { MarketStats } from '@/types';

// Mock market stats data
const marketStats: MarketStats = {
  marketCap: 625000,
  volume24h: 187500,
  volume7d: 1250000,
  liquidity: 350000,
  holders: 3240,
  trades24h: 756,
  price: 0.00897,
  priceChange24h: 0.00042,
  priceChangePercent24h: 4.91,
  allTimeHigh: {
    price: 0.00965,
    date: '2025-03-05T16:23:12Z'
  }
};

export async function GET() {
  return NextResponse.json({
    data: {
      stats: marketStats,
      lastUpdated: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
