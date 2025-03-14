import { NextRequest, NextResponse } from 'next/server';

// Mock campaign data
const MOCK_CAMPAIGNS = {
  'campaign_spring': {
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
  'campaign_newuser': {
    id: 'campaign_newuser',
    name: 'New User Welcome',
    description: 'Special rewards for referring new users to the platform',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    bonusReward: 250,
    referrerReward: 750,
    refereeReward: 300,
    isActive: true,
  }
};

// Mock user referral code
const MOCK_REFERRAL_CODE = 'SUCCESS4U2';

export async function POST(request: NextRequest) {
  try {
    // Parse request body to get campaign ID
    const { campaignId } = await request.json();
    
    // Check if campaign exists
    const campaign = MOCK_CAMPAIGNS[campaignId];
    if (!campaign) {
      return NextResponse.json({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        errors: [{
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Campaign not found',
        }]
      }, { status: 404 });
    }
    
    // Check if campaign is active
    if (!campaign.isActive) {
      return NextResponse.json({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        errors: [{
          code: 'CAMPAIGN_INACTIVE',
          message: 'Campaign is not active',
        }]
      }, { status: 400 });
    }
    
    // Generate campaign link
    const originUrl = request.nextUrl.origin;
    const campaignReferralLink = `${originUrl}/join?ref=${MOCK_REFERRAL_CODE}&campaign=${campaignId}`;
    
    return NextResponse.json({
      data: {
        campaignReferralLink,
        campaignCode: MOCK_REFERRAL_CODE,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          endDate: campaign.endDate,
          bonusReward: campaign.bonusReward,
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating campaign link:', error);
    
    return NextResponse.json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to generate campaign link',
      }]
    }, { status: 500 });
  }
}
