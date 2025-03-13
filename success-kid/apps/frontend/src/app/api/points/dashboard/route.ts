import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get points dashboard data
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
      { category: 'content', amount: 1250, percentage: 33.3 },
      { category: 'engagement', amount: 950, percentage: 25.3 },
      { category: 'achievements', amount: 750, percentage: 20.0 },
      { category: 'referrals', amount: 800, percentage: 21.4 }
    ],
    transactions: [
      {
        id: 'tx_123',
        amount: 50,
        type: 'earned',
        source: 'content',
        description: 'Created a new post',
        timestamp: new Date().toISOString(),
        referenceId: 'post_456',
        referenceType: 'post'
      },
      {
        id: 'tx_124',
        amount: 15,
        type: 'earned',
        source: 'engagement',
        description: 'Received upvotes on comment',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        referenceId: 'comment_789',
        referenceType: 'comment'
      },
      {
        id: 'tx_125',
        amount: 100,
        type: 'earned',
        source: 'achievements',
        description: 'Unlocked "Content Creator" achievement',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        referenceId: 'achievement_101',
        referenceType: 'achievement'
      }
    ],
    caps: {
      'content': {
        limit: 200,
        used: 150,
        resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      },
      'engagement': {
        limit: 150,
        used: 125,
        resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
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
