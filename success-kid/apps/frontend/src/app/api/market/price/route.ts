import { NextRequest } from 'next/server';

/**
 * Get price data for the specified time range and resolution
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const timeRange = searchParams.get('timeRange') || '1d';
  const resolution = searchParams.get('resolution') || '5m';
  
  // This is a placeholder implementation with mock data
  // In a real implementation, you would fetch this from market data APIs
  
  // Current timestamp and initial price
  const now = Date.now();
  const basePrice = 0.00897;
  
  // Generate time ranges based on requested timeRange
  let startTime = now;
  let interval = 0;
  let dataPoints = 0;
  
  switch (timeRange) {
    case '1h':
      startTime = now - 60 * 60 * 1000;
      dataPoints = resolution === '1m' ? 60 : 12;
      interval = (now - startTime) / dataPoints;
      break;
    case '1d':
      startTime = now - 24 * 60 * 60 * 1000;
      dataPoints = resolution === '5m' ? 288 : resolution === '15m' ? 96 : 24;
      interval = (now - startTime) / dataPoints;
      break;
    case '1w':
      startTime = now - 7 * 24 * 60 * 60 * 1000;
      dataPoints = resolution === '1h' ? 168 : 84;
      interval = (now - startTime) / dataPoints;
      break;
    case '1m':
      startTime = now - 30 * 24 * 60 * 60 * 1000;
      dataPoints = 30;
      interval = (now - startTime) / dataPoints;
      break;
    case '3m':
      startTime = now - 90 * 24 * 60 * 60 * 1000;
      dataPoints = 90;
      interval = (now - startTime) / dataPoints;
      break;
    case '1y':
      startTime = now - 365 * 24 * 60 * 60 * 1000;
      dataPoints = 365;
      interval = (now - startTime) / dataPoints;
      break;
    case 'all':
      // SKC launched 6 months ago in this simulation
      startTime = now - 180 * 24 * 60 * 60 * 1000;
      dataPoints = 180;
      interval = (now - startTime) / dataPoints;
      break;
    default:
      startTime = now - 24 * 60 * 60 * 1000;
      dataPoints = 24;
      interval = (now - startTime) / dataPoints;
  }
  
  // Generate price data points
  const prices = Array.from({ length: dataPoints }, (_, i) => {
    // Generate a timestamp for this data point
    const timestamp = startTime + i * interval;
    
    // Generate a price with some randomness but trending upwards
    // We'll use a sine wave with an upward trend and some noise
    const daysSinceStart = i / dataPoints;
    const trendFactor = 1 + (daysSinceStart * 0.15); // Upward trend
    const sineFactor = Math.sin(i / 5) * 0.05; // Sine wave
    const noiseFactor = (Math.random() - 0.5) * 0.02; // Random noise
    
    const price = basePrice * (trendFactor + sineFactor + noiseFactor);
    
    // Generate volume with some randomness
    const volume = 750000 + (Math.random() * 500000);
    
    return {
      timestamp,
      price,
      volume,
    };
  });
  
  // Calculate price change
  const firstPrice = prices[0].price;
  const lastPrice = prices[prices.length - 1].price;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = (priceChange / firstPrice) * 100;
  
  return Response.json({
    data: {
      symbol: 'SKC',
      basePrice: lastPrice,
      priceChange,
      priceChangePercent,
      prices,
      lastUpdated: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
