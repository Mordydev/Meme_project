import { NextRequest } from 'next/server';
import { generateMockFeedItem } from '../utils';

export async function GET(request: NextRequest) {
  const feedType = request.nextUrl.searchParams.get('feedType') || 'global';
  
  // Create a response with the right headers for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Send initial connection message
  const initialMessage = JSON.stringify({
    type: 'connection:established',
    data: {
      feedType,
      timestamp: new Date().toISOString()
    }
  });
  writer.write(encoder.encode(`data: ${initialMessage}\n\n`));
  
  // Set up an interval to send mock feed updates
  const intervalId = setInterval(async () => {
    try {
      // Random event type
      const eventTypes = ['feed:new_item', 'feed:interaction_update'];
      const eventType = Math.random() > 0.3 ? eventTypes[0] : eventTypes[1];
      
      let eventData;
      
      if (eventType === 'feed:new_item') {
        // Generate a new feed item
        const item = generateMockFeedItem(feedType);
        eventData = {
          item,
          feedTypes: [feedType, 'global']
        };
      } else {
        // Generate an interaction update
        eventData = {
          itemId: `item_${Math.floor(Math.random() * 1000)}`,
          itemType: ['post', 'media', 'activity', 'achievement'][Math.floor(Math.random() * 4)],
          updatedCounts: {
            votes: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 20),
            shares: Math.floor(Math.random() * 10)
          }
        };
      }
      
      const message = JSON.stringify({
        type: eventType,
        data: eventData
      });
      
      // Write the event to the stream
      writer.write(encoder.encode(`data: ${message}\n\n`));
    } catch (error) {
      console.error('Error sending SSE event:', error);
    }
  }, 10000); // Send an update every 10 seconds
  
  // Close the stream when the request is aborted
  request.signal.addEventListener('abort', () => {
    clearInterval(intervalId);
    writer.close();
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
