import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get points transaction history
 */
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // In a real implementation, we would use these parameters to filter transactions
  // For now, we'll return mock data
  
  // Generate mock transactions
  const mockTransactions = [
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
    },
    {
      id: 'tx_126',
      amount: 1000,
      type: 'redeemed',
      source: 'redemption',
      description: 'Redeemed points for tokens',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      referenceId: 'redemption_201',
      referenceType: 'redemption'
    },
    {
      id: 'tx_127',
      amount: 25,
      type: 'earned',
      source: 'referral',
      description: 'User accepted your referral',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      referenceId: 'user_909',
      referenceType: 'user'
    }
  ];
  
  // Filter by type if specified
  let filteredTransactions = mockTransactions;
  if (type) {
    filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
  }
  
  // Apply pagination
  const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
  
  return Response.json({
    data: {
      transactions: paginatedTransactions,
      pagination: {
        total: filteredTransactions.length,
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

/**
 * Get points transaction details
 */
export async function GET_TRANSACTION_DETAIL(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  // In a real implementation, we would fetch the specific transaction
  // For now, we'll return mock data
  const mockTransaction = {
    id,
    amount: 50,
    type: 'earned',
    source: 'content',
    description: 'Created a new post',
    timestamp: new Date().toISOString(),
    referenceId: 'post_456',
    referenceType: 'post',
    details: {
      contentTitle: 'My awesome post',
      contentSummary: 'This is a summary of the post...',
      contentUrl: '/community/posts/456'
    }
  };
  
  return Response.json({
    data: {
      transaction: mockTransaction
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
