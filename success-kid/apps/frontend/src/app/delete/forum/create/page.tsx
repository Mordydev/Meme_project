/**
 * Create Thread Page
 * 
 * Allows users to create a new discussion thread
 */
import React from 'react';
import { ThreadCreate } from '@/components/features/community';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Thread | Success Kid Community',
  description: 'Start a new discussion thread in the Success Kid community forums.',
};

// This page requires authentication, which will be handled by the ThreadCreate component
export default function CreateThreadPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const preselectedCategoryId = searchParams.category;
  
  return (
    <div className="container mx-auto py-8">
      <ThreadCreate preselectedCategoryId={preselectedCategoryId} />
    </div>
  );
}
