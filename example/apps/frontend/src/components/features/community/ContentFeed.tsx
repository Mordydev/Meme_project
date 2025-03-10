'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { FeedFilters } from './FeedFilters';
import { ContentCard } from './ContentCard';
import { Button } from '@/components/ui/button';

export interface ContentItem {
  id: string;
  type: 'post' | 'battle' | 'image' | 'video';
  title?: string;
  body: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
  };
  tags?: string[];
  mediaUrl?: string | null;
}

interface ContentFeedProps {
  initialContent?: ContentItem[];
  initialFilter?: string;
  initialSort?: 'recent' | 'popular';
}

export function ContentFeed({
  initialContent = [],
  initialFilter = 'all',
  initialSort = 'recent',
}: ContentFeedProps) {
  const [content, setContent] = useState<ContentItem[]>(initialContent);
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState<'recent' | 'popular'>(initialSort);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });
  
  const fetchContent = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const newCursor = reset ? '' : cursor;
      const response = await fetch(`/api/content?filter=${filter}&sort=${sort}${newCursor ? `&cursor=${newCursor}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();
      const newContent = data.data;
      const newCursorValue = data.pagination?.nextCursor || null;
      
      setContent(reset ? newContent : [...content, ...newContent]);
      setCursor(newCursorValue);
      setHasMore(data.pagination?.hasMore || false);
    } catch (err) {
      setError('Failed to load content. Please try again.');
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch if no content provided
  useEffect(() => {
    if (initialContent.length === 0) {
      fetchContent(true);
    }
  }, []);
  
  // Handle filter/sort changes
  useEffect(() => {
    fetchContent(true);
  }, [filter, sort]);
  
  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchContent();
    }
  }, [inView, hasMore, loading]);
  
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };
  
  const handleSortChange = (newSort: 'recent' | 'popular') => {
    setSort(newSort);
  };
  
  return (
    <div className="space-y-6">
      <FeedFilters
        currentFilter={filter}
        currentSort={sort}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />
      
      <div className="space-y-4">
        {content.length === 0 && !loading ? (
          <div className="p-8 text-center rounded-lg bg-zinc-800/50">
            <h3 className="text-xl font-display text-hype-white mb-2">No content found</h3>
            <p className="text-zinc-400 mb-4">Be the first to drop something fire in this feed!</p>
          </div>
        ) : (
          content.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))
        )}
        
        {/* Loading and error states */}
        {loading && (
          <div className="py-4 text-center">
            <div className="animate-pulse text-battle-yellow">Loading more content...</div>
          </div>
        )}
        
        {error && (
          <div className="p-4 text-center">
            <p className="text-roast-red mb-2">{error}</p>
            <Button onClick={() => fetchContent()} variant="secondary" size="sm">
              Try Again
            </Button>
          </div>
        )}
        
        {/* Infinite scroll trigger element */}
        {hasMore && <div ref={ref} className="h-10" />}
      </div>
    </div>
  );
}
