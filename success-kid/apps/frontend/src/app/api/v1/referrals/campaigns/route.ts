import { NextRequest, NextResponse } from 'next/server';

// Mock campaign data
const MOCK_CAMPAIGNS = [
  {
    id: 'campaign_spring',
    name: 'Spring Referral Boost',
    description: 'Get 2x points for all referrals during our Spring promotion!',
    startDate: '2025-03-01T00:00:00Z',
    endDate: '2025-04-15T23:59:59Z',
    bonusReward: 500,
    referrerReward: 1000,
    refereeReward: 250,
    isActive: true,
  },
  {
    id: 'campaign_newuser',
    name: 'New User Welcome',
    description: 'Special rewards for referring new users to the platform',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    bonusReward: 250,
    referrerReward: 750,
    refereeReward: 300,
    isActive: true,
  },
  {
    id: 'campaign_early_bird',
    name: 'Early Bird Special',
    description: 'Extra rewards for our first wave of referrals',
    startDate: '2025-02-01T00:00:00Z',
    endDate: '2025-02-28T23:59:59Z',
    bonusReward: 750,
    referrerReward: 1250,
    refereeReward: 400,
    isActive: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    // Get active campaigns only by default
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    let campaigns = [...MOCK_CAMPAIGNS];
    if (!includeInactive) {
      campaigns = campaigns.filter(campaign => campaign.isActive);
    }
    
    return NextResponse.json({
      data: {
        campaigns,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    
    return NextResponse.json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to fetch campaigns',
      }]
    }, { status: 500 });
  }
}
