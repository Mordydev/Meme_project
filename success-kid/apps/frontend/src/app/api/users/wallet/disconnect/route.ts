import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Disconnect wallet from user account
 */
export async function POST(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Forward request to backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/v1/users/wallet/disconnect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.headers.get('authorization')?.split(' ')[1]}`,
        },
        body: JSON.stringify(body),
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
    console.error('Error disconnecting wallet:', error);
    
    return NextResponse.json(
      { error: 'Failed to disconnect wallet' },
      { status: 500 }
    );
  }
}
