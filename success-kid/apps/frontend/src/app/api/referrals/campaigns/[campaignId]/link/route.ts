import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for generating a campaign-specific referral link
 * This is a mock implementation - would be replaced with a real backend call
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  
  // In a real implementation, we would:
  // 1. Authenticate the user
  // 2. Verify the campaign exists and is active
  // 3. Generate or retrieve a campaign-specific code for this user
  // 4. Return the data
  
  // Mock campaign data lookup
  // In reality would fetch from database
  const campaignData = {
    'spring2025': {
      id: 'spring2025',
      name: 'Spring Launch Special',
      endDate: '2025-04-30T23:59:59Z',
      bonusReward: 250
    },
    'marketcap100k': {
      id: 'marketcap100k',
      name: '$100K Market Cap Celebration',
      endDate: '2025-03-24T23:59:59Z',
      bonusReward: 100
    }
  };
  
  // Check if campaign exists
  if (!campaignData[campaignId]) {
    return NextResponse.json(
      {
        error: 'Campaign not found',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      },
      { status: 404 }
    );
  }
  
  // Generate a campaign-specific referral link
  const baseReferralCode = 'SUCCESS123';
  const campaignCode = `${baseReferralCode}-${campaignId}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const campaignReferralLink = `${baseUrl}/join?ref=${campaignCode}&campaign=${campaignId}`;
  
  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({
    data: {
      campaignReferralLink,
      campaignCode,
      campaign: campaignData[campaignId]
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
