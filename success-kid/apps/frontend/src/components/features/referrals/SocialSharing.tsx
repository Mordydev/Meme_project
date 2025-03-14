'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

// Define social channel types
export type SocialChannel = 'twitter' | 'facebook' | 'telegram' | 'whatsapp' | 'email' | 'copy';

interface ChannelConfig {
  name: string;
  color: string;
  hoverColor: string;
  icon: string; // Would be a React component in a real implementation
  shareUrl: (link: string, message: string) => string;
}

// Channel configuration for different social platforms
const CHANNELS: Record<SocialChannel, ChannelConfig> = {
  twitter: {
    name: 'Twitter',
    color: 'bg-[#1DA1F2] text-white',
    hoverColor: 'hover:bg-[#0c85d0]',
    icon: 'Twitter',
    shareUrl: (link, message) => 
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`,
  },
  facebook: {
    name: 'Facebook',
    color: 'bg-[#4267B2] text-white',
    hoverColor: 'hover:bg-[#365899]',
    icon: 'Facebook',
    shareUrl: (link, message) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(message)}`,
  },
  telegram: {
    name: 'Telegram',
    color: 'bg-[#0088cc] text-white',
    hoverColor: 'hover:bg-[#0077b3]',
    icon: 'Telegram',
    shareUrl: (link, message) => 
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`,
  },
  whatsapp: {
    name: 'WhatsApp',
    color: 'bg-[#25D366] text-white',
    hoverColor: 'hover:bg-[#20bd5a]',
    icon: 'WhatsApp',
    shareUrl: (link, message) => 
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${message} ${link}`)}`,
  },
  email: {
    name: 'Email',
    color: 'bg-gray-500 text-white',
    hoverColor: 'hover:bg-gray-600',
    icon: 'Email',
    shareUrl: (link, message) => 
      `mailto:?subject=Join me on Success Kid&body=${encodeURIComponent(`${message}\n\n${link}`)}`,
  },
  copy: {
    name: 'Copy Link',
    color: 'bg-gray-700 text-white',
    hoverColor: 'hover:bg-gray-800',
    icon: 'Copy',
    shareUrl: (link) => link,
  },
};

interface SocialSharingProps {
  referralLink: string;
  className?: string;
  defaultMessage?: string;
  availableChannels?: SocialChannel[];
  onShare?: (channel: SocialChannel) => void;
}

export function SocialSharing({
  referralLink,
  className,
  defaultMessage = "Join me on the Success Kid Community Platform! Sign up with my referral link to get a bonus:",
  availableChannels = ['twitter', 'facebook', 'telegram', 'whatsapp', 'email', 'copy'],
  onShare,
}: SocialSharingProps) {
  const [customMessage, setCustomMessage] = useState(defaultMessage);
  
  // Handle sharing via a specific channel
  const handleShare = (channel: SocialChannel) => {
    // For copy channel, just copy to clipboard
    if (channel === 'copy') {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          toast({
            title: 'Link copied!',
            description: 'Referral link copied to clipboard',
            variant: 'success',
          });
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          toast({
            title: 'Copy failed',
            description: 'Unable to copy to clipboard',
            variant: 'error',
          });
        });
      
      if (onShare) onShare(channel);
      return;
    }
    
    // For other channels, open share URL
    const channelConfig = CHANNELS[channel];
    const shareUrl = channelConfig.shareUrl(referralLink, customMessage);
    
    // Track sharing event if callback provided
    if (onShare) onShare(channel);
    
    // Open share URL in new window
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Share Your Referral</CardTitle>
        <CardDescription>Customize your message and share via your favorite platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="share-message" className="block text-sm font-medium text-gray-700">
              Customize Your Message
            </label>
            <textarea
              id="share-message"
              name="share-message"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Write a custom message to share with your referral link"
              aria-label="Customize your referral message"
            />
          </div>
          
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Share via</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {availableChannels.map((channel) => {
                const { name, color, hoverColor, icon } = CHANNELS[channel];
                return (
                  <Button
                    key={channel}
                    variant="outline"
                    className={cn("flex flex-col items-center justify-center p-3 transition-colors", color, hoverColor)}
                    onClick={() => handleShare(channel)}
                    aria-label={`Share via ${name}`}
                  >
                    <span className="text-xs font-medium">{name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
