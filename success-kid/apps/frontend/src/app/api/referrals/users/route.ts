import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for getting referred users
 * This is a mock implementation - would be replaced with a real backend call
 */
export async function GET(request: NextRequest) {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'date';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  
  // Generate mock data
  // This would be replaced with a real database query
  const allReferrals = [
    {
      userId: 'user_1',
      username: 'crypto_enthusiast',
      avatarUrl: 'https://ui-avatars.com/api/?name=CE&background=0D8ABC&color=fff',
      registeredAt: '2025-03-10T12:30:00Z',
      convertedAt: '2025-03-12T15:45:00Z',
      status: 'converted',
      pointsGenerated: 1500,
      lastActive: '2025-03-13T09:20:00Z'
    },
    {
      userId: 'user_2',
      username: 'blockchain_fan',
      avatarUrl: 'https://ui-avatars.com/api/?name=BF&background=4CAF50&color=fff',
      registeredAt: '2025-03-05T10:15:00Z',
      convertedAt: '2025-03-07T14:30:00Z',
      status: 'converted',
      pointsGenerated: 1200,
      lastActive: '2025-03-12T16:45:00Z'
    },
    {
      userId: 'user_3',
      username: 'token_collector',
      avatarUrl: 'https://ui-avatars.com/api/?name=TC&background=FF9800&color=fff',
      registeredAt: '2025-03-08T08:45:00Z',
      convertedAt: '2025-03-09T11:20:00Z',
      status: 'converted',
      pointsGenerated: 800,
      lastActive: '2025-03-11T13:10:00Z'
    },
    {
      userId: 'user_4',
      username: 'new_member',
      avatarUrl: 'https://ui-avatars.com/api/?name=NM&background=9C27B0&color=fff',
      registeredAt: '2025-03-12T09:30:00Z',
      status: 'pending',
      pointsGenerated: 0,
      lastActive: null
    },
    {
      userId: 'user_5',
      username: 'crypto_newbie',
      avatarUrl: 'https://ui-avatars.com/api/?name=CN&background=F44336&color=fff',
      registeredAt: '2025-03-11T14:20:00Z',
      status: 'pending',
      pointsGenerated: 0,
      lastActive: null
    },
    {
      userId: 'user_6',
      username: 'meme_lover',
      avatarUrl: 'https://ui-avatars.com/api/?name=ML&background=3F51B5&color=fff',
      registeredAt: '2025-03-09T15:40:00Z',
      status: 'active',
      pointsGenerated: 200,
      lastActive: '2025-03-13T10:30:00Z'
    },
    {
      userId: 'user_7',
      username: 'token_trader',
      avatarUrl: 'https://ui-avatars.com/api/?name=TT&background=607D8B&color=fff',
      registeredAt: '2025-03-07T11:25:00Z',
      status: 'active',
      pointsGenerated: 350,
      lastActive: '2025-03-12T09:15:00Z'
    },
    {
      userId: 'user_8',
      username: 'crypto_queen',
      avatarUrl: 'https://ui-avatars.com/api/?name=CQ&background=E91E63&color=fff',
      registeredAt: '2025-03-06T10:10:00Z',
      convertedAt: '2025-03-08T13:45:00Z',
      status: 'converted',
      pointsGenerated: 900,
      lastActive: '2025-03-13T08:50:00Z'
    },
    {
      userId: 'user_9',
      username: 'blockchain_dev',
      avatarUrl: 'https://ui-avatars.com/api/?name=BD&background=009688&color=fff',
      registeredAt: '2025-03-04T16:20:00Z',
      convertedAt: '2025-03-05T17:30:00Z',
      status: 'converted',
      pointsGenerated: 1100,
      lastActive: '2025-03-12T14:20:00Z'
    },
    {
      userId: 'user_10',
      username: 'nft_collector',
      avatarUrl: 'https://ui-avatars.com/api/?name=NC&background=795548&color=fff',
      registeredAt: '2025-03-03T09:05:00Z',
      convertedAt: '2025-03-04T10:15:00Z',
      status: 'converted',
      pointsGenerated: 1300,
      lastActive: '2025-03-11T11:40:00Z'
    },
    {
      userId: 'user_11',
      username: 'defi_expert',
      avatarUrl: 'https://ui-avatars.com/api/?name=DE&background=CDDC39&color=000',
      registeredAt: '2025-03-02T13:40:00Z',
      convertedAt: '2025-03-03T15:10:00Z',
      status: 'converted',
      pointsGenerated: 1400,
      lastActive: '2025-03-13T07:30:00Z'
    },
    {
      userId: 'user_12',
      username: 'web3_pioneer',
      avatarUrl: 'https://ui-avatars.com/api/?name=WP&background=2196F3&color=fff',
      registeredAt: '2025-03-01T10:25:00Z',
      convertedAt: '2025-03-02T12:50:00Z',
      status: 'converted',
      pointsGenerated: 1600,
      lastActive: '2025-03-12T18:15:00Z'
    }
  ];
  
  // Filter by status if specified
  let filteredReferrals = allReferrals;
  if (status !== 'all') {
    filteredReferrals = allReferrals.filter(user => user.status === status);
  }
  
  // Sort referrals
  switch (sortBy) {
    case 'date':
      filteredReferrals.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
      break;
    case 'points':
      filteredReferrals.sort((a, b) => b.pointsGenerated - a.pointsGenerated);
      break;
    case 'activity':
      filteredReferrals.sort((a, b) => {
        if (!a.lastActive) return 1;
        if (!b.lastActive) return -1;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      });
      break;
  }
  
  // Paginate referrals
  const paginatedReferrals = filteredReferrals.slice(offset, offset + limit);
  
  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return NextResponse.json({
    data: {
      referrals: paginatedReferrals,
      pagination: {
        total: filteredReferrals.length,
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
