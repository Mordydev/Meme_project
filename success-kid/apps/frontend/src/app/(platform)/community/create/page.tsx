'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ContentType } from '@/types';
import { EnhancedCreationContainer } from '@/components/features/community/ContentCreation/EnhancedCreationContainer';
import { DraftManager } from '@/components/features/community/ContentCreation/DraftManager';

/**
 * Enhanced content creation page
 */
export default function CreateContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract initial content type and category from query params if present
  const initialType = (searchParams.get('type') as ContentType) || 'text';
  const initialCategoryId = searchParams.get('category') || '';
  const draftId = searchParams.get('draft') || undefined;
  
  // Handle successful publication
  const handlePublish = (postId: string) => {
    // Redirect to the new post
    router.push(`/community/post/${postId}`);
  };
  
  // Handle cancellation
  const handleCancel = () => {
    // Go back to previous page or community home
    router.back();
  };
  
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      <div className="bg-card rounded-md shadow-sm overflow-hidden">
        <div className="p-6">
          <DraftManager>
            <EnhancedCreationContainer 
              initialType={initialType}
              categoryId={initialCategoryId}
              onPublish={handlePublish}
              onCancel={handleCancel}
              draftId={draftId}
            />
          </DraftManager>
        </div>
      </div>
    </div>
  );
}
