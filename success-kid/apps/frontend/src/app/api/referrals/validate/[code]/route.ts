import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for validating a referral code
 * This is a mock implementation - would be replaced with a real backend call
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;
  
  // Mock validation process for testing
  // In a real implementation, this would check against the database
  const isValid = code && code.length >= 6;
  
  // Simulate validation lookup
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Generate mock data for valid codes
  let responseData = {
    isValid: isValid,
    referrerId: isValid ? 'user_123456' : undefined,
    referrerUsername: isValid ? 'successfriend' : undefined,
  };
  
  // Add campaign data if there's a campaign parameter in the query
  const url = new URL(request.url);
  const campaignId = url.searchParams.get('campaign');
  
  if (campaignId && isValid) {
    responseData = {
      ...responseData,
      campaign: {
        id: campaignId,
        name: 'Spring Launch Special',
        description: 'Join during our spring promotion for extra rewards!',
        bonusReward: 250,
      }
    };
  }
  
  return NextResponse.json({
    data: responseData,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
