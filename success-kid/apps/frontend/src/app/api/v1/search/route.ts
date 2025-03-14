import { NextRequest, NextResponse } from 'next/server';
import { SearchResult, SearchResultType } from '@/types';

/**
 * Main search API endpoint
 * This is a mock implementation that returns static data
 * In a real implementation, this would query a search index or database
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const sort = searchParams.get('sort') || 'relevance';
  
  // Parse types filter
  const typesParam = searchParams.get('types');
  const types = typesParam ? typesParam.split(',') as SearchResultType[] : undefined;
  
  // Parse date range
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  
  // Additional filters
  const exactMatch = searchParams.get('exactMatch') === 'true';
  const includeComments = searchParams.get('includeComments') !== 'false';
  
  // Early return for empty queries
  if (!query.trim()) {
    return NextResponse.json(
      {
        results: [],
        totalResults: 0,
        page,
        pageSize: limit,
        totalPages: 0,
      },
      { status: 200 }
    );
  }
  
  // For demonstration, we'll use static data
  // In a real implementation, this would search a database or search index
  const mockResults = generateMockResults(query, types);
  
  // Apply sorting (in a real implementation, this would be done in the database query)
  const sortedResults = sortMockResults(mockResults, sort as string);
  
  // Apply pagination
  const offset = (page - 1) * limit;
  const paginatedResults = sortedResults.slice(offset, offset + limit);
  const totalPages = Math.ceil(sortedResults.length / limit);
  
  // Return search results
  return NextResponse.json(
    {
      results: paginatedResults,
      totalResults: sortedResults.length,
      page,
      pageSize: limit,
      totalPages,
      // Only include correctedQuery if it's different from the original
      ...(query.length < 3 && query !== 'Success Kid' && {
        correctedQuery: 'Success Kid',
      }),
    },
    { status: 200 }
  );
}

/**
 * Generate mock search results for demonstration purposes
 */
function generateMockResults(
  query: string,
  types?: SearchResultType[]
): SearchResult[] {
  // Set of mock results we can filter and return
  const allResults: SearchResult[] = [
    {
      id: 'post_1',
      type: 'post',
      title: 'Getting Started with Success Kid Platform',
      snippet: 'Learn how to make the most of the Success Kid community platform and start earning rewards today.',
      highlightRanges: [
        { start: 16, end: 28 },
        { start: 39, end: 47 },
      ],
      url: '/community/post/post_1',
      author: {
        id: 'user_1',
        username: 'platform_guide',
        avatarUrl: '/images/avatars/guide.png',
      },
      metadata: {
        createdAt: '2025-02-15T14:30:00Z',
        relevanceScore: 0.95,
        matches: ['success', 'kid', 'platform', 'community'],
      },
    },
    {
      id: 'post_2',
      type: 'post',
      title: 'Success Kid Token Explained',
      snippet: 'A comprehensive guide to understanding the tokenomics behind Success Kid (SKC) and how the point system works.',
      highlightRanges: [
        { start: 0, end: 11 },
      ],
      url: '/community/post/post_2',
      author: {
        id: 'user_2',
        username: 'crypto_expert',
        avatarUrl: '/images/avatars/expert.png',
      },
      metadata: {
        createdAt: '2025-02-10T09:45:00Z',
        relevanceScore: 0.92,
        matches: ['success', 'kid', 'token', 'tokenomics'],
      },
    },
    {
      id: 'user_1',
      type: 'user',
      title: 'Platform Guide',
      snippet: 'Official Success Kid community guide and platform expert.',
      highlightRanges: [
        { start: 9, end: 21 },
      ],
      url: '/profile/user_1',
      metadata: {
        createdAt: '2025-01-01T00:00:00Z',
        relevanceScore: 0.85,
        matches: ['success', 'kid', 'platform'],
      },
    },
    {
      id: 'comment_1',
      type: 'comment',
      title: 'RE: Success Kid Token Value Prediction',
      snippet: 'I think Success Kid has real long-term potential because of the community engagement model.',
      highlightRanges: [
        { start: 5, end: 16 },
        { start: 28, end: 39 },
      ],
      url: '/community/post/post_3#comment_1',
      author: {
        id: 'user_3',
        username: 'token_analyst',
      },
      metadata: {
        createdAt: '2025-02-20T11:15:00Z',
        relevanceScore: 0.82,
        matches: ['success', 'kid', 'token', 'value'],
      },
    },
    {
      id: 'achievement_1',
      type: 'achievement',
      title: 'Success Kid Pioneer',
      snippet: 'Awarded to early members of the Success Kid community who joined during the platform launch phase.',
      highlightRanges: [
        { start: 0, end: 16 },
      ],
      url: '/achievements/achievement_1',
      metadata: {
        createdAt: '2025-02-01T00:00:00Z',
        relevanceScore: 0.78,
        matches: ['success', 'kid', 'community', 'platform'],
      },
    },
    {
      id: 'category_1',
      type: 'category',
      title: 'Success Kid Tokenomics',
      snippet: 'Discuss all aspects of Success Kid token economics, price predictions, and market strategies.',
      highlightRanges: [
        { start: 0, end: 11 },
      ],
      url: '/community/category/category_1',
      metadata: {
        createdAt: '2025-01-15T00:00:00Z',
        relevanceScore: 0.75,
        matches: ['success', 'kid', 'token', 'tokenomics'],
      },
    },
    // Add more mock results as needed
  ];
  
  // Filter by type if specified
  const typeFiltered = types?.length
    ? allResults.filter((result) => types.includes(result.type))
    : allResults;
  
  // Filter by query relevance
  // In a real implementation, this would be done by a search engine
  const queryKeywords = query.toLowerCase().split(/\s+/);
  const filtered = typeFiltered.filter((result) => {
    const content = `${result.title} ${result.snippet}`.toLowerCase();
    return queryKeywords.some((keyword) => content.includes(keyword));
  });
  
  return filtered;
}

/**
 * Sort mock results based on the specified sort criteria
 */
function sortMockResults(results: SearchResult[], sort: string): SearchResult[] {
  const sortedResults = [...results];
  
  switch (sort) {
    case 'date':
      // Sort by date, newest first
      sortedResults.sort((a, b) => {
        return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime();
      });
      break;
    
    case 'popularity':
      // For this mock, we'll use a combination of relevance score and date
      sortedResults.sort((a, b) => {
        const popularityScoreA = a.metadata.relevanceScore * 0.7 + 
          (new Date(a.metadata.createdAt).getTime() / new Date().getTime()) * 0.3;
        const popularityScoreB = b.metadata.relevanceScore * 0.7 + 
          (new Date(b.metadata.createdAt).getTime() / new Date().getTime()) * 0.3;
        return popularityScoreB - popularityScoreA;
      });
      break;
    
    case 'relevance':
    default:
      // Sort by relevance score
      sortedResults.sort((a, b) => b.metadata.relevanceScore - a.metadata.relevanceScore);
      break;
  }
  
  return sortedResults;
}
