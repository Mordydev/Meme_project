import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get user points balance and history
 */
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // This is a placeholder - in a real implementation, this would fetch from the backend API
  const pointsData = {
    balance: 1250,
    history: [
      { id: '1', amount: 50, source: 'content_creation', createdAt: new Date().toISOString() },
      { id: '2', amount: 15, source: 'comment', createdAt: new Date().toISOString() },
      { id: '3', amount: 100, source: 'daily_login_streak', createdAt: new Date().toISOString() },
    ]
  };
  
  return Response.json({
    data: pointsData,
    meta: {
      timestamp: new Date().toISOString(),
    }
  });
}
