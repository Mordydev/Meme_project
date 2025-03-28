'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { DashboardHeader } from '@/components/layout';
import { 
  CategoryBrowser,
  FeedContainer,
  CategoryList
} from '@/components/features/community';
import { ContentFeedType } from '@/types';
import { useCategories } from '@/hooks/queries/useCommunity';

/**
 * Community Page - Main hub for community discussions and content
 */
export default function CommunityPage() {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [feedType, setFeedType] = useState<ContentFeedType>('latest');
  const { data: categories = [] } = useCategories();
  
  // Find selected category from the id
  const selectedCategory = selectedCategoryId 
    ? categories.find(c => c.id === selectedCategoryId) 
    : undefined;
  
  // Handle create post button click
  const handleCreatePost = () => {
    router.push(`/community/create${selectedCategoryId ? `?category=${selectedCategoryId}` : ''}`);
  };
  
  return (
    <PageLayout>
      <DashboardHeader 
        title="Community" 
        description="Connect with fellow Success Kid members"
        action={
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={handleCreatePost}
          >
            Create Post
          </button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {/* Sidebar with categories */}
        <div className="md:col-span-1">
          <div className="border rounded-lg p-4 bg-card sticky top-24">
            <h2 className="font-semibold mb-4">Categories</h2>
            
            {/* Desktop: Full category browser */}
            <div className="hidden md:block">
              <CategoryBrowser 
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
              />
            </div>
            
            {/* Mobile: Simplified category list */}
            <div className="md:hidden">
              <CategoryList 
                categories={categories}
                selectedId={selectedCategoryId}
                onCategorySelect={setSelectedCategoryId}
                compact={true}
                limit={6}
              />
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="md:col-span-3">
          <FeedContainer 
            initialFeedType={feedType}
            categoryId={selectedCategoryId}
            category={selectedCategory}
            onCreatePost={handleCreatePost}
          />
        </div>
      </div>
    </PageLayout>
  );
}
