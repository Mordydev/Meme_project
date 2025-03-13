'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReferral } from '@/hooks/useReferral';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CampaignSelectorProps {
  className?: string;
}

/**
 * Component to select special referral campaigns
 */
export function CampaignSelector({ className }: CampaignSelectorProps) {
  const { 
    activeCampaigns,
    selectedCampaign,
    campaignReferralLink,
    fetchActiveCampaigns,
    selectCampaign,
    isLoading
  } = useReferral();

  // Fetch active campaigns when mounted
  useEffect(() => {
    fetchActiveCampaigns();
  }, [fetchActiveCampaigns]);

  // If no campaigns are available, don't render anything
  if (!isLoading && activeCampaigns.length === 0) {
    return null;
  }

  return (
    <Card className={cn("p-6", className)}>
      <h3 className="text-lg font-semibold mb-2">Special Campaigns</h3>
      <p className="text-sm text-neutral-500 mb-4">
        Share these special campaigns to earn bonus points and rewards
      </p>
      
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-neutral-200 rounded-lg"></div>
            <div className="h-24 bg-neutral-200 rounded-lg"></div>
          </div>
        ) : (
          // Campaign cards
          <div>
            {/* Standard referral option */}
            <CampaignCard
              campaign={{
                id: 'standard',
                name: 'Standard Referral',
                description: 'Your regular referral link with standard rewards',
                startDate: '',
                endDate: '',
                bonusReward: 0,
                referrerReward: 500,
                refereeReward: 100,
                isActive: true
              }}
              isSelected={selectedCampaign === null}
              onClick={() => selectCampaign(null)}
            />
            
            {/* List all active campaigns */}
            {activeCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                isSelected={selectedCampaign?.id === campaign.id}
                onClick={() => selectCampaign(campaign.id)}
              />
            ))}
          </div>
        )}
        
        {/* Selected campaign referral link */}
        {selectedCampaign && campaignReferralLink && (
          <motion.div
            className="mt-4 pt-4 border-t"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-2">
              <span className="text-sm font-medium">Campaign Referral Link</span>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={campaignReferralLink}
                readOnly
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded p-2 text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(campaignReferralLink)}
                className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-600 text-sm"
              >
                Copy
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    description: string;
    bonusReward: number;
    referrerReward: number;
    refereeReward: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  isSelected: boolean;
  onClick: () => void;
}

function CampaignCard({ campaign, isSelected, onClick }: CampaignCardProps) {
  const isLimited = campaign.endDate && new Date(campaign.endDate) > new Date();
  
  return (
    <motion.div
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-colors mb-3",
        isSelected 
          ? "border-primary-500 bg-primary-50" 
          : "border-neutral-200 hover:bg-neutral-50"
      )}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{campaign.name}</h4>
          <p className="text-sm text-neutral-600 mt-1">{campaign.description}</p>
          
          <div className="flex flex-wrap mt-2 gap-2">
            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
              You earn: {campaign.referrerReward} SP
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              They earn: {campaign.refereeReward} SP
            </span>
            {campaign.bonusReward > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                Bonus: +{campaign.bonusReward} SP
              </span>
            )}
          </div>
        </div>
        
        {isLimited && (
          <div className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full whitespace-nowrap">
            Limited Time
          </div>
        )}
      </div>
    </motion.div>
  );
}
