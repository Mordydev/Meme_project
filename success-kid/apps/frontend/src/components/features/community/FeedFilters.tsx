'use client';

import React from 'react';
import { FeedType } from '@/types/community';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedFiltersProps {
  activeFeedType: FeedType;
  onChangeFeedType: (feedType: FeedType) => void;
  className?: string;
}

export function FeedFilters({ 
  activeFeedType, 
  onChangeFeedType,
  className
}: FeedFiltersProps) {
  return (
    <Card className={className}>
      <CardContent className="p-3">
        <Tabs 
          value={activeFeedType} 
          onValueChange={(value) => onChangeFeedType(value as FeedType)}
          className="w-full"
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
      </CardContent>
    </Card>
  );
}
