import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for getting active referral campaigns
 * This is a mock implementation - would be replaced with a real backend call
 */
export async function GET(request: NextRequest) {
  // Generate mock campaign data
  // In a real implementation, these would come from the database
  const campaigns = [
    {
      id: 'spring2025',
      name: 'Spring Launch Special',
      description: 'Invite friends during our spring promotion for extra rewards!',
      startDate: '2025-03-01T00:00:00Z',
      endDate: '2025-04-30T23:59:59Z',
      bonusReward: 250,
      referrerReward: 750,  // Higher than standard
      refereeReward: 150,   // Higher than standard
      isActive: true
    },
    {
      id: 'marketcap100k',
      name: '$100K Market Cap Celebration',
      description: 'Help us reach our first milestone with special referral bonuses',
      startDate: '2025-03-10T00:00:00Z',
      endDate: '2025-03-24T23:59:59Z',
      bonusReward: 100,
      referrerReward: 600,
      refereeReward: 100,
      isActive: true
    }
  ];
  
  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({
    data: {
      campaigns
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
