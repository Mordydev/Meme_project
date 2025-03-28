import { NextRequest, NextResponse } from 'next/server';
import { MarketTransaction } from '@/types';

// Mock transaction data generator
const generateTransactions = (count = 50): MarketTransaction[] => {
  const transactions: MarketTransaction[] = [];
  const now = Date.now();
  
  // Mock wallet addresses
  const wallets = [
    '8xnRpBBZGfYS4M2K7Cgd61bQUxzWpAGM1LPG3e2SY7iv',
    '3jWBgwLgBEN91CvNTK8isAZMGRpjqxPZR5kneKS2ztQ4',
    'FxgsvgMt1iyAtFtFdrY91EVzZib4zYLqbFKniUb9jQZg',
    'BCfUhX9igAwAKsbmxpkMHxwmJLbdUJEaVwkUMeBdYcqk',
    'GY52VJa89i8TF4Y4XUE4GrnMmvn7gCY3hnLKbG5pGSDZ',
    'AAZXANJpX7L8ZXS5xwPJRpN5fJ4aZ91QXQjL2rYwJyBT',
    'NPrX1ujWZGvRUCdWPcLGNsCLTVJ8Vn241ZFE8RTcYXj4',
    'HzHVkGY28ggMB8JAqDkDDTr1NcypvceTZw4h2uG29Tsa',
    '9Vmy8qKLMfAax2JZWgJRCtpHKPcZCT2WKLfitj5MiF4W',
    'bqhhiBpQq1QMPXMx3GQwMfPF3tEzpHbYAkMYskPXtJx'
  ];
  
  // Transaction types with their relative frequency
  const types = [
    { type: 'buy', weight: 0.45 },
    { type: 'sell', weight: 0.4 },
    { type: 'transfer', weight: 0.15 }
  ];
  
  for (let i = 0; i < count; i++) {
    // Determine transaction type based on weights
    const rand = Math.random();
    let cumulativeWeight = 0;
    let transactionType = 'buy';
    
    for (const typeObj of types) {
      cumulativeWeight += typeObj.weight;
      if (rand <= cumulativeWeight) {
        transactionType = typeObj.type;
        break;
      }
    }
    
    // Generate random transaction data
    const amount = Math.floor(Math.random() * 100000) + 1000; // 1K-100K tokens
    const timestamp = new Date(now - Math.floor(Math.random() * 86400000)); // Within last 24h
    
    // Generate from and to addresses
    const fromIndex = Math.floor(Math.random() * wallets.length);
    let toIndex = Math.floor(Math.random() * wallets.length);
    // Ensure different addresses
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * wallets.length);
    }
    
    // Random price around 0.00897
    const price = 0.00897 * (0.95 + Math.random() * 0.1);
    
    // Create transaction object
    const transaction: MarketTransaction = {
      hash: `${crypto.randomUUID().replace(/-/g, '')}`,
      type: transactionType as 'buy' | 'sell' | 'transfer',
      amount,
      price: ['buy', 'sell'].includes(transactionType) ? price : undefined,
      value: ['buy', 'sell'].includes(transactionType) ? amount * price : undefined,
      timestamp: timestamp.toISOString(),
      fromAddress: wallets[fromIndex],
      toAddress: wallets[toIndex],
      isSignificant: amount > 50000 // Transactions over 50K are significant
    };
    
    transactions.push(transaction);
  }
  
  // Sort by timestamp (newest first)
  return transactions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Generate a pool of transactions to filter from
const allTransactions = generateTransactions(100);

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'all';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // Filter transactions based on type
  let filteredTransactions = allTransactions;
  if (type !== 'all') {
    filteredTransactions = allTransactions.filter(tx => tx.type === type);
  }
  
  // Apply pagination
  const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
  const total = filteredTransactions.length;
  
  return NextResponse.json({
    data: {
      transactions: paginatedTransactions,
      pagination: {
        total,
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
