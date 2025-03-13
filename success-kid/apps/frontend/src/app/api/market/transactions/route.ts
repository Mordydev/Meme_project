import { NextRequest } from 'next/server';

/**
 * Get transaction feed data
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // This is a placeholder implementation with mock data
  // In a real implementation, you would fetch this from blockchain APIs
  
  // Transaction types
  const types = ['buy', 'sell', 'transfer'];
  
  // Generate mock transactions
  const now = Date.now();
  const allTransactions = Array.from({ length: 100 }, (_, i) => {
    const randomType = types[Math.floor(Math.random() * types.length)] as 'buy' | 'sell' | 'transfer';
    const randomAmount = Math.floor(10000 + Math.random() * 990000);
    const randomPrice = 0.00897 * (1 + (Math.random() - 0.5) * 0.1);
    const randomValue = randomType !== 'transfer' ? randomAmount * randomPrice : undefined;
    const randomTimestamp = new Date(now - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
    const isSignificant = randomAmount > 500000;
    
    return {
      hash: `0x${Math.random().toString(16).substring(2, 42)}`,
      type: randomType,
      amount: randomAmount,
      price: randomType !== 'transfer' ? randomPrice : undefined,
      value: randomValue,
      timestamp: randomTimestamp.toISOString(),
      fromAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      toAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      isSignificant
    };
  })
  // Sort by timestamp, most recent first
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Filter by type if specified
  const filteredTransactions = type === 'all' 
    ? allTransactions 
    : allTransactions.filter(tx => tx.type === type);
  
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
