/**
 * Mock API endpoint to simulate WebSocket events
 * This helps with testing the real-time notification system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
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
    const { eventType } = body;
    
    // Mock different event types
    switch (eventType) {
      case 'new-achievement': {
        // Return a mock achievement notification
        return NextResponse.json({
          success: true,
          data: {
            type: 'notification:new',
            data: {
              type: 'achievement',
              title: 'Achievement Unlocked!',
              message: 'You earned the "Early Adopter" badge',
              data: {
                achievementId: 'achievement_early_adopter',
                badgeUrl: '/images/badges/early-adopter.svg'
              },
              actions: [
                {
                  label: 'View Badge',
                  action: 'view_achievement',
                  url: '/achievements/early-adopter'
                }
              ]
            }
          }
        });
      }
      
      case 'new-follower': {
        // Return a mock follower notification
        return NextResponse.json({
          success: true,
          data: {
            type: 'notification:new',
            data: {
              type: 'social',
              title: 'New Follower',
              message: 'SuccessGuru is now following you',
              data: {
                userId: 'user_789',
                username: 'SuccessGuru'
              },
              actions: [
                {
                  label: 'View Profile',
                  action: 'view_profile',
                  url: '/profile/user_789'
                },
                {
                  label: 'Follow Back',
                  action: 'follow_user',
                  url: '/api/users/user_789/follow'
                }
              ]
            }
          }
        });
      }
      
      case 'market-update': {
        // Return a mock market update notification
        return NextResponse.json({
          success: true,
          data: {
            type: 'notification:new',
            data: {
              type: 'market',
              title: 'Price Alert',
              message: 'SKC price increased by 15% in the last hour',
              data: {
                priceChange: 15,
                currentPrice: 0.0012,
                previousPrice: 0.00104
              },
              actions: [
                {
                  label: 'View Chart',
                  action: 'view_chart',
                  url: '/market'
                }
              ]
            }
          }
        });
      }
      
      default: {
        return NextResponse.json({
          error: 'Unknown event type',
          message: 'Supported event types: new-achievement, new-follower, market-update'
        }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('Error in WS mock endpoint:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
