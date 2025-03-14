import { NextRequest, NextResponse } from 'next/server';

// Mock data for different time ranges
const MOCK_ANALYTICS = {
  'week': {
    statistics: {
      totalReferrals: 8,
      convertedReferrals: 5,
      pendingReferrals: 3,
      conversionRate: 62.5,
      pointsEarned: 2500
    },
    timeline: [
      { period: 'Mon', referrals: 1, conversions: 0, points: 0 },
      { period: 'Tue', referrals: 2, conversions: 1, points: 500 },
      { period: 'Wed', referrals: 1, conversions: 1, points: 500 },
      { period: 'Thu', referrals: 0, conversions: 0, points: 0 },
      { period: 'Fri', referrals: 2, conversions: 2, points: 1000 },
      { period: 'Sat', referrals: 1, conversions: 1, points: 500 },
      { period: 'Sun', referrals: 1, conversions: 0, points: 0 },
    ],
  },
  'month': {
    statistics: {
      totalReferrals: 24,
      convertedReferrals: 15,
      pendingReferrals: 9,
      conversionRate: 62.5,
      pointsEarned: 8500
    },
    timeline: [
      { period: 'Mar 5', referrals: 3, conversions: 2, points: 1000 },
      { period: 'Mar 6', referrals: 5, conversions: 3, points: 1500 },
      { period: 'Mar 7', referrals: 4, conversions: 2, points: 1000 },
      { period: 'Mar 8', referrals: 6, conversions: 4, points: 2000 },
      { period: 'Mar 9', referrals: 2, conversions: 1, points: 500 },
      { period: 'Mar 10', referrals: 4, conversions: 3, points: 1500 },
    ],
  },
  'year': {
    statistics: {
      totalReferrals: 68,
      convertedReferrals: 42,
      pendingReferrals: 26,
      conversionRate: 61.8,
      pointsEarned: 21000
    },
    timeline: [
      { period: 'Jan', referrals: 12, conversions: 7, points: 3500 },
      { period: 'Feb', referrals: 18, conversions: 11, points: 5500 },
      { period: 'Mar', referrals: 24, conversions: 15, points: 8500 },
      { period: 'Apr', referrals: 14, conversions: 9, points: 4500 },
    ],
  },
  'all-time': {
    statistics: {
      totalReferrals: 124,
      convertedReferrals: 82,
      pendingReferrals: 42,
      conversionRate: 66.1,
      pointsEarned: 41000
    },
    timeline: [
      { period: '2023 Q3', referrals: 22, conversions: 15, points: 7500 },
      { period: '2023 Q4', referrals: 34, conversions: 25, points: 12500 },
      { period: '2024 Q1', referrals: 68, conversions: 42, points: 21000 },
    ],
  },
};

export async function GET(request: NextRequest) {
  try {
    // Get the time range from query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'month';
    
    // Get the appropriate mock data
    const mockData = MOCK_ANALYTICS[timeRange] || MOCK_ANALYTICS['month'];
    
    return NextResponse.json({
      data: mockData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching referral analytics:', error);
    
    return NextResponse.json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to fetch referral analytics',
      }]
    }, { status: 500 });
  }
}
