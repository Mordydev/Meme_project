'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedGlass, EnhancedButton } from '@/components/ui';

// Community channels data
const communityChannels = [
  {
    id: 'discord',
    name: 'Discord Community',
    icon: '💬',
    color: '#5865F2', // Discord color
    description: 'Join our active Discord for real-time discussions, support, and exclusive content.',
    members: 32500,
    activity: 'Very Active',
    features: [
      'Real-time chat with community members',
      'Direct access to moderators and team',
      'Specialized channels for different topics',
      'Live events and AMAs',
      'Token announcements and updates'
    ],
    preview: [
      { user: 'Alex', message: 'Just published a new guide on staking!', time: '5m ago' },
      { user: 'ModTeam', message: 'Welcome to all our new members from today!', time: '20m ago' },
      { user: 'Sarah', message: 'Question about the redemption process...', time: '32m ago' }
    ],
    link: 'https://discord.gg/successkid',
    buttonText: 'Join Discord Server'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    color: '#1DA1F2', // Twitter blue
    description: 'Follow us on Twitter for announcements, community highlights, and market updates.',
    members: 45200,
    activity: 'Daily Updates',
    features: [
      'Official announcements and news',
      'Market updates and milestones',
      'Community content highlights',
      'Quick polls and feedback',
      'Public conversations with the team'
    ],
    preview: [
      { user: '@SuccessKid', message: 'We just reached 50,000 community members! 🎉', time: '2h ago' },
      { user: '@SuccessKid', message: 'Check out this amazing guide by @cryptoalex on token redemptions', time: '1d ago' },
      { user: '@SuccessKid', message: 'Market cap update: We\'ve reached $500K! 📈', time: '2d ago' }
    ],
    link: 'https://twitter.com/successkid',
    buttonText: 'Follow on Twitter'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '📱',
    color: '#0088cc', // Telegram color
    description: 'Join our Telegram group for mobile-friendly discussions and instant updates.',
    members: 28900,
    activity: 'Active',
    features: [
      'Mobile-optimized community chat',
      'Instant notifications for important updates',
      'Global community with regional groups',
      'Direct message support',
      'File and media sharing'
    ],
    preview: [
      { user: 'SuccessMod', message: 'New token listing announcement coming later today!', time: '1h ago' },
      { user: 'Miguel', message: 'Has anyone seen the latest community stats?', time: '3h ago' },
      { user: 'Priya', message: 'I just published a new tutorial on wallet setup', time: '5h ago' }
    ],
    link: 'https://t.me/successkid',
    buttonText: 'Join Telegram Group'
  }
];

export function CommunityChannels() {
  const [activeChannel, setActiveChannel] = useState('discord');
  const [previewMode, setPreviewMode] = useState(false);
  
  // Get the currently selected channel
  const selectedChannel = communityChannels.find(c => c.id === activeChannel);

  return (
    <section id="community-channels" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Connect With Our Community</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Join the conversation across our community channels and stay up-to-date with the latest developments.
          </p>
        </div>
        
        {/* Channel selector tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm bg-white dark:bg-gray-800 p-1">
            {communityChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                  activeChannel === channel.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{channel.icon}</span>
                <span>{channel.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Channel details with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChannel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-5 gap-8"
          >
            {/* Left column: Channel info */}
            <div className="md:col-span-2">
              <AdvancedGlass
                intensity="light"
                borderGlow={true}
                rounded="rounded-xl"
                className="p-6 h-full"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4"
                      style={{ backgroundColor: `${selectedChannel.color}20` }}
                    >
                      {selectedChannel.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedChannel.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                          {selectedChannel.activity}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{selectedChannel.members.toLocaleString()} members</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-6">{selectedChannel.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Channel Features:</h4>
                    <ul className="space-y-2">
                      {selectedChannel.features.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-start"
                        >
                          <svg 
                            className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 mr-2" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-auto">
                    <EnhancedButton
                      variant="primary"
                      size="lg"
                      href={selectedChannel.link}
                      className="w-full"
                      shine={true}
                      glow={true}
                    >
                      {selectedChannel.buttonText}
                    </EnhancedButton>
                  </div>
                </div>
              </AdvancedGlass>
            </div>
            
            {/* Right column: Preview or visual */}
            <div className="md:col-span-3">
              <AdvancedGlass
                intensity="light"
                animated={true}
                rounded="rounded-xl"
                className="p-6 h-full"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Channel Preview</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        !previewMode
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Activity
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        previewMode
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Interactive
                    </button>
                  </div>
                </div>
                
                {/* Channel preview content */}
                <AnimatePresence mode="wait">
                  {!previewMode ? (
                    <motion.div
                      key="activity"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="font-medium">Recent Activity</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Live Preview</div>
                        </div>
                        
                        {selectedChannel.preview.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.15 }}
                            className="flex p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div 
                              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-3 text-xs"
                              style={{ backgroundColor: `${selectedChannel.color}20` }}
                            >
                              {item.user.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-baseline">
                                <span className="font-medium">{item.user}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{item.time}</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{item.message}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="mt-6 text-center">
                        <a
                          href={selectedChannel.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          See the full conversation →
                        </a>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="interactive"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow-sm h-[300px] flex items-center justify-center"
                    >
                      {/* This would be a more interactive element in the actual implementation */}
                      <div className="text-center">
                        <div className="text-6xl mb-4">{selectedChannel.icon}</div>
                        <h4 className="text-xl font-bold mb-2">Join the Conversation</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Connect with {selectedChannel.members.toLocaleString()}+ members on {selectedChannel.name}
                        </p>
                        <a
                          href={selectedChannel.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-primary text-white rounded-md"
                        >
                          Join Now
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </AdvancedGlass>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
