/**
 * Forum View Page
 * 
 * Displays a single forum with its categories
 */
import React from 'react';
import { ForumView } from '@/components/features/community';
import { Metadata } from 'next';

interface ForumViewPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata based on the slug
export async function generateMetadata({ params }: ForumViewPageProps): Promise<Metadata> {
  // This would ideally fetch the forum title from the API, but for now we'll use a generic title
  return {
    title: `Forum | Success Kid Community`,
    description: 'Browse categories and discussions in this forum.',
  };
}

export default function ForumViewPage({ params }: ForumViewPageProps) {
  const { slug } = params;
  
  return (
    <div className="container mx-auto py-8">
      <ForumView slug={slug} />
    </div>
  );
}
