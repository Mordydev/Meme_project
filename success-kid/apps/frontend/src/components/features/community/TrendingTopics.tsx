'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, TrendingUp, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingTopic {
  id: string;
  name: string;
  postCount: number;
  trending: 'up' | 'stable' | 'down';
  growthPercent?: number;
}

interface TrendingTopicsProps {
  className?: string;
}

// Mock trending topics data
const mockTrendingTopics: TrendingTopic[] = [
  { id: 'topic_1', name: 'Token Price', postCount: 120, trending: 'up', growthPercent: 24 },
  { id: 'topic_2', name: 'Success Stories', postCount: 85, trending: 'up', growthPercent: 15 },
  { id: 'topic_3', name: 'Marketplace', postCount: 64, trending: 'stable' },
  { id: 'topic_4', name: 'Tokenomics', postCount: 48, trending: 'up', growthPercent: 8 },
  { id: 'topic_5', name: 'Achievements', postCount: 36, trending: 'down', growthPercent: 3 },
  { id: 'topic_6', name: 'Platform Updates', postCount: 28, trending: 'up', growthPercent: 31 },
  { id: 'topic_7', name: 'Referral Program', postCount: 22, trending: 'stable' },
  { id: 'topic_8', name: 'Points System', postCount: 19, trending: 'up', growthPercent: 12 },
];

export function TrendingTopics({ className }: TrendingTopicsProps) {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch trending topics
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsLoading(true);
        // This would be an API call in a real implementation
        // const response = await fetch('/api/trending-topics');
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          setTopics(mockTrendingTopics);
          setIsLoading(false);
        }, 600);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
        setIsLoading(false);
      }
    };
    
    fetchTopics();
  }, []);
  
  // Check scroll capabilities
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };
  
  // Check scroll on mount and when topics change
  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [topics]);
  
  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  
  // Handle topic click
  const handleTopicClick = (topicId: string) => {
    if (activeTopicId === topicId) {
      setActiveTopicId(null); // Deselect if already active
    } else {
      setActiveTopicId(topicId);
    }
    
    // In a real implementation, this would filter the content feed
    // navigation.push(`/community?topic=${topicId}`);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    // In a real implementation, this would re-fetch the trending topics
    setTimeout(() => {
      // Simulate shuffling the topics to show refreshed data
      setTopics([...mockTrendingTopics].sort(() => Math.random() - 0.5));
      setIsLoading(false);
    }, 600);
  };
  
  return (
    <Card className={className}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Trending Topics</h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-xs"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn(
              "h-3.5 w-3.5 mr-1",
              isLoading && "animate-spin"
            )} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        
        <div className="relative">
          {/* Scroll indicators */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 flex items-center z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={scrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Scroll left</span>
              </Button>
            </div>
          )}
          
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={scrollRight}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Scroll right</span>
              </Button>
            </div>
          )}
          
          {/* Scrollable topic container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-2 py-1 pl-0.5 pr-0.5 max-w-full scrollbar-hide scroll-smooth snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={checkScroll}
          >
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-8 w-28 flex-shrink-0 rounded-full"
                />
              ))
            ) : (
              // Actual topics
              topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className={cn(
                    "flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors snap-start",
                    "border flex items-center gap-1.5 hover:bg-muted",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30",
                    activeTopicId === topic.id
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "bg-background border-border"
                  )}
                >
                  <span>{topic.name}</span>
                  {topic.trending === 'up' && (
                    <span className={cn(
                      "text-xs px-1.5 rounded flex items-center",
                      activeTopicId === topic.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    )}>
                      +{topic.growthPercent}%
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
