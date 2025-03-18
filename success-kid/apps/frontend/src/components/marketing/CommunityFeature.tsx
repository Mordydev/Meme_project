'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface CommunityMember {
  name: string;
  role: string;
  achievement: string;
  avatar: string;
  points: string;
  level: number;
}

interface CommunityFeatureProps {
  className?: string;
}

export function CommunityFeature({ className = '' }: CommunityFeatureProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  
  // Sample community members data
  const communityMembers: CommunityMember[] = [
    {
      name: 'Alex Thompson',
      role: 'Content Creator',
      achievement: 'Top Contributor',
      avatar: '👨‍💼',
      points: '45,800 SP',
      level: 9,
    },
    {
      name: 'Sarah Chen',
      role: 'Technical Advisor',
      achievement: 'Helpful Guide',
      avatar: '👩‍💻',
      points: '38,250 SP',
      level: 8,
    },
    {
      name: 'Miguel Rodriguez',
      role: 'Community Moderator',
      achievement: 'Event Organizer',
      avatar: '👨‍🚀',
      points: '62,400 SP',
      level: 10,
    },
  ];
  
  // Achievement badges
  const achievementBadges = [
    { name: 'First Steps', description: 'Create your first post', icon: '🚶' },
    { name: 'Rising Star', description: 'Reach 1,000 SP', icon: '⭐' },
    { name: 'Connection Builder', description: 'Make 10 meaningful comments', icon: '🔗' },
    { name: 'Content Champion', description: 'Create 25 quality posts', icon: '🏆' },
    { name: 'Community Leader', description: 'Help 50 members with guidance', icon: '👑' },
    { name: 'Token Master', description: 'Redeem SP for tokens 10 times', icon: '💰' },
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { 
      opacity: prefersReducedMotion ? 1 : 0, 
      y: prefersReducedMotion ? 0 : 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Badge animation variants
  const badgeVariants = {
    hidden: { 
      opacity: prefersReducedMotion ? 1 : 0, 
      scale: prefersReducedMotion ? 1 : 0.8 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  
  return (
    <div className={`space-y-10 ${className}`}>
      {/* Community Leaderboard */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="bg-primary-50 p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Community Leaders</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {communityMembers.map((member, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="p-4 flex items-center"
            >
              {/* Avatar with level indicator */}
              <div className="relative mr-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                  {member.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full text-white text-xs flex items-center justify-center font-bold border-2 border-white">
                  {member.level}
                </div>
              </div>
              
              {/* Member info */}
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900">{member.name}</h4>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
              
              {/* Achievement badge */}
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {member.achievement}
                </span>
                <p className="text-sm font-medium text-primary mt-1">{member.points}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-3 text-center text-sm text-gray-600">
          And 50,000+ more active community members
        </div>
      </motion.div>
      
      {/* Achievement Badges */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Achievement Badges</h3>
        <p className="text-gray-600">Earn badges by reaching milestones and contributing to the community:</p>
        
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {achievementBadges.map((badge, index) => (
            <motion.div
              key={index}
              variants={badgeVariants}
              className="flex flex-col items-center text-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 text-2xl rounded-full mb-3">
                {badge.icon}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{badge.name}</h4>
              <p className="text-sm text-gray-600">{badge.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Community Activities */}
      <motion.div
        className="bg-gray-50 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4">Community Activities</h3>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl mr-3">
              🎯
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Weekly Challenges</h4>
              <p className="text-gray-600">Participate in themed content creation and engagement challenges for bonus rewards.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl mr-3">
              🎙️
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">AMAs with Team</h4>
              <p className="text-gray-600">Join regular Ask Me Anything sessions with the Success Kid team and special guests.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl mr-3">
              🎉
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Milestone Celebrations</h4>
              <p className="text-gray-600">Special events and bonus rewards when the community reaches important milestones.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
