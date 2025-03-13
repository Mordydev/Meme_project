import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get redemption history
 */
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // This is a placeholder - in a real implementation, this would fetch from the backend API
  const mockRedemptions = [
    {
      id: 'rdm_123',
      pointsAmount: 1000,
      tokenAmount: 10,
      status: 'completed',
      requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    },
    {
      id: 'rdm_122',
      pointsAmount: 5000,
      tokenAmount: 50,
      status: 'completed',
      requestedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    }
  ];
  
  // Apply pagination
  const paginatedRedemptions = mockRedemptions.slice(offset, offset + limit);
  
  return Response.json({
    data: {
      redemptions: paginatedRedemptions,
      pagination: {
        total: mockRedemptions.length,
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
