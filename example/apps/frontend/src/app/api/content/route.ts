import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const sort = searchParams.get('sort') || 'recent';
    const cursor = searchParams.get('cursor') || '';
    const limit = searchParams.get('limit') || '10';
    
    // Call the backend API
    const response = await fetch(`${process.env.BACKEND_URL}/api/content?filter=${filter}&sort=${sort}&cursor=${cursor}&limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while fetching content',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to create content',
          },
        },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Call the backend API
    const response = await fetch(`${process.env.BACKEND_URL}/api/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`,
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while creating content',
        },
      },
      { status: 500 }
    );
  }
}
