'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReferralStore, ReferralCampaign } from '@/store/useReferralStore';
import { toast } from '@/components/ui/toast';

interface CampaignSelectorProps {
  className?: string;
}

export function CampaignSelector({ className }: CampaignSelectorProps) {
  const { 
    campaigns,
    selectedCampaign,
    campaignReferralLink,
    fetchCampaigns,
    selectCampaign,
    isCampaignsLoading 
  } = useReferralStore();
  
  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);
  
  // Handle campaign selection
  const handleSelectCampaign = async (campaignId: string) => {
    await selectCampaign(campaignId);
  };
  
  // Handle copying campaign link
  const handleCopyLink = async () => {
    if (!campaignReferralLink) return;
    
    try {
      await navigator.clipboard.writeText(campaignReferralLink);
      toast({
        title: 'Link copied!',
        description: 'Campaign referral link copied to clipboard',
        variant: 'success',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'error',
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Check if campaign is active
  const isCampaignActive = (campaign: ReferralCampaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    return now >= start && now <= end;
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Referral Campaigns</CardTitle>
        <CardDescription>Special promotions with bonus rewards for referrals</CardDescription>
      </CardHeader>
      <CardContent>
        {isCampaignsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 w-full animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No active referral campaigns at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Campaign Preview */}
            {selectedCampaign && (
              <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-primary">{selectedCampaign.name}</h4>
                    <p className="text-sm text-primary-700">{selectedCampaign.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary-700">
                      Bonus: {selectedCampaign.bonusReward} points
                    </p>
                  </div>
                </div>
                
                {campaignReferralLink && (
                  <div className="mt-3">
                    <div className="relative mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 py-2 px-3 text-sm shadow-sm"
                        value={campaignReferralLink}
                        readOnly
                        aria-label="Campaign referral link"
                      />
                      <Button 
                        className="absolute inset-y-0 right-0 rounded-l-none" 
                        onClick={handleCopyLink}
                        size="sm"
                        variant="primary"
                        aria-label="Copy campaign link to clipboard"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Campaigns List */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Available Campaigns</h4>
              
              {campaigns.map((campaign) => {
                const isActive = isCampaignActive(campaign);
                const isSelected = selectedCampaign?.id === campaign.id;
                
                return (
                  <div 
                    key={campaign.id}
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      isSelected ? "border-primary bg-primary-50" : "hover:bg-gray-50",
                      !isActive && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{campaign.name}</h5>
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <p className="font-medium">+{campaign.bonusReward}</p>
                          <p className="text-xs text-gray-600">Bonus Points</p>
                        </div>
                        
                        <Button
                          variant={isSelected ? "primary" : "outline"}
                          size="sm"
                          onClick={() => handleSelectCampaign(campaign.id)}
                          disabled={!isActive || isCampaignsLoading}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
