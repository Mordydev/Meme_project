/**
 * Types for Search and Discovery features
 */

export type SearchResultType = 'post' | 'user' | 'comment' | 'achievement' | 'category';

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'user' | 'content';
  highlight?: [number, number]; // Start and end index
  url?: string;
  id?: string;
}

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title?: string;
  snippet: string;
  highlightRanges: Array<{start: number, end: number}>;
  url: string;
  author?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  metadata: {
    createdAt: string;
    relevanceScore: number;
    matches: string[];
  };
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
  correctedQuery?: string;
}

export interface SuggestionResponse {
  suggestions: SearchSuggestion[];
  topResults?: Array<{
    id: string;
    type: string;
    title: string;
    url: string;
  }>;
}

export interface SearchFilters {
  types?: SearchResultType[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  categories?: string[];
  tags?: string[];
  [key: string]: any;
}

export type SearchSortOption = 'relevance' | 'date' | 'popularity';

export interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date';
  options?: Array<{value: string, label: string}>;
  range?: {min: number, max: number};
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  sort: SearchSortOption;
  createdAt: string;
}

// Discovery types
export interface DiscoveryItem {
  id: string;
  type: string;
  title: string;
  snippet: string;
  thumbnailUrl?: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
  reason: 'trending' | 'recommended' | 'interest' | 'popular';
}

export interface UserSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  reason: 'similar_interests' | 'popular' | 'mutual_connections';
  mutualConnections?: number;
  followerCount: number;
}

export interface DiscoveryFeedResponse {
  items: DiscoveryItem[];
  interests: string[];
}

export interface UserRecommendationsResponse {
  users: UserSuggestion[];
}
