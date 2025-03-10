'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface FeedFiltersProps {
  currentFilter: string;
  currentSort: 'recent' | 'popular';
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: 'recent' | 'popular') => void;
}

export function FeedFilters({
  currentFilter,
  currentSort,
  onFilterChange,
  onSortChange,
}: FeedFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-zinc-800/30 rounded-lg">
      <Tabs value={currentFilter} onValueChange={onFilterChange} className="w-full sm:w-auto">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="all" className="text-sm">All</TabsTrigger>
          <TabsTrigger value="battles" className="text-sm">Battles</TabsTrigger>
          <TabsTrigger value="media" className="text-sm">Media</TabsTrigger>
          <TabsTrigger value="discussion" className="text-sm">Discussion</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          variant={currentSort === 'recent' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 sm:flex-auto"
          onClick={() => onSortChange('recent')}
        >
          Recent
        </Button>
        <Button
          variant={currentSort === 'popular' ? 'default' : 'outline'} 
          size="sm"
          className="flex-1 sm:flex-auto"
          onClick={() => onSortChange('popular')}
        >
          Popular
        </Button>
      </div>
    </div>
  );
}
