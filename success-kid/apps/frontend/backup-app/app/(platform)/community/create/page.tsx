'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { DashboardHeader } from '@/components/layout';
import { CreationContainer } from '@/components/features/community';
import { ContentType } from '@/types';

/**
 * Post Creation Page - Interface for creating new community content
 */
export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get query parameters for initial state
  const initialType = (searchParams.get('type') as ContentType) || 'text';
  const initialCategory = searchParams.get('category') || '';
  
  // Handle cancel button
  const handleCancel = () => {
    router.back();
  };
  
  // Handle successful post creation
  const handlePublish = (postId: string) => {
    router.push(`/community/post/${postId}`);
  };
  
  return (
    <PageLayout>
      <DashboardHeader 
        title="Create Post" 
        description="Share your thoughts with the community"
        action={
          <button 
            className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
            onClick={handleCancel}
          >
            Cancel
          </button>
        }
      />
      
      <div className="mt-6">
        <CreationContainer 
          initialType={initialType}
          categoryId={initialCategory}
          onPublish={handlePublish}
          onCancel={handleCancel}
        />
      </div>
    </PageLayout>
  );
}
