import { NextRequest, NextResponse } from 'next/server';

/**
 * Check username availability
 * @param request - The incoming request
 * @param params - The route parameters containing the username
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  
  try {
    // Forward request to backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/v1/users/check-username/${encodeURIComponent(username)}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to check username availability');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking username availability:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to check username availability',
        data: { username, available: false }
      },
      { status: 500 }
    );
  }
}
