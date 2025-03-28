import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

// Generate random usernames
function generateUsername() {
  const firstNames = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Isabella', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return {
    displayName: `${firstName} ${lastName}`,
    username: `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`
  };
}

// Function to generate sample connections
function generateSampleConnections(userId: string, limit: number, offset: number, type: 'followers' | 'following') {
  const connections = [];
  
  for (let i = 0; i < limit; i++) {
    const connectionIndex = offset + i;
    const { displayName, username } = generateUsername();
    
    connections.push({
      id: `user_${connectionIndex}_${Math.random().toString(36).substring(2, 9)}`,
      displayName,
      username,
      avatarUrl: null, // Would be a real avatar URL in production
      level: Math.floor(Math.random() * 10) + 1,
      isFollowing: Math.random() > 0.5 // If we're viewing following, this is always true
    });
  }
  
  return connections;
}

// GET handler for user connections
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
    const type = (searchParams.get('type') || 'followers') as 'followers' | 'following';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Generate sample connections
    const connections = generateSampleConnections(id, limit, offset, type);
    
    // Calculate total - in production, this would be a database count
    const total = type === 'followers' ? 15 : 42; // Mock totals
    
    // Return connections
    return Response.json({
      data: {
        users: connections,
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
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting user connections:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
