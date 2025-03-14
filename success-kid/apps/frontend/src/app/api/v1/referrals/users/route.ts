import { NextRequest, NextResponse } from 'next/server';

// Mock referral data
const MOCK_REFERRALS = [
  {
    userId: 'user_123',
    username: 'activefriend',
    avatarUrl: '/images/avatars/user1.png',
    registeredAt: '2025-03-05T14:35:00Z',
    convertedAt: '2025-03-06T09:12:00Z',
    status: 'converted',
    pointsGenerated: 1500,
    lastActive: '2025-03-12T16:45:00Z',
  },
  {
    userId: 'user_456',
    username: 'newmember',
    avatarUrl: '/images/avatars/user2.png',
    registeredAt: '2025-03-07T10:22:00Z',
    status: 'pending',
    pointsGenerated: 0,
  },
  {
    userId: 'user_789',
    username: 'cryptofriend',
    avatarUrl: '/images/avatars/user3.png',
    registeredAt: '2025-03-01T08:15:00Z',
    convertedAt: '2025-03-02T11:30:00Z',
    status: 'converted',
    pointsGenerated: 1750,
    lastActive: '2025-03-11T12:20:00Z',
  },
  {
    userId: 'user_101',
    username: 'memefan',
    avatarUrl: '/images/avatars/user4.png',
    registeredAt: '2025-03-08T16:40:00Z',
    status: 'active',
    pointsGenerated: 250,
    lastActive: '2025-03-09T14:10:00Z',
  },
  {
    userId: 'user_102',
    username: 'designerpal',
    avatarUrl: '/images/avatars/user5.png',
    registeredAt: '2025-03-02T11:35:00Z',
    convertedAt: '2025-03-03T14:22:00Z',
    status: 'converted',
    pointsGenerated: 1250,
    lastActive: '2025-03-10T09:15:00Z',
  },
  {
    userId: 'user_103',
    username: 'techguru',
    avatarUrl: '/images/avatars/user6.png',
    registeredAt: '2025-03-04T09:10:00Z',
    status: 'pending',
    pointsGenerated: 0,
  },
];

export async function GET(request: NextRequest) {
  try {
    // Get params from the request
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'date';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Filter by status if specified
    let filteredReferrals = [...MOCK_REFERRALS];
    if (status && status !== 'all') {
      filteredReferrals = filteredReferrals.filter(referral => referral.status === status);
    }
    
    // Sort referrals
    filteredReferrals.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
      } else if (sortBy === 'points') {
        return b.pointsGenerated - a.pointsGenerated;
      } else if (sortBy === 'activity') {
        if (!a.lastActive) return 1;
        if (!b.lastActive) return -1;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      }
      return 0;
    });
    
    // Apply pagination
    const paginatedReferrals = filteredReferrals.slice(offset, offset + limit);
    
    return NextResponse.json({
      data: {
        referrals: paginatedReferrals,
        pagination: {
          total: filteredReferrals.length,
          limit,
          offset,
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    
    return NextResponse.json({
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to fetch referrals',
      }]
    }, { status: 500 });
  }
}
