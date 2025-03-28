import { SearchFilters, SearchResult } from '@/hooks/search';

/**
 * Search analytics tracking service
 * 
 * This module provides functions to track search-related user interactions
 * for analytics purposes. The data can be used to improve search quality
 * and user experience.
 */

// Analytics event types
export enum SearchAnalyticsEventType {
  QUERY = 'search_query',
  RESULT_CLICK = 'search_result_click',
  FILTER_CHANGE = 'search_filter_change',
  REFINEMENT = 'search_refinement',
  ABANDONMENT = 'search_abandonment',
  PAGINATION = 'search_pagination',
  ZERO_RESULTS = 'search_zero_results',
  SUGGESTION_CLICK = 'search_suggestion_click'
}

// Utility function to send analytics events
const sendAnalyticsEvent = (
  eventType: SearchAnalyticsEventType,
  eventData: Record<string, any>
) => {
  // In a real implementation, this would connect to an analytics service
  // For now, we'll just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Search Analytics] ${eventType}:`, eventData);
  }
  
  // In production, this would send data to an analytics endpoint
  // Example implementation:
  // if (typeof window !== 'undefined') {
  //   fetch('/api/v1/analytics/event', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ 
  //       eventType, 
  //       eventData,
  //       timestamp: new Date().toISOString(),
  //       sessionId: getSessionId()
  //     }),
  //   }).catch(err => console.error('Failed to send analytics event:', err));
  // }
};

/**
 * Track a search query execution
 */
export const trackSearchQuery = (
  query: string,
  resultCount: number,
  filters?: SearchFilters,
  executionTimeMs?: number
) => {
  sendAnalyticsEvent(SearchAnalyticsEventType.QUERY, {
    query,
    resultCount,
    filters: filters || {},
    executionTimeMs,
    timestamp: new Date().toISOString()
  });
  
  // Track zero results separately for easier analysis
  if (resultCount === 0) {
    sendAnalyticsEvent(SearchAnalyticsEventType.ZERO_RESULTS, {
      query,
      filters: filters || {},
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Track when a user clicks on a search result
 */
export const trackResultClick = (
  query: string,
  result: SearchResult,
  position: number
) => {
  sendAnalyticsEvent(SearchAnalyticsEventType.RESULT_CLICK, {
    query,
    resultId: result.id,
    resultType: result.type,
    position,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track when a user changes search filters
 */
export const trackFilterChange = (
  query: string,
  previousFilters: SearchFilters,
  newFilters: SearchFilters
) => {
  sendAnalyticsEvent(SearchAnalyticsEventType.FILTER_CHANGE, {
    query,
    previousFilters,
    newFilters,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track when a user refines their search query
 */
export const trackSearchRefinement = (
  originalQuery: string,
  refinedQuery: string
) => {
  sendAnalyticsEvent(SearchAnalyticsEventType.REFINEMENT, {
    originalQuery,
    refinedQuery,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track when a user abandons a search (leaves page without clicking results)
 */
export const trackSearchAbandonment = (
  query: string,
  durationMs: number
) => {
  sendAnalyticsEvent(SearchAnalyticsEventType.ABANDONMENT, {
    query,
    durationMs,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track when a user changes the result page
 */
export const trackPagination = (
  query: string,
  fromPage: number,
  toPage: number
) => {
  sendAnalyticsEvent(SearchAnalyticsEventType.PAGINATION, {
    query,
    fromPage,
    toPage,
    timestamp: new Date().toISOString()
  });
};

/**
 * Track when a user clicks on a search suggestion
 */
export const trackSuggestionClick = (
  query: string,
  suggestionText: string,
  suggestionType: string,
  position: number
) => {
  sendAnalyticsEvent(SearchAnalyticsEventType.SUGGESTION_CLICK, {
    query,
    suggestionText,
    suggestionType,
    position,
    timestamp: new Date().toISOString()
  });
};

// Export a unified analytics API
export const searchAnalytics = {
  trackQuery: trackSearchQuery,
  trackResultClick,
  trackFilterChange,
  trackSearchRefinement,
  trackSearchAbandonment,
  trackPagination,
  trackSuggestionClick
};

export default searchAnalytics;
