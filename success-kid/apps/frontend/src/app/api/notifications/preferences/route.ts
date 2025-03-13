import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Mock default preferences
const defaultPreferences = {
  categories: {
    achievement: true,
    social: true,
    system: true,
    content: true,
    market: true,
  },
  delivery: {
    inApp: true,
    email: true,
    push: false,
  },
  frequency: 'immediate',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC',
  },
};

// Mock user preferences storage
const userPreferences = new Map();

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user preferences or return defaults
    const preferences = userPreferences.get(userId) || defaultPreferences;
    
    return NextResponse.json({
      data: preferences,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const newPreferences = body.data;
    
    if (!newPreferences) {
      return NextResponse.json(
        { error: 'Invalid request: preferences data is required' },
        { status: 400 }
      );
    }
    
    // Get existing preferences or use defaults
    const existingPreferences = userPreferences.get(userId) || { ...defaultPreferences };
    
    // Merge new preferences with existing ones
    const updatedPreferences = {
      ...existingPreferences,
      ...newPreferences,
      categories: {
        ...existingPreferences.categories,
        ...(newPreferences.categories || {}),
      },
      delivery: {
        ...existingPreferences.delivery,
        ...(newPreferences.delivery || {}),
      },
      quietHours: {
        ...existingPreferences.quietHours,
        ...(newPreferences.quietHours || {}),
      },
    };
    
    // Store updated preferences
    userPreferences.set(userId, updatedPreferences);
    
    return NextResponse.json({
      data: {
        success: true,
        updatedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
