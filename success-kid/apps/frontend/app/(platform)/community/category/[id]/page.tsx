'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { 
  CategoryHeader,
  FeedContainer,
  CategoryList
} from '@/components/features/community';
import { ContentFeedType } from '@/types';
import { useCategories } from '@/hooks/queries/useCommunity';

interface CategoryPageProps {
  params: {
    id: string;
  };
}

/**
 * Category Detail Page - Shows posts from a specific category
 */
export default function CategoryPage({ params }: CategoryPageProps) {
  const router = useRouter();
  const { id } = params;
  const [feedType, setFeedType] = useState<ContentFeedType>('latest');
  
  // Fetch all categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  
  // Find the current category
  const category = categories.find(c => c.id === id);
  
  // If category not found after loading, redirect to main community page
  useEffect(() => {
    if (!isCategoriesLoading && !category) {
      router.push('/community');
    }
  }, [isCategoriesLoading, category, router]);
  
  // Handle create post button click
  const handleCreatePost = () => {
    router.push(`/community/create?category=${id}`);
  };
  
  // If category is not loaded yet, show loading state
  if (isCategoriesLoading || !category) {
    return (
      <PageLayout>
        <div className="py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      {/* Category header */}
      <CategoryHeader 
        category={category}
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
            
            <CategoryList 
              categories={categories}
              selectedId={id}
              onCategorySelect={(categoryId) => router.push(`/community/category/${categoryId}`)}
              compact={true}
            />
          </div>
        </div>
        
        {/* Main content area */}
        <div className="md:col-span-3">
          <FeedContainer 
            initialFeedType={feedType}
            categoryId={id}
            category={category}
            onCreatePost={handleCreatePost}
          />
        </div>
      </div>
    </PageLayout>
  );
}
