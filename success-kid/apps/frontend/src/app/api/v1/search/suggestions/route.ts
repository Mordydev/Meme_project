import { NextRequest, NextResponse } from 'next/server';
import { SearchSuggestion } from '@/types';

/**
 * Search suggestions API endpoint
 * This is a mock implementation that returns static data
 * In a real implementation, this would query a search index or database
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '5', 10);
  
  // Early return for short queries
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [], topResults: [] }, { status: 200 });
  }
  
  // Generate mock suggestions
  const suggestions = generateMockSuggestions(query, limit);
  
  // Generate mock top results (direct matches)
  const topResults = generateMockTopResults(query, Math.min(2, limit));
  
  return NextResponse.json(
    {
      suggestions,
      topResults: topResults.length > 0 ? topResults : undefined,
    },
    { status: 200 }
  );
}

/**
 * Generate mock search suggestions
 */
function generateMockSuggestions(query: string, limit: number): SearchSuggestion[] {
  const lowerQuery = query.toLowerCase();
  
  // Static list of potential suggestions
  const allSuggestions = [
    { text: 'success kid', type: 'query' as const },
    { text: 'success kid token', type: 'query' as const },
    { text: 'success kid platform', type: 'query' as const },
    { text: 'success kid community', type: 'query' as const },
    { text: 'success kid achievements', type: 'query' as const },
    { text: 'success kid points system', type: 'query' as const },
    { text: 'success kid tokenomics', type: 'query' as const },
    { text: 'success kid referral program', type: 'query' as const },
    { text: 'success kid wallet connection', type: 'query' as const },
    { text: 'success kid market cap', type: 'query' as const },
    { text: 'platform guide', type: 'user' as const, id: 'user_1', url: '/profile/user_1' },
    { text: 'crypto expert', type: 'user' as const, id: 'user_2', url: '/profile/user_2' },
    { text: 'token analysis', type: 'content' as const, id: 'post_2', url: '/community/post/post_2' },
    { text: 'community guidelines', type: 'content' as const, id: 'post_5', url: '/community/post/post_5' },
  ];
  
  // Filter suggestions by query
  const matched = allSuggestions.filter(suggestion => 
    suggestion.text.toLowerCase().includes(lowerQuery)
  );
  
  // Add highlight ranges
  const result: SearchSuggestion[] = matched.map(suggestion => {
    const index = suggestion.text.toLowerCase().indexOf(lowerQuery);
    return {
      ...suggestion,
      highlight: index >= 0 ? [index, index + lowerQuery.length] : undefined,
    };
  });
  
  // Sort by relevance (exact match first, then by position of match)
  result.sort((a, b) => {
    // If there's no highlight, it's a lower match
    if (!a.highlight) return 1;
    if (!b.highlight) return -1;
    
    // Exact matches at the beginning are prioritized
    if (a.highlight[0] === 0 && b.highlight[0] !== 0) return -1;
    if (b.highlight[0] === 0 && a.highlight[0] !== 0) return 1;
    
    // Otherwise sort by position of match
    return a.highlight[0] - b.highlight[0];
  });
  
  // Return limited results
  return result.slice(0, limit);
}

/**
 * Generate mock top results (direct matches)
 */
function generateMockTopResults(
  query: string, 
  limit: number
): Array<{ id: string; type: string; title: string; url: string }> {
  const lowerQuery = query.toLowerCase();
  
  // Static list of potential top results
  const allTopResults = [
    {
      id: 'post_1',
      type: 'post',
      title: 'Getting Started with Success Kid Platform',
      url: '/community/post/post_1',
    },
    {
      id: 'post_2',
      type: 'post',
      title: 'Success Kid Token Explained',
      url: '/community/post/post_2',
    },
    {
      id: 'user_1',
      type: 'user',
      title: 'Platform Guide',
      url: '/profile/user_1',
    },
    {
      id: 'category_1',
      type: 'category',
      title: 'Success Kid Tokenomics',
      url: '/community/category/category_1',
    },
  ];
  
  // Filter top results by query
  const matched = allTopResults.filter(result => 
    result.title.toLowerCase().includes(lowerQuery)
  );
  
  // Return limited results
  return matched.slice(0, limit);
}
