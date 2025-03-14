import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { itemId, itemType, interaction, value } = body.data;
    
    // Validate required fields
    if (!itemId || !itemType || !interaction) {
      return NextResponse.json(
        {
          data: {
            success: false,
            error: 'Missing required fields'
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}`
          }
        },
        { status: 400 }
      );
    }
    
    // Add artificial delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate mock response data
    let updatedCounts = {
      votes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 10)
    };
    
    // If it's a vote interaction, adjust vote count based on value
    if (interaction === 'vote') {
      if (value === 'up') {
        updatedCounts.votes += 1;
      } else if (value === 'down') {
        updatedCounts.votes = Math.max(0, updatedCounts.votes - 1);
      }
    }
    
    // Maybe award points
    const pointsAwarded = Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : undefined;
    
    return NextResponse.json({
      data: {
        success: true,
        itemId,
        updatedCounts,
        pointsAwarded
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error processing interaction:', error);
    
    return NextResponse.json(
      {
        data: {
          success: false,
          error: 'Failed to process interaction'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}`
        }
      },
      { status: 500 }
    );
  }
}
