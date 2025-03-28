'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { AdvancedSearch } from '@/components/features/search/AdvancedSearch';
import { SearchProvider } from '@/components/features/search/SearchProvider';
import { SearchFilters } from '@/hooks/search';

export default function AdvancedSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  // Parse filters from URL parameters
  const filters: SearchFilters = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter[') && key.endsWith(']')) {
      const filterName = key.slice(7, -1);
      filters[filterName] = value;
    }
  });
  
  return (
    <SearchProvider initialQuery={query} initialFilters={filters}>
      <div className="container mx-auto py-6">
        <AdvancedSearch initialQuery={query} initialFilters={filters} />
      </div>
    </SearchProvider>
  );
}
