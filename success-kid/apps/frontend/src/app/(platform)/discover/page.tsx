'use client';

import React from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DiscoveryFeed, UserRecommendations, CategoryExplorer } from '@/components/features/search';
import { GlobalSearch } from '@/components/features/search';
import { Category } from '@/types';

// Mock categories for demo purposes
// In a real implementation, this would be fetched from an API
const mockCategories: Category[] = [
  {
    id: 'general',
    name: 'General',
    description: 'General discussion about the platform',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    postCount: 256,
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Important platform updates and news',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5h2m-1-4v4M8 8h8m-5 6h2m-1 4v-4m2 2l2 2m-7-4 2 2"></path></svg>',
    postCount: 42,
  },
  {
    id: 'tokenomics',
    name: 'Tokenomics',
    description: 'Discussion about SKC tokens and rewards',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>',
    postCount: 128,
  },
  {
    id: 'memes',
    name: 'Memes & Fun',
    description: 'Memes, jokes, and fun content',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    postCount: 356,
  },
  {
    id: 'tech',
    name: 'Technology',
    description: 'Discussions about blockchain and technology',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    postCount: 183,
  },
];

export default function DiscoverPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Discover"
        description="Explore content, connect with users, and find new interests"
      />
      
      <div className="mx-auto max-w-7xl">
        <GlobalSearch
          placeholder="Search for anything..."
          fullWidth
          size="lg"
          className="mb-8"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content - Discovery Feed */}
          <div className="md:col-span-2">
            <DiscoveryFeed 
              limit={15} 
              showInterests={true}
            />
          </div>
          
          {/* Sidebar - Recommendations */}
          <div className="space-y-8">
            <UserRecommendations />
            <CategoryExplorer categories={mockCategories} />
          </div>
        </div>
      </div>
    </div>
  );
}
