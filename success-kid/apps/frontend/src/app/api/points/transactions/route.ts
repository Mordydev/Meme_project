import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get user points transactions with optional filtering
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
  
  // This is a placeholder - in a real implementation, this would fetch from the backend API
  // Generate mock transactions
  const now = new Date();
  const mockTransactions = [
    {
      id: 'tx_123',
      amount: 50,
      type: 'earned',
      source: 'content_creation',
      description: 'Created a new post',
      timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      referenceId: 'post_456',
      referenceType: 'post'
    },
    {
      id: 'tx_124',
      amount: 15,
      type: 'earned',
      source: 'engagement',
      description: 'Received upvotes on comment',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      referenceId: 'comment_789',
      referenceType: 'comment'
    },
    {
      id: 'tx_125',
      amount: 100,
      type: 'earned',
      source: 'achievement',
      description: 'Unlocked "First Steps" achievement',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      referenceId: 'achievement_123',
      referenceType: 'achievement'
    },
    {
      id: 'tx_126',
      amount: 20,
      type: 'earned',
      source: 'daily_login',
      description: 'Daily login bonus',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_127',
      amount: -1000,
      type: 'spent',
      source: 'redemption',
      description: 'Redeemed points for tokens',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      referenceId: 'redemption_123',
      referenceType: 'redemption'
    },
    {
      id: 'tx_128',
      amount: 25,
      type: 'earned',
      source: 'referral',
      description: 'Referral bonus',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      referenceId: 'user_123',
      referenceType: 'user'
    },
    {
      id: 'tx_129',
      amount: 35,
      type: 'earned',
      source: 'content_creation',
      description: 'Created a new comment',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      referenceId: 'comment_456',
      referenceType: 'comment'
    },
    {
      id: 'tx_130',
      amount: 150,
      type: 'earned',
      source: 'engagement',
      description: 'Content popularity bonus',
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      referenceId: 'post_789',
      referenceType: 'post'
    }
  ];
  
  // Apply filters (in a real implementation, these would be DB queries)
  let filteredTransactions = [...mockTransactions];
  
  // Filter by type
  if (type === 'earned') {
    filteredTransactions = filteredTransactions.filter(tx => tx.amount > 0);
  } else if (type === 'spent') {
    filteredTransactions = filteredTransactions.filter(tx => tx.amount < 0);
  }
  
  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    filteredTransactions = filteredTransactions.filter(
      tx => new Date(tx.timestamp) >= start
    );
  }
  
  if (endDate) {
    const end = new Date(endDate);
    filteredTransactions = filteredTransactions.filter(
      tx => new Date(tx.timestamp) <= end
    );
  }
  
  // Filter by amount
  if (minAmount) {
    const min = parseInt(minAmount, 10);
    filteredTransactions = filteredTransactions.filter(
      tx => Math.abs(tx.amount) >= min
    );
  }
  
  if (maxAmount) {
    const max = parseInt(maxAmount, 10);
    filteredTransactions = filteredTransactions.filter(
      tx => Math.abs(tx.amount) <= max
    );
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
      timestamp: now.toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
