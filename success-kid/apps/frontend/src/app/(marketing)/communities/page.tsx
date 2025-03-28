'use client';

import React from 'react';
import { 
  CommunityHero, 
  EngagementFlowVisualization, 
  RewardsSystemDemo, 
  CommunityContributors, 
  CommunityChannels 
} from '@/components/marketing/community';

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <CommunityHero />
      
      {/* How It Works Section */}
      <EngagementFlowVisualization />
      
      {/* Rewards System Demo Section */}
      <RewardsSystemDemo />
      
      {/* Community Contributors Section */}
      <CommunityContributors />
      
      {/* Community Channels Section */}
      <CommunityChannels />
    </div>
  );
}
