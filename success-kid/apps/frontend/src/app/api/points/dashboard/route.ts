import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get user points dashboard data
 */
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // This is a placeholder - in a real implementation, this would fetch from the backend API
  const dashboardData = {
    currentBalance: 2450,
    lifetimeEarned: 3750,
    redeemed: 1000,
    dailyEarned: 350,
    breakdown: [
      {
        category: 'content_creation',
        amount: 1250,
        percentage: 33.3
      },
      {
        category: 'engagement',
        amount: 950,
        percentage: 25.3
      },
      {
        category: 'achievement',
        amount: 750,
        percentage: 20.0
      },
      {
        category: 'referral',
        amount: 800,
        percentage: 21.4
      }
    ],
    caps: {
      'content_creation': {
        limit: 200,
        used: 150,
        resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      'engagement': {
        limit: 150,
        used: 125,
        resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      'daily_login': {
        limit: 20,
        used: 20,
        resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    }
  };
  
  return Response.json({
    data: dashboardData,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
