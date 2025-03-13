'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReferralCodeDisplay } from './ReferralCodeDisplay';
import { SocialSharing } from './SocialSharing';
import { ReferralDashboard } from './ReferralDashboard';
import { ReferralsList } from './ReferralsList';
import { CampaignSelector } from './CampaignSelector';
import { SocialChannel } from '@/hooks/useReferral';

/**
 * Main referral system page component that combines all referral features
 */
export function ReferralPage() {
  const [activeTab, setActiveTab] = useState('share');
  
  // Handle share completion
  const handleShareComplete = (result: { success: boolean; channel: SocialChannel }) => {
    console.log('Share completed:', result);
    // Could trigger analytics event or show feedback
  };
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-lg text-neutral-600">
          Invite friends to join Success Kid and earn rewards when they sign up and participate
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="share">Share & Invite</TabsTrigger>
          <TabsTrigger value="dashboard">Performance</TabsTrigger>
          <TabsTrigger value="referrals">Your Referrals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="share" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ReferralCodeDisplay displayQrCode={true} />
              <CampaignSelector />
            </div>
            <div>
              <SocialSharing 
                showCustomMessage={true} 
                onShareComplete={handleShareComplete}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="dashboard">
          <ReferralDashboard />
        </TabsContent>
        
        <TabsContent value="referrals">
          <ReferralsList showPagination={true} limit={10} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
