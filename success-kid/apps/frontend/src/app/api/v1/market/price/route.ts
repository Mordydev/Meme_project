import { NextRequest, NextResponse } from 'next/server';
import { PriceDataPoint } from '@/types';

// Mock data for testing
const generatePriceData = (timeRange: string): PriceDataPoint[] => {
  const now = Date.now();
  const data: PriceDataPoint[] = [];
  
  let pointCount = 0;
  let interval = 0;
  let startTime = 0;
  
  // Determine number of data points and interval based on time range
  switch (timeRange) {
    case '1h':
      pointCount = 60;
      interval = 60 * 1000; // 1 minute
      startTime = now - 60 * 60 * 1000; // 1 hour ago
      break;
    case '1d':
      pointCount = 24;
      interval = 60 * 60 * 1000; // 1 hour
      startTime = now - 24 * 60 * 60 * 1000; // 1 day ago
      break;
    case '1w':
      pointCount = 7;
      interval = 24 * 60 * 60 * 1000; // 1 day
      startTime = now - 7 * 24 * 60 * 60 * 1000; // 1 week ago
      break;
    case '1m':
      pointCount = 30;
      interval = 24 * 60 * 60 * 1000; // 1 day
      startTime = now - 30 * 24 * 60 * 60 * 1000; // 1 month ago
      break;
    case '3m':
      pointCount = 90;
      interval = 24 * 60 * 60 * 1000; // 1 day
      startTime = now - 90 * 24 * 60 * 60 * 1000; // 3 months ago
      break;
    case '1y':
      pointCount = 12;
      interval = 30 * 24 * 60 * 60 * 1000; // 1 month
      startTime = now - 365 * 24 * 60 * 60 * 1000; // 1 year ago
      break;
    default:
      pointCount = 24;
      interval = 60 * 60 * 1000; // 1 hour
      startTime = now - 24 * 60 * 60 * 1000; // 1 day ago
  }
  
  // Generate price data with some randomization
  const basePrice = 0.00897;
  let currentPrice = basePrice;
  
  for (let i = 0; i < pointCount; i++) {
    // Add some realistic volatility
    const volatility = 0.015; // 1.5%
    const change = currentPrice * volatility * (Math.random() - 0.5);
    currentPrice = Math.max(0.00001, currentPrice + change);
    
    // Add volume with some correlation to price changes
    const volume = 500000 + Math.random() * 500000 + Math.abs(change) * 10000000;
    
    data.push({
      timestamp: startTime + i * interval,
      price: parseFloat(currentPrice.toFixed(8)),
      volume: Math.round(volume)
    });
  }
  
  return data;
};

export async function GET(request: NextRequest) {
  // Get time range from query parameters
  const searchParams = request.nextUrl.searchParams;
  const timeRange = searchParams.get('timeRange') || '1d';
  
  // Generate mock price data
  const priceData = generatePriceData(timeRange);
  
  // Calculate 24h price change
  const lastPrice = priceData[priceData.length - 1].price;
  const firstPrice = priceData[0].price;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = (priceChange / firstPrice) * 100;
  
  return NextResponse.json({
    data: {
      symbol: 'SKC',
      basePrice: lastPrice,
      priceChange,
      priceChangePercent,
      prices: priceData,
      lastUpdated: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
