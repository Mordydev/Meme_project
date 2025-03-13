import { NextRequest } from 'next/server';

// Mock transaction types
type TransactionType = 'buy' | 'sell' | 'transfer';

// Mock transaction data
const mockTransactions = [
  {
    hash: '0x8f7d3e6b5e4c2d1a9b0c8f7d3e6b5e4c2d1a9b0c',
    type: 'buy' as TransactionType,
    amount: 25000,
    price: 0.00897,
    value: 224.25,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    fromAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0x8a31f2572e8946cb95c8fjd832dbef473aef32e4b',
    isSignificant: true
  },
  {
    hash: '0x7d3e6b5e4c2d1a9b0c8f7d3e6b5e4c2d1a9b0c8f',
    type: 'sell' as TransactionType,
    amount: 12500,
    price: 0.00895,
    value: 111.88,
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    fromAddress: '0x7f31f3d92ea78bc64d8fe73abe8374fb3232a2c',
    toAddress: '0x0000000000000000000000000000000000000000',
    isSignificant: false
  },
  {
    hash: '0xe6b5e4c2d1a9b0c8f7d3e6b5e4c2d1a9b0c8f7d3',
    type: 'buy' as TransactionType,
    amount: 75000,
    price: 0.00896,
    value: 672.00,
    timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    fromAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0x3d31f3d92ea78bc64d8fe73abe8374fb3236f1a',
    isSignificant: true
  },
  {
    hash: '0xb5e4c2d1a9b0c8f7d3e6b5e4c2d1a9b0c8f7d3e6',
    type: 'transfer' as TransactionType,
    amount: 50000,
    price: null,
    value: null,
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    fromAddress: '0x2b31f3d92ea78bc64d8fe73abe8374fb3234e7d',
    toAddress: '0x9c31f3d92ea78bc64d8fe73abe8374fb3235b3f',
    isSignificant: true
  },
  {
    hash: '0x4c2d1a9b0c8f7d3e6b5e4c2d1a9b0c8f7d3e6b5e',
    type: 'sell' as TransactionType,
    amount: 30000,
    price: 0.00894,
    value: 268.20,
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    fromAddress: '0x9c31f3d92ea78bc64d8fe73abe8374fb3235b3f',
    toAddress: '0x0000000000000000000000000000000000000000',
    isSignificant: true
  },
  {
    hash: '0x2d1a9b0c8f7d3e6b5e4c2d1a9b0c8f7d3e6b5e4c',
    type: 'buy' as TransactionType,
    amount: 18000,
    price: 0.00893,
    value: 160.74,
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    fromAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0x2b31f3d92ea78bc64d8fe73abe8374fb3234e7d',
    isSignificant: false
  },
  {
    hash: '0x1a9b0c8f7d3e6b5e4c2d1a9b0c8f7d3e6b5e4c2d',
    type: 'transfer' as TransactionType,
    amount: 100000,
    price: null,
    value: null,
    timestamp: new Date(Date.now() - 78 * 60 * 1000).toISOString(),
    fromAddress: '0x3d31f3d92ea78bc64d8fe73abe8374fb3236f1a',
    toAddress: '0x7f31f3d92ea78bc64d8fe73abe8374fb3232a2c',
    isSignificant: true
  },
  {
    hash: '0x9b0c8f7d3e6b5e4c2d1a9b0c8f7d3e6b5e4c2d1a',
    type: 'sell' as TransactionType,
    amount: 45000,
    price: 0.00892,
    value: 401.40,
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    fromAddress: '0x2b31f3d92ea78bc64d8fe73abe8374fb3234e7d',
    toAddress: '0x0000000000000000000000000000000000000000',
    isSignificant: true
  },
  {
    hash: '0x0c8f7d3e6b5e4c2d1a9b0c8f7d3e6b5e4c2d1a9b',
    type: 'buy' as TransactionType,
    amount: 60000,
    price: 0.00891,
    value: 534.60,
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    fromAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0x8a31f2572e8946cb95c8fjd832dbef473aef32e4b',
    isSignificant: true
  },
  {
    hash: '0x8f7d3e6b5e4c2d1a9b0c8f7d3e6b5e4c2d1a9b0d',
    type: 'buy' as TransactionType,
    amount: 33000,
    price: 0.00890,
    value: 293.70,
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    fromAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0x3d31f3d92ea78bc64d8fe73abe8374fb3236f1a',
    isSignificant: true
  }
];

/**
 * Get transaction feed data
 */
export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') as TransactionType | 'all' || 'all';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // Filter transactions by type if specified
  let transactions = [...mockTransactions];
  if (type !== 'all') {
    transactions = transactions.filter(tx => tx.type === type);
  }
  
  // Implement pagination
  const paginatedTransactions = transactions.slice(offset, offset + limit);
  
  return Response.json({
    data: {
      transactions: paginatedTransactions,
      pagination: {
        total: transactions.length,
        limit,
        offset
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`
    }
  });
}
