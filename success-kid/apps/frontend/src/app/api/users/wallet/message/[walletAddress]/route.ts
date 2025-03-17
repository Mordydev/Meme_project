import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get signature message for wallet verification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const { walletAddress } = params;
  
  try {
    // Forward request to backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/v1/users/wallet/message/${encodeURIComponent(walletAddress)}`,
      {
        headers: {
          'Authorization': `Bearer ${request.headers.get('authorization')?.split(' ')[1]}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting wallet signature message:', error);
    
    return NextResponse.json(
      { error: 'Failed to get signature message' },
      { status: 500 }
    );
  }
}
