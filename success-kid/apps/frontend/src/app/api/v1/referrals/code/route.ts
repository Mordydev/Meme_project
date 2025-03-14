import { NextRequest, NextResponse } from 'next/server';

// Generate a new referral code
function generateReferralCode(length: number = 8): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting similar-looking characters
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    // In a real implementation, this would verify the user's authentication
    // and generate a new referral code in the database
    
    // For demo purposes, just generate a new code
    const newCode = generateReferralCode();
    const originUrl = request.nextUrl.origin;
    
    return NextResponse.json({
      data: {
        referralCode: newCode,
        referralLink: `${originUrl}/join?ref=${newCode}`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating referral code:', error);
    
    return NextResponse.json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to generate referral code',
      }]
    }, { status: 500 });
  }
}
