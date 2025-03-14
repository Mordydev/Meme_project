import { NextRequest, NextResponse } from 'next/server';

// Mock valid referral codes and their referrers
const VALID_REFERRAL_CODES = {
  'SUCCESS4U2': {
    referrerId: 'user_123',
    referrerUsername: 'cryptoenthusiast',
  },
  'NEWCODE123': {
    referrerId: 'user_456',
    referrerUsername: 'contentcreator',
  },
};

// Mock campaigns
const CAMPAIGNS = {
  'campaign_spring': {
    id: 'campaign_spring',
    name: 'Spring Referral Boost',
    description: 'Get 2x points for all referrals during our Spring promotion!',
    bonusReward: 500,
  },
  'campaign_newuser': {
    id: 'campaign_newuser',
    name: 'New User Welcome',
    description: 'Special rewards for referring new users to the platform',
    bonusReward: 250,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;
    
    // Check if code is valid
    const isValid = code in VALID_REFERRAL_CODES;
    
    // If not valid, return false
    if (!isValid) {
      return NextResponse.json({
        data: {
          isValid: false,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      }, { status: 200 });
    }
    
    // Get referrer info
    const referrerInfo = VALID_REFERRAL_CODES[code];
    
    // Check for campaign parameter
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaign');
    const campaign = campaignId ? CAMPAIGNS[campaignId] : null;
    
    return NextResponse.json({
      data: {
        isValid: true,
        referrerId: referrerInfo.referrerId,
        referrerUsername: referrerInfo.referrerUsername,
        campaign: campaign ? {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          bonusReward: campaign.bonusReward,
        } : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error validating referral code:', error);
    
    return NextResponse.json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to validate referral code',
      }]
    }, { status: 500 });
  }
}
