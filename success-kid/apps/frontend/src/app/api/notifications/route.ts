import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Placeholder for mock notifications data
const mockNotifications = [
  {
    id: 'notif_123',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You earned the "Content Creator" badge',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    data: {
      achievementId: 'achievement_content_creator',
      badgeUrl: '/images/badges/content-creator.svg'
    },
    actions: [
      {
        label: 'View Badge',
        action: 'view_achievement',
        url: '/achievements/content-creator'
      }
    ]
  },
  {
    id: 'notif_124',
    type: 'social',
    title: 'New Follower',
    message: 'User123 is now following you',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    data: {
      userId: 'user_456',
      username: 'User123'
    },
    actions: [
      {
        label: 'View Profile',
        action: 'view_profile',
        url: '/profile/user_456'
      },
      {
        label: 'Follow Back',
        action: 'follow_user',
        url: '/api/users/user_456/follow'
      }
    ]
  },
  {
    id: 'notif_125',
    type: 'content',
    title: 'New Comment',
    message: 'User456 commented on your post',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    data: {
      postId: 'post_789',
      commentId: 'comment_123',
      userId: 'user_456',
      username: 'User456'
    },
    actions: [
      {
        label: 'View Comment',
        action: 'view_comment',
        url: '/posts/post_789?comment=comment_123'
      },
      {
        label: 'Reply',
        action: 'reply_comment',
        url: '/posts/post_789?comment=comment_123&reply=true'
      }
    ]
  },
  {
    id: 'notif_126',
    type: 'market',
    title: 'Market Milestone!',
    message: 'SKC token reached $500K market cap',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    data: {
      marketCap: 500000,
      previousCap: 400000,
      percentChange: 25
    },
    actions: [
      {
        label: 'View Market',
        action: 'view_market',
        url: '/market'
      }
    ]
  },
  {
    id: 'notif_127',
    type: 'system',
    title: 'Welcome to Success Kid Platform',
    message: 'Get started by completing your profile and connecting your wallet',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    data: {
      isWelcome: true
    },
    actions: [
      {
        label: 'Complete Profile',
        action: 'edit_profile',
        url: '/profile/edit'
      },
      {
        label: 'Connect Wallet',
        action: 'connect_wallet',
        url: '/wallet/connect'
      }
    ]
  }
];

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type');
    const readParam = searchParams.get('read');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Filter notifications based on query parameters
    let filteredNotifications = [...mockNotifications];
    
    if (type && type !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }
    
    if (readParam !== null) {
      const isRead = readParam === 'true';
      filteredNotifications = filteredNotifications.filter(n => n.read === isRead);
    }
    
    // Apply pagination
    const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);
    
    // Calculate unread count
    const unreadCount = mockNotifications.filter(n => !n.read).length;
    
    // Return the response
    return NextResponse.json({
      data: {
        notifications: paginatedNotifications,
        unreadCount,
        pagination: {
          total: filteredNotifications.length,
          limit,
          offset,
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { ids = [] } = body.data || {};
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be a non-empty array' },
        { status: 400 }
      );
    }
    
    // In a real implementation, we would update the read status in the database
    // Here we'll just return success for the mock
    return NextResponse.json({
      data: {
        success: true,
        updatedCount: ids.length,
        unreadCount: Math.max(0, mockNotifications.filter(n => !n.read).length - ids.length),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // In a real implementation, we would delete notifications from the database
    // Here we'll just return success for the mock
    return NextResponse.json({
      data: {
        success: true,
        deletedCount: mockNotifications.length,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
