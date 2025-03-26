'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedGlass } from '@/components/ui';

// Sample community members data
const communityMembers = [
  {
    id: 1,
    name: 'Alex Thompson',
    username: '@cryptoalex',
    avatar: '/images/avatars/alex.jpg', // Placeholder image path
    role: 'Content Champion',
    level: 15,
    memberSince: 'January 2024',
    contributions: {
      posts: 87,
      comments: 342,
      points: 45800
    },
    badges: ['Content Creator', 'First Mover', '100 Days Streak', 'Community Leader'],
    bio: 'Crypto enthusiast passionate about helping newcomers navigate the space. I create weekly guides and tutorials for the community.',
    testimonial: 'The Success Kid community has been the most rewarding platform I\'ve been part of. The engagement is genuine and the token rewards make it worthwhile.'
  },
  {
    id: 2,
    name: 'Sarah Chen',
    username: '@sarahc',
    avatar: '/images/avatars/sarah.jpg', // Placeholder image path
    role: 'Technical Advisor',
    level: 12,
    memberSince: 'February 2024',
    contributions: {
      posts: 43,
      comments: 215,
      points: 38250
    },
    badges: ['Wallet Expert', 'Problem Solver', 'Top Commenter'],
    bio: 'Software engineer with 5+ years in blockchain. I enjoy helping members solve technical issues and understand crypto concepts.',
    testimonial: 'I\'ve been able to share my technical knowledge and get rewarded for it. The platform makes it easy to help others while earning tokens.'
  },
  {
    id: 3,
    name: 'Miguel Rodriguez',
    username: '@miguelr',
    avatar: '/images/avatars/miguel.jpg', // Placeholder image path
    role: 'Community Moderator',
    level: 20,
    memberSince: 'December 2023',
    contributions: {
      posts: 104,
      comments: 578,
      points: 62400
    },
    badges: ['Founding Member', 'Top Contributor', 'Conversation Starter', 'Mentor'],
    bio: 'Passionate about creating positive community spaces. I organize weekly discussions and help maintain a welcoming environment for all.',
    testimonial: 'Being part of building this community from the early days has been incredibly rewarding. The genuine connections and shared success make it special.'
  },
  {
    id: 4,
    name: 'Priya Sharma',
    username: '@priyatutorials',
    avatar: '/images/avatars/priya.jpg', // Placeholder image path
    role: 'Success Guide',
    level: 10,
    memberSince: 'March 2024',
    contributions: {
      posts: 35,
      comments: 189,
      points: 29700
    },
    badges: ['Tutorial Creator', 'Helpful Hand', 'Rising Star'],
    bio: 'Educational content creator focused on making crypto accessible to everyone. I create beginner-friendly guides and step-by-step tutorials.',
    testimonial: 'I love that I can use my teaching skills to help others understand crypto, while being rewarded for my efforts. The feedback from community members makes it all worthwhile.'
  }
];

// Top contributors for leaderboard
const topContributors = [
  { name: 'Miguel R.', points: 62400, rank: 1, avatar: '/images/avatars/miguel.jpg' },
  { name: 'Alex T.', points: 45800, rank: 2, avatar: '/images/avatars/alex.jpg' },
  { name: 'Sarah C.', points: 38250, rank: 3, avatar: '/images/avatars/sarah.jpg' },
  { name: 'Priya S.', points: 29700, rank: 4, avatar: '/images/avatars/priya.jpg' },
  { name: 'Jordan K.', points: 27500, rank: 5, avatar: '/images/avatars/jordan.jpg' },
  { name: 'Taylor B.', points: 25600, rank: 6, avatar: '/images/avatars/taylor.jpg' },
  { name: 'Jamie L.', points: 24100, rank: 7, avatar: '/images/avatars/jamie.jpg' },
];

export function CommunityContributors() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [viewMode, setViewMode] = useState('featured'); // 'featured', 'leaderboard', or 'testimonials'
  
  // Get the full member object when selected
  const selectedMemberData = communityMembers.find(m => m.id === selectedMember);

  return (
    <section id="community-contributors" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Success Community</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Meet the amazing members who make our community thrive through their contributions and engagement.
          </p>
          
          {/* View mode tabs */}
          <div className="flex justify-center mt-6">
            <nav className="flex p-1 rounded-md bg-white dark:bg-gray-800 shadow-sm">
              <button
                onClick={() => setViewMode('featured')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  viewMode === 'featured' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Featured Members
              </button>
              <button
                onClick={() => setViewMode('leaderboard')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  viewMode === 'leaderboard' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setViewMode('testimonials')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  viewMode === 'testimonials' 
                    ? 'bg-primary text-white' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Testimonials
              </button>
            </nav>
          </div>
        </div>
        
        {/* Featured Members View */}
        <AnimatePresence mode="wait">
          {viewMode === 'featured' && (
            <motion.div
              key="featured"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {communityMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedMember(member.id)}
                    className="cursor-pointer"
                  >
                    <AdvancedGlass
                      intensity="light"
                      borderGlow={selectedMember === member.id}
                      animated={selectedMember === member.id}
                      className="p-6 h-full flex flex-col"
                    >
                      <div className="flex flex-col items-center mb-4 text-center">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mb-3 overflow-hidden">
                            {/* This would be a real image in production */}
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-2xl">
                              {member.name.charAt(0)}
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            Lv{member.level}
                          </div>
                        </div>
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{member.username}</p>
                        <div className="mt-1 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          {member.role}
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="font-bold text-primary">{member.contributions.posts}</div>
                              <div className="text-gray-500 dark:text-gray-400">Posts</div>
                            </div>
                            <div>
                              <div className="font-bold text-primary">{member.contributions.comments}</div>
                              <div className="text-gray-500 dark:text-gray-400">Comments</div>
                            </div>
                            <div>
                              <div className="font-bold text-primary">{(member.contributions.points / 1000).toFixed(1)}K</div>
                              <div className="text-gray-500 dark:text-gray-400">SP Earned</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AdvancedGlass>
                  </motion.div>
                ))}
              </div>
              
              {/* Member details modal */}
              <AnimatePresence>
                {selectedMemberData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setSelectedMember(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedMember(null)}
                        className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="shrink-0">
                          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            {/* This would be a real image in production */}
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-4xl">
                              {selectedMemberData.name.charAt(0)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="text-2xl font-bold">{selectedMemberData.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400">{selectedMemberData.username}</p>
                          <div className="flex items-center justify-center sm:justify-start mt-2">
                            <div className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                              {selectedMemberData.role}
                            </div>
                            <div className="ml-2 px-3 py-1 bg-secondary/10 text-secondary text-sm rounded-full">
                              Level {selectedMemberData.level}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Member since {selectedMemberData.memberSince}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">About</h4>
                        <p className="text-gray-700 dark:text-gray-300">{selectedMemberData.bio}</p>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Achievements</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMemberData.badges.map((badge, i) => (
                            <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-primary">{selectedMemberData.contributions.posts}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">Posts Created</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-primary">{selectedMemberData.contributions.comments}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">Comments Made</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-primary">{selectedMemberData.contributions.points.toLocaleString()}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">SP Earned</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 italic text-gray-700 dark:text-gray-300 border-l-4 border-primary/30 pl-4 py-2">
                        "{selectedMemberData.testimonial}"
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          
          {/* Leaderboard View */}
          {viewMode === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <AdvancedGlass
                intensity="light"
                borderGlow={true}
                className="p-6 rounded-xl"
              >
                <h3 className="text-xl font-bold mb-6 text-center">Weekly Contribution Leaderboard</h3>
                
                <div className="overflow-hidden rounded-lg">
                  <div className="grid grid-cols-12 bg-gray-100 dark:bg-gray-800 p-3 font-medium text-gray-600 dark:text-gray-300 text-sm">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-7">Member</div>
                    <div className="col-span-4 text-right">Points Earned</div>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    {topContributors.map((contributor, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`grid grid-cols-12 p-3 rounded-lg ${
                          index < 3 ? 'bg-primary/5 border border-primary/10' : 'bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="col-span-1 flex items-center justify-center">
                          {index < 3 ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              'bg-amber-600'
                            }`}>
                              {index + 1}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="col-span-7 flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 overflow-hidden">
                            {/* This would be a real image in production */}
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              {contributor.name.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{contributor.name}</div>
                            {index < 3 && (
                              <div className="text-xs text-primary">
                                {index === 0 ? 'This Week\'s Champion' : 
                                 index === 1 ? 'Silver Contributor' : 
                                 'Bronze Contributor'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-span-4 flex items-center justify-end">
                          <div className="font-bold text-primary">{contributor.points.toLocaleString()} SP</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Leaderboard updates every Sunday at midnight UTC. <br/>
                    Top contributors receive special rewards and recognition!
                  </p>
                </div>
              </AdvancedGlass>
            </motion.div>
          )}
          
          {/* Testimonials View */}
          {viewMode === 'testimonials' && (
            <motion.div
              key="testimonials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                {communityMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <AdvancedGlass
                      intensity="light"
                      className="p-6 h-full"
                    >
                      <div className="flex items-start mb-4">
                        <div className="shrink-0 mr-4">
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            {/* This would be a real image in production */}
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-lg">
                              {member.name.charAt(0)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold">{member.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                        </div>
                      </div>
                      
                      <div className="italic text-gray-700 dark:text-gray-300 relative pl-6">
                        <span className="absolute top-0 left-0 text-3xl text-primary/20">"</span>
                        {member.testimonial}
                        <span className="absolute bottom-0 right-0 text-3xl text-primary/20">"</span>
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Member since {member.memberSince}
                        </div>
                      </div>
                    </AdvancedGlass>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
