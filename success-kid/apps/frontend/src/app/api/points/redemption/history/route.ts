import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get user's redemption history
 */
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get query parameters for pagination
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // This is a placeholder - in a real implementation, this would fetch from the backend API
  // For now, we'll return an empty array since we haven't implemented redemptions yet
  const redemptionHistory = [];
  
  return Response.json({
    data: {
      redemptions: redemptionHistory,
      pagination: {
        total: redemptionHistory.length,
        limit,
        offset
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
