'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { 
  CategoryNavigation, 
  ContentFeed, 
  TrendingTopics, 
  UserSuggestions, 
  CreatePostButton,
  FilterControls,
  FloatingCreateButton,
  RealTimeUpdates
} from '@/components/features/community';
import { FeedType } from '@/types/community';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get initial state from URL parameters
  const initialCategoryId = searchParams.get('category') || undefined;
  const initialFeedType = (searchParams.get('feed') as FeedType) || 'latest';
  
  // Handler functions to update URL params
  const handleCategoryChange = (categoryId?: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    router.push(`/community?${params.toString()}`);
  };
  
  const handleFeedTypeChange = (feedType: FeedType) => {
    const params = new URLSearchParams(searchParams);
    params.set('feed', feedType);
    router.push(`/community?${params.toString()}`);
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Community"
        description="Discover, engage, and earn rewards through community participation"
        action={<CreatePostButton />}
      />
      
      {/* Main content area */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="space-y-6">
            <CategoryNavigation
              initialSelectedId={initialCategoryId}
              onSelectCategory={handleCategoryChange}
            />
            
            <UserSuggestions />
          </div>
        </div>
        
        {/* Main feed */}
        <div className="lg:col-span-9 order-1 lg:order-2">
          <div className="space-y-6">
            {/* Trending topics */}
            <TrendingTopics />
            
            {/* Feed filters */}
            <FilterControls 
              activeFeedType={initialFeedType}
              onChangeFeedType={handleFeedTypeChange}
            />
            
            {/* Content feed */}
            <ContentFeed 
              initialCategoryId={initialCategoryId}
              initialFeedType={initialFeedType}
            />
          </div>
        </div>
      </div>
      
      {/* Floating create button - only visible on mobile/tablet */}
      <FloatingCreateButton className="lg:hidden" />
      
      {/* Real-time updates component */}
      <RealTimeUpdates
        categoryId={initialCategoryId}
        onPostCreated={() => router.refresh()}
      />
    </div>
  );
}
