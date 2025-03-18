/**
 * Category View Page
 * 
 * Displays a category with its threads
 */
import React from 'react';
import { CategoryView } from '@/components/features/community';
import { RealTimeUpdates } from '@/components/features/community/RealTimeUpdates';
import { Metadata } from 'next';

interface CategoryViewPageProps {
  params: {
    id: string;
  };
}

// Generate metadata based on the category id
export async function generateMetadata({ params }: CategoryViewPageProps): Promise<Metadata> {
  // This would ideally fetch the category title from the API, but for now we'll use a generic title
  return {
    title: `Category | Success Kid Community`,
    description: 'Browse threads and discussions in this category.',
  };
}

export default function CategoryViewPage({ params }: CategoryViewPageProps) {
  const { id } = params;
  
  return (
    <div className="container mx-auto py-8">
      <CategoryView categoryId={id} />
      <RealTimeUpdates categoryId={id} />
    </div>
  );
}
