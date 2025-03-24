/**
 * Forum Page
 * 
 * Main entry point for the forum section displaying available forums
 */
import React from 'react';
import { ForumList } from '@/components/features/community';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Forums | Success Kid',
  description: 'Join the Success Kid community discussion forums to connect with other members, share ideas, and earn rewards.',
};

export default function ForumPage() {
  return (
    <div className="container mx-auto py-8">
      <ForumList />
    </div>
  );
}
