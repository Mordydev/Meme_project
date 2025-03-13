'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useReferral, SocialChannel } from '@/hooks/useReferral';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SocialSharingProps {
  className?: string;
  showCustomMessage?: boolean;
  onShareComplete?: (result: { success: boolean; channel: SocialChannel }) => void;
}

/**
 * Component for sharing referral links across multiple social channels
 */
export function SocialSharing({
  className,
  showCustomMessage = false,
  onShareComplete,
}: SocialSharingProps) {
  const { 
    getDefaultShareMessage, 
    shareToChannel, 
    isWebShareAvailable, 
    shareWithNative, 
    isLoading 
  } = useReferral();
  
  const [customMessage, setCustomMessage] = useState<string>(getDefaultShareMessage());
  const [selectedChannel, setSelectedChannel] = useState<SocialChannel | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Available social media channels with icons and labels
  const channels: { id: SocialChannel; label: string; icon: string }[] = [
    { id: 'copy', label: 'Copy Link', icon: '📋' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'twitter', label: 'Twitter', icon: '🐦' },
    { id: 'facebook', label: 'Facebook', icon: 'ƒ' },
    { id: 'telegram', label: 'Telegram', icon: '📱' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'ℹ️' },
  ];

  /**
   * Handle sharing to a specific channel
   */
  const handleShare = async (channel: SocialChannel) => {
    setSelectedChannel(channel);
    setShareStatus('idle');
    
    try {
      const result = await shareToChannel(channel, customMessage);
      setShareStatus(result.success ? 'success' : 'error');
      onShareComplete?.(result);
    } catch (error) {
      console.error(`Error sharing to ${channel}:`, error);
      setShareStatus('error');
      onShareComplete?.({ success: false, channel });
    }
  };

  /**
   * Handle native sharing if available
   */
  const handleNativeShare = async () => {
    try {
      const result = await shareWithNative(customMessage);
      onShareComplete?.(result);
    } catch (error) {
      console.error('Error with native share:', error);
      onShareComplete?.({ success: false, channel: 'copy' });
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Share Your Referral</h3>
          <p className="text-sm text-neutral-500 mb-3">
            Choose how you'd like to share your referral with friends
          </p>
        </div>

        {showCustomMessage && (
          <div>
            <label className="block text-sm font-medium mb-2">Customize your message</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Enter your custom message..."
            />
          </div>
        )}

        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {channels.map((channel) => (
              <motion.button
                key={channel.id}
                onClick={() => handleShare(channel.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors",
                  selectedChannel === channel.id && shareStatus === 'success' && "border-success bg-success/10",
                  selectedChannel === channel.id && shareStatus === 'error' && "border-red-500 bg-red-50",
                )}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
              >
                <span className="text-2xl mb-2">{channel.icon}</span>
                <span className="text-sm">{channel.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {isWebShareAvailable() && (
          <div className="pt-4">
            <Button
              onClick={handleNativeShare}
              className="w-full"
              disabled={isLoading}
            >
              Share with Device
            </Button>
          </div>
        )}

        {selectedChannel && shareStatus === 'success' && (
          <motion.div
            className="bg-success/10 border border-success rounded-md p-3 text-success text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Successfully shared to {channels.find(c => c.id === selectedChannel)?.label}!
          </motion.div>
        )}

        {selectedChannel && shareStatus === 'error' && (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-md p-3 text-red-600 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            There was an error sharing to {channels.find(c => c.id === selectedChannel)?.label}. Please try again.
          </motion.div>
        )}
      </div>
    </Card>
  );
}
