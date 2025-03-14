import { NextRequest, NextResponse } from 'next/server';
import { FeedItem } from '@/components/features/activity-feed/types';
import { generateMockFeedItem } from './utils';

// Generate multiple mock feed items
function generateMockFeedItems(count: number, feedType: string): FeedItem[] {
  const items: FeedItem[] = [];
  
  for (let i = 0; i < count; i++) {
    items.push(generateMockFeedItem(feedType));
  }
  
  // Sort by creation date (newest first)
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function GET(request: NextRequest) {
  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const feedType = searchParams.get('feedType') || 'global';
  const types = searchParams.getAll('types');
  const sort = searchParams.get('sort') || 'recent';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const cursor = searchParams.get('cursor');
  
  // Simulate pagination with cursor
  const offset = cursor ? parseInt(cursor, 10) : 0;
  
  // Generate mock data
  const items = generateMockFeedItems(limit, feedType);
  
  // Apply type filtering if specified
  const filteredItems = types.length > 0 && !types.includes('all')
    ? items.filter(item => types.includes(item.type))
    : items;
  
  // Simulate more data available
  const hasMore = offset < 50;
  const nextCursor = hasMore ? (offset + limit).toString() : undefined;
  
  // Add artificial delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({
    data: {
      items: filteredItems,
      nextCursor,
      hasMore
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`
    }
  });
}
