import { NextRequest } from 'next/server';

/**
 * Get current market data
 */
export async function GET(request: NextRequest) {
  // This is a placeholder - in a real implementation, this would fetch from external APIs
  const marketData = {
    currentPrice: 0.00123,
    priceChange24h: 5.2,
    volume24h: 45000,
    marketCap: 45000,
    totalSupply: 7000000000,
    circulatingSupply: 3500000000,
    nextMilestone: {
      target: 100000,
      current: 45000,
      percentage: 45
    }
  };
  
  return Response.json({
    data: marketData,
    meta: {
      timestamp: new Date().toISOString(),
      source: 'mock-data'
    }
  });
}
