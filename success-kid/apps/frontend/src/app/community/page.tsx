/**
 * Community Page
 * 
 * Main community page showing dashboard and activities
 */
import React from 'react';
import { CommunityDashboard } from '@/components/features/community';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community | Success Kid',
  description: 'Join the Success Kid community, participate in discussions, and earn rewards for your contributions.',
};

export default function CommunityPage() {
  return (
    <div className="container mx-auto py-8">
      <CommunityDashboard />
      
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Join the Conversation</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Our community is a place to connect, share ideas, and earn rewards. 
          Start or join discussions, participate in polls, and become part of the Success Kid ecosystem.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="font-bold mb-2">Share Your Ideas</h3>
            <p className="text-sm text-muted-foreground">
              Create threads, share insights, and ask questions in our community forums.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="font-bold mb-2">Earn Points</h3>
            <p className="text-sm text-muted-foreground">
              Get rewarded for your contributions with points that can be redeemed for tokens.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="font-bold mb-2">Build Your Reputation</h3>
            <p className="text-sm text-muted-foreground">
              Gain recognition in the community and climb the leaderboards with quality contributions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
