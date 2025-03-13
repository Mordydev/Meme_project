import { NextRequest, NextResponse } from 'next/server';
import { AlertPreferences } from '@/types';

// Default alert preferences
const defaultPreferences: AlertPreferences = {
  enabledAlerts: ['milestone_reached', 'price_movement'],
  customThresholds: {
    priceMovement: 5, // 5% price movement
    volumeSpike: 50 // 50% volume increase
  },
  notificationMethods: {
    inApp: true,
    email: false,
    push: false
  }
};

// Mock user preferences storage
let userPreferences = defaultPreferences;

export async function GET() {
  return NextResponse.json({
    data: userPreferences,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}

export async function PUT(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    // Validate input data
    if (!data) {
      return NextResponse.json(
        {
          data: null,
          errors: [{ code: 'VALIDATION_ERROR', message: 'Invalid data format' }]
        },
        { status: 400 }
      );
    }
    
    // Update preferences
    userPreferences = {
      ...userPreferences,
      ...data
    };
    
    return NextResponse.json({
      data: {
        success: true,
        updatedAt: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        errors: [{ code: 'SERVER_ERROR', message: 'Failed to update preferences' }]
      },
      { status: 500 }
    );
  }
}
