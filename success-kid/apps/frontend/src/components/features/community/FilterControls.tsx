'use client';

import React, { useState } from 'react';
import { FeedType } from '@/types/community';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, Users, ChevronDown, Filter, X } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FilterControlsProps {
  activeFeedType: FeedType;
  onChangeFeedType: (feedType: FeedType) => void;
  className?: string;
}

type TimeFrame = 'today' | 'week' | 'month' | 'all';
type ContentType = 'all' | 'text' | 'image' | 'link' | 'poll';

export function FilterControls({ 
  activeFeedType, 
  onChangeFeedType,
  className
}: FilterControlsProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all');
  const [contentType, setContentType] = useState<ContentType>('all');
  
  // Count active filters (excluding "all" values)
  const activeFilterCount = [
    timeFrame !== 'all',
    contentType !== 'all'
  ].filter(Boolean).length;
  
  // Helper to get time frame label
  const getTimeFrameLabel = (tf: TimeFrame) => {
    switch (tf) {
      case 'today': return 'Today';
      case 'week': return 'This week';
      case 'month': return 'This month';
      case 'all': return 'All time';
    }
  };
  
  // Helper to get content type label
  const getContentTypeLabel = (ct: ContentType) => {
    switch (ct) {
      case 'all': return 'All content';
      case 'text': return 'Text posts';
      case 'image': return 'Image posts';
      case 'link': return 'Link posts';
      case 'poll': return 'Polls';
    }
  };
  
  // Helper to reset all filters
  const resetFilters = () => {
    setTimeFrame('all');
    setContentType('all');
  };
  
  return (
    <Card className={className}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <Tabs 
            value={activeFeedType} 
            onValueChange={(value) => onChangeFeedType(value as FeedType)}
            className="flex-1"
          >
            <TabsList className="w-full">
              <TabsTrigger value="latest" className="flex-1 gap-1.5">
                <Clock size={16} />
                <span className="hidden sm:inline">Latest</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex-1 gap-1.5">
                <TrendingUp size={16} />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
              <TabsTrigger value="following" className="flex-1 gap-1.5">
                <Users size={16} />
                <span className="hidden sm:inline">Following</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Advanced filters dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "ml-auto px-2.5 h-9",
                  activeFilterCount > 0 && "bg-primary/10"
                )}
              >
                <Filter className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge 
                    className="ml-1.5 px-1.5 h-5 min-w-5" 
                    variant="default"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Time Frame Filter */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Time Frame
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup 
                value={timeFrame} 
                onValueChange={(value) => setTimeFrame(value as TimeFrame)}
              >
                <DropdownMenuRadioItem value="all">All time</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="week">This week</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="month">This month</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              
              <DropdownMenuSeparator />
              
              {/* Content Type Filter */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Content Type
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup 
                value={contentType} 
                onValueChange={(value) => setContentType(value as ContentType)}
              >
                <DropdownMenuRadioItem value="all">All content</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="text">Text posts</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="image">Image posts</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="link">Link posts</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="poll">Polls</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              
              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="w-full justify-start text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset all filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              Active filters:
            </span>
            
            {timeFrame !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1">
                {getTimeFrameLabel(timeFrame)}
                <button
                  onClick={() => setTimeFrame('all')}
                  className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-muted-foreground/20"
                >
                  <X className="h-2.5 w-2.5" />
                  <span className="sr-only">Remove filter</span>
                </button>
              </Badge>
            )}
            
            {contentType !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1">
                {getContentTypeLabel(contentType)}
                <button
                  onClick={() => setContentType('all')}
                  className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-muted-foreground/20"
                >
                  <X className="h-2.5 w-2.5" />
                  <span className="sr-only">Remove filter</span>
                </button>
              </Badge>
            )}
            
            <button
              onClick={resetFilters}
              className="text-xs text-muted-foreground hover:text-foreground ml-auto"
            >
              Reset all
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
