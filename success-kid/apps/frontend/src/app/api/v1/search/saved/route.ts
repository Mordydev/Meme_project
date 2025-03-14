import { NextRequest, NextResponse } from 'next/server';
import { SavedSearch } from '@/types';

// Mock storage for saved searches (in a real implementation, this would be in a database)
// Export for use in the [id] route handler
export let SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 'saved_1',
    name: 'Tokenomics Research',
    query: 'success kid tokenomics',
    filters: {
      types: ['post', 'comment'],
      dateRange: {
        start: '2025-01-01',
      },
    },
    sort: 'relevance',
    createdAt: '2025-02-15T10:30:00Z',
  },
  {
    id: 'saved_2',
    name: 'Platform Updates',
    query: 'platform update',
    filters: {
      types: ['post'],
      categories: ['announcements'],
    },
    sort: 'date',
    createdAt: '2025-02-10T15:45:00Z',
  },
];

/**
 * Get all saved searches for the current user
 * This is a mock implementation
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ searches: SAVED_SEARCHES }, { status: 200 });
}

/**
 * Create a new saved search
 * This is a mock implementation
 */
export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    // Validate required fields
    if (!data.name || !data.query) {
      return NextResponse.json(
        {
          error: 'Name and query are required',
        },
        { status: 400 }
      );
    }
    
    // Create a new saved search
    const newSearch: SavedSearch = {
      id: `saved_${Date.now()}`,
      name: data.name,
      query: data.query,
      filters: data.filters || {},
      sort: data.sort || 'relevance',
      createdAt: new Date().toISOString(),
    };
    
    // Add to mock storage (in a real implementation, this would be saved to a database)
    SAVED_SEARCHES = [newSearch, ...SAVED_SEARCHES];
    
    return NextResponse.json({ search: newSearch }, { status: 201 });
  } catch (error) {
    console.error('Error creating saved search:', error);
    return NextResponse.json(
      {
        error: 'Failed to create saved search',
      },
      { status: 500 }
    );
  }
}
