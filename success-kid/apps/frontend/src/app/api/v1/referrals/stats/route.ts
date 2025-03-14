import { NextRequest, NextResponse } from 'next/server';

// Mock referral statistics data
const MOCK_STATS = {
  totalReferrals: 24,
  convertedReferrals: 15,
  pendingReferrals: 9,
  conversionRate: 62.5,
  pointsEarned: 8500
};

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would fetch actual statistics
    // from the database based on the authenticated user
    
    return NextResponse.json({
      data: MOCK_STATS,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching referral statistics:', error);
    
    return NextResponse.json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to fetch referral statistics',
      }]
    }, { status: 500 });
  }
}
