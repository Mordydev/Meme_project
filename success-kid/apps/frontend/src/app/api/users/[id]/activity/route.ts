import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

// Define some sample activity types
const activityTypes = [
  'post',
  'comment',
  'achievement',
  'level_up',
  'points',
  'follow'
];

// Function to generate sample activity data
function generateSampleActivities(userId: string, limit: number, offset: number) {
  const activities = [];
  
  const now = new Date();
  
  for (let i = 0; i < limit; i++) {
    const activityIndex = offset + i;
    const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const randomDaysAgo = Math.floor(Math.random() * 30); // Random date within the last 30 days
    
    const activityDate = new Date(now);
    activityDate.setDate(activityDate.getDate() - randomDaysAgo);
    
    // Create base activity structure
    const activity = {
      id: `activity_${userId}_${activityIndex}`,
      type: randomType,
      timestamp: activityDate.toISOString(),
      details: {}
    };
    
    // Add type-specific details
    switch (randomType) {
      case 'post':
        activity.details = {
          postId: `post_${Math.random().toString(36).substring(2, 9)}`,
          title: `Sample Post ${activityIndex}`,
          previewText: `This is a preview of post ${activityIndex}. The full content would be longer.`
        };
        break;
      case 'comment':
        activity.details = {
          postId: `post_${Math.random().toString(36).substring(2, 9)}`,
          previewText: `This is a comment on a post. It might reference something interesting.`
        };
        break;
      case 'achievement':
        activity.details = {
          achievementId: `achievement_${Math.random().toString(36).substring(2, 9)}`,
          title: ['First Steps', 'Content Creator', 'Conversation Starter', 'Rising Star'][Math.floor(Math.random() * 4)]
        };
        break;
      case 'level_up':
        activity.details = {
          level: Math.floor(Math.random() * 10) + 1
        };
        break;
      case 'points':
        activity.details = {
          points: Math.floor(Math.random() * 100) + 10
        };
        break;
      case 'follow':
        activity.details = {
          userId: `user_${Math.random().toString(36).substring(2, 9)}`
        };
        break;
    }
    
    activities.push(activity);
  }
  
  // Sort by timestamp (most recent first)
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// GET handler for user activities
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    // Check authentication
    if (!userId) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user ID from params
    const { id } = params;
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Generate sample activities
    const activities = generateSampleActivities(id, limit, offset);
    
    // Filter by type if specified
    const filteredActivities = type !== 'all'
      ? activities.filter(activity => activity.type === type)
      : activities;
    
    // Return activities
    return Response.json({
      data: {
        activities: filteredActivities,
        pagination: {
          total: 42, // Mock total count
          limit,
          offset
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting user activities:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
