# Search and Discovery Feature

This directory contains the components, hooks, and utilities for the Success Kid platform's search and discovery functionality.

## Features Overview

1. **Global Search**: Site-wide search with real-time suggestions
2. **Advanced Search**: Multi-parameter search with filters
3. **Discovery Feed**: Personalized content recommendations
4. **User Recommendations**: Suggested users based on activity and interests
5. **Category Explorer**: Browse content by topic and category
6. **Search Analytics**: Track search usage for optimization

## Component Architecture

The search feature follows a layered architecture:

1. **Data Layer**: Custom hooks for search data management
2. **State Management**: Context provider for search state
3. **UI Components**: Reusable, composable UI elements
4. **Page Components**: Full-page implementations

## Main Components

- `GlobalSearch`: Main search interface with suggestions
- `SearchResults`: Display search results with filtering
- `DiscoveryFeed`: Content recommendation feed
- `AdvancedSearch`: Complex search with multiple parameters
- `UserRecommendations`: Suggested user profiles
- `CategoryExplorer`: Topic browsing interface

## Usage

### Basic Search Bar

```jsx
import { SearchBar } from '@/components/features/search';

<SearchBar 
  placeholder="Search..." 
  onSearch={(query) => console.log(`Searching for: ${query}`)} 
/>
```

### Global Search with Context

```jsx
import { GlobalSearch } from '@/components/features/search';

<GlobalSearch 
  autoFocus={true} 
  showShortcuts={true} 
/>
```

### Search Results with Filtering

```jsx
import { SearchResults, FilterPanel } from '@/components/features/search';
import { useSearchResults, useSearchFilters } from '@/hooks/search';

// Inside component
const { results, totalResults, isLoading } = useSearchResults("your query");
const { filterDefinitions, activeFilters, setActiveFilters } = useSearchFilters();

return (
  <div className="grid grid-cols-4">
    <div className="col-span-1">
      <FilterPanel
        filterDefinitions={filterDefinitions}
        activeFilters={activeFilters}
        onFilterChange={setActiveFilters}
      />
    </div>
    <div className="col-span-3">
      <SearchResults
        results={results}
        totalResults={totalResults}
        query={"your query"}
        isLoading={isLoading}
      />
    </div>
  </div>
);
```

### Discovery Feed

```jsx
import { DiscoveryFeed } from '@/components/features/search';

<DiscoveryFeed 
  interests={['crypto', 'community']} 
  limit={5} 
/>
```

## Data Flow

1. User enters a search query
2. Query is processed through hooks (debounced)
3. API request is made to search endpoints
4. Results are rendered with pagination and filtering
5. Analytics are captured for search quality improvement

## Keyboard Accessibility

- Search bar: `Enter` to submit search
- Suggestions: `Arrow Up/Down` to navigate, `Enter` to select
- Results: `Tab` navigates through results
- Filters: All form controls accessible via keyboard

## Analytics

The search feature includes comprehensive analytics tracking to improve search quality:

- Search queries
- Result clicks
- Filter usage
- Search refinements
- Zero-result searches
- Session abandonment

## Extensibility

The search system is designed for extensibility:

- New filter types can be added with minimal changes
- Search suggestions from different sources can be incorporated
- Recommendation algorithms can be adjusted without UI changes
- Analytics can be extended for additional metrics

## Future Improvements

1. Query understanding with natural language processing
2. Personalized ranking based on user behavior
3. Voice search integration
4. Enhanced content preview in search results
5. Multi-language search support