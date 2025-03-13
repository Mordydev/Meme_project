import { NextRequest } from 'next/server';

/**
 * Get market statistics
 */
export async function GET(request: NextRequest) {
  // Mock market statistics data
  const marketStats = {
    marketCap: 625000,
    volume24h: 125000,
    volume7d: 950000,
    liquidity: 85000,
    holders: 3750,
    trades24h: 156,
    price: 0.00897,
    priceChange24h: 0.00042,
    priceChangePercent24h: 4.91,
    allTimeHigh: {
      price: 0.00925,
      date: '2025-03-02T14:23:15Z'
    },
    lastUpdated: new Date().toISOString()
  };
  
  return Response.json({
    data: marketStats,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`
    }
  });
}
