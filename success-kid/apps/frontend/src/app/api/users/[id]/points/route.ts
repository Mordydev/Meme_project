import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { ApiResponse } from '@/types/api';

/**
 * GET handler for user points.
 * @returns Points information for the specified user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { userId } = auth();
    const targetUserId = params.id;
    
    // Check authentication
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Optional: Only allow users to see their own points or implement specific permissions
    if (userId !== targetUserId && !process.env.ENABLE_PUBLIC_POINTS_ACCESS) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Fetch points data from the backend API
    const apiUrl = `${process.env.BACKEND_API_URL}/v1/users/${targetUserId}/points`;
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch points data' },
        { status: response.status }
      );
    }

    const pointsData = await response.json();
    
    // Return the data with proper typing
    const apiResponse: ApiResponse<typeof pointsData.data> = {
      data: pointsData.data,
      meta: {
        ...pointsData.meta,
        requestId: request.headers.get('x-request-id') || undefined,
      },
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve points information' },
      { status: 500 }
    );
  }
}
