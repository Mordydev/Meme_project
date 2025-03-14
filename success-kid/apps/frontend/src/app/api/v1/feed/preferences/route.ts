import { NextRequest, NextResponse } from 'next/server';
import { FeedPreferences } from '@/components/features/activity-feed/types';

// Default preferences
const defaultPreferences: FeedPreferences = {
  interests: ['community', 'memes'],
  followedUsers: [],
  contentTypes: ['all'],
  viewMode: 'standard'
};

// Mock user preferences (would be stored in a database in production)
let userPreferences: FeedPreferences = { ...defaultPreferences };

export async function GET() {
  // Add artificial delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json({
    data: userPreferences,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`
    }
  });
}

export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const updatedPreferences = body.data as Partial<FeedPreferences>;
    
    // Update preferences (partial update)
    userPreferences = {
      ...userPreferences,
      ...updatedPreferences
    };
    
    // Add artificial delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      data: {
        success: true,
        updatedAt: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    
    return NextResponse.json(
      {
        data: {
          success: false,
          error: 'Failed to update preferences'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`
        }
      },
      { status: 400 }
    );
  }
}
