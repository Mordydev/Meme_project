import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for getting referral analytics data
 * This is a mock implementation - would be replaced with a real backend call
 */
export async function GET(request: NextRequest) {
  // Get time range from query parameters
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || 'all-time';
  
  // Mock analytics data
  const statistics = {
    totalReferrals: 12,
    convertedReferrals: 8,
    pendingReferrals: 4,
    conversionRate: 66.7,
    pointsEarned: 4000
  };
  
  // Generate timeline data based on the time range
  let timeline = [];
  
  switch (timeRange) {
    case 'week':
      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        timeline.push({
          period: day,
          referrals: Math.floor(Math.random() * 5),
          conversions: Math.floor(Math.random() * 3),
          points: Math.floor(Math.random() * 500)
        });
      }
      break;
      
    case 'month':
      // Generate last 4 weeks
      for (let i = 0; i < 4; i++) {
        timeline.push({
          period: `Week ${i + 1}`,
          referrals: Math.floor(Math.random() * 8) + 2,
          conversions: Math.floor(Math.random() * 5) + 1,
          points: Math.floor(Math.random() * 1000) + 200
        });
      }
      break;
      
    case 'year':
      // Generate last 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        timeline.push({
          period: months[i],
          referrals: Math.floor(Math.random() * 10) + 5,
          conversions: Math.floor(Math.random() * 8) + 2,
          points: Math.floor(Math.random() * 2000) + 500
        });
      }
      break;
      
    default:
      // All time - quarterly data
      timeline = [
        { period: 'Q1', referrals: 10, conversions: 6, points: 3000 },
        { period: 'Q2', referrals: 18, conversions: 12, points: 6000 },
        { period: 'Q3', referrals: 15, conversions: 10, points: 5000 },
        { period: 'Q4', referrals: 12, conversions: 8, points: 4000 }
      ];
  }
  
  // Mock data for top referrals
  const topReferrals = [
    {
      userId: 'user_12345',
      username: 'activefriend',
      registeredAt: '2025-02-15T14:35:00Z',
      status: 'converted',
      pointsGenerated: 1500
    },
    {
      userId: 'user_67890',
      username: 'newmember',
      registeredAt: '2025-02-28T10:22:00Z',
      status: 'pending',
      pointsGenerated: 0
    },
    {
      userId: 'user_24680',
      username: 'cryptofan',
      registeredAt: '2025-02-10T08:15:00Z',
      status: 'converted',
      pointsGenerated: 1200
    }
  ];
  
  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return NextResponse.json({
    data: {
      statistics,
      timeline,
      topReferrals
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
