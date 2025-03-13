import { NextRequest } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs';

// GET handler for user profile
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
    
    // Check if user exists (in production, this would query your database)
    // For now, we'll just use Clerk's API to check if user exists
    try {
      const user = await clerkClient.users.getUser(id);
      
      // Mock stats data - in production, this would come from your database
      const stats = {
        points: Math.floor(Math.random() * 2000),
        achievements: Math.floor(Math.random() * 12),
        posts: Math.floor(Math.random() * 50),
        followers: Math.floor(Math.random() * 30),
        following: Math.floor(Math.random() * 60)
      };
      
      // Mock isFollowing status - in production, this would be checked in your database
      const isFollowing = Math.random() > 0.5;
      
      // Format the response
      return Response.json({
        data: {
          id: user.id,
          username: user.username,
          displayName: user.firstName && user.lastName ? 
            `${user.firstName} ${user.lastName}` : user.username,
          avatarUrl: user.imageUrl,
          bio: user.publicMetadata.bio || null,
          level: 5, // Mock level data
          joinDate: user.createdAt,
          stats,
          isFollowing,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      }, { status: 200 });
    } catch (error) {
      // User not found
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT handler for updating profile
export async function PUT(
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
    
    // Users can only update their own profile
    if (userId !== id) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get the request body
    const body = await req.json();
    
    // In a real implementation, validate the input and update the user's profile
    // For now, just simulate a successful update
    
    // Return success response
    return Response.json({
      data: {
        id,
        ...body,
        updatedAt: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
