import { NextRequest } from 'next/server';

/**
 * Get price data for token
 */
export async function GET(request: NextRequest) {
  // Get parameters from request
  const searchParams = request.nextUrl.searchParams;
  const timeRange = searchParams.get('timeRange') || '1d';
  const resolution = searchParams.get('resolution') || '15m';
  
  // Generate mock price data based on timeRange
  const mockPriceData = generateMockPriceData(timeRange, resolution);
  
  return Response.json({
    data: {
      symbol: 'SKC',
      basePrice: 0.00897,
      priceChange: 0.00042,
      priceChangePercent: 4.91,
      prices: mockPriceData,
      lastUpdated: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
      timeRange,
      resolution
    }
  });
}

/**
 * Generate mock price data for the specified time range and resolution
 */
function generateMockPriceData(timeRange: string, resolution: string) {
  // Calculate number of data points based on timeRange and resolution
  let dataPoints = 24; // Default for 1d
  let startTime = new Date();
  
  switch (timeRange) {
    case '1h':
      dataPoints = 12;
      startTime = new Date(Date.now() - 60 * 60 * 1000);
      break;
    case '1d':
      dataPoints = 24;
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case '1w':
      dataPoints = 7 * 24;
      startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1m':
      dataPoints = 30;
      startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3m':
      dataPoints = 90;
      startTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      dataPoints = 365;
      startTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      dataPoints = 500;
      startTime = new Date(Date.now() - 500 * 24 * 60 * 60 * 1000);
      break;
  }
  
  // Generate the price data
  const mockData = [];
  const basePrice = 0.00897;
  let currentPrice = basePrice;
  
  // Determine interval based on resolution and timeRange
  let interval = 60 * 60 * 1000; // Default 1h intervals
  
  // Adjust based on resolution for visual effect
  if (dataPoints > 100) {
    dataPoints = 100; // Cap for performance
  }
  
  // Generate time intervals
  const intervalMilliseconds = (Date.now() - startTime.getTime()) / dataPoints;
  
  for (let i = 0; i < dataPoints; i++) {
    // Random price fluctuation (more volatile for shorter timeframes)
    const volatility = timeRange === '1h' || timeRange === '1d' ? 0.005 : 0.01;
    const change = currentPrice * (Math.random() * volatility * 2 - volatility);
    currentPrice += change;
    
    // Ensure price doesn't go negative
    if (currentPrice < 0.0001) {
      currentPrice = 0.0001;
    }
    
    // Time for this data point
    const timestamp = startTime.getTime() + (i * intervalMilliseconds);
    
    // Generate volumes (higher for price increases)
    const volumeBase = 500000;
    const volumeVariation = 300000;
    const volume = volumeBase + (Math.random() * volumeVariation * (change > 0 ? 1.2 : 0.8));
    
    mockData.push({
      timestamp,
      price: currentPrice,
      volume: Math.round(volume)
    });
  }
  
  return mockData;
}
