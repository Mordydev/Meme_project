'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/optimized';

// Token utility cases
const utilityCases = [
  {
    id: 'rewards',
    title: 'Community Rewards',
    description: 'SKC tokens serve as the ultimate reward for platform engagement. Convert earned Success Points to SKC at a rate of 100 SP = 1 SKC, providing tangible value for your contributions.',
    benefits: [
      'Direct rewards for quality content and engagement',
      'Transparent conversion from platform activity to real value',
      'Weekly redemption opportunities with fair distribution'
    ],
    icon: '🏆',
    color: 'primary'
  },
  {
    id: 'status',
    title: 'Holder Status',
    description: 'Holding SKC tokens provides special platform status, unlocking exclusive features and recognition within the community. Active members who hold tokens gain enhanced visibility and influence.',
    benefits: [
      'Exclusive holder badges and profile indicators',
      'Access to holder-only features and content areas',
      'Enhanced visibility for content created by holders'
    ],
    icon: '⭐',
    color: 'secondary'
  },
  {
    id: 'governance',
    title: 'Future Governance',
    description: "As the platform evolves, SKC tokens will enable participation in governance decisions, giving the community direct influence over the platform's development and feature priorities.",
    benefits: [
      'Voting rights on platform features and updates',
      'Proposal submission capabilities for platform improvements',
      'Direct influence proportional to token holdings'
    ],
    icon: '🏛️',
    color: 'accent'
  },
  {
    id: 'ecosystem',
    title: 'Growing Ecosystem',
    description: 'The SKC token will expand in utility as the ecosystem grows, with potential integrations across partner platforms and services, increasing value through network effects.',
    benefits: [
      'Cross-platform utility through strategic partnerships',
      'Expanding use cases as the community grows',
      'Increasing value driven by network effects'
    ],
    icon: '🌐',
    color: 'primary'
  }
];

export interface TokenUtilitySectionProps {
  className?: string;
}

export function TokenUtilitySection({ className = '' }: TokenUtilitySectionProps) {
  const [activeCase, setActiveCase] = useState(utilityCases[0].id);
  
  // Get color class based on color name
  const getColorClass = (color: string) => {
    switch (color) {
      case 'primary': return 'bg-primary-100 text-primary-800 ring-primary-200';
      case 'secondary': return 'bg-secondary-100 text-secondary-800 ring-secondary-200';
      case 'accent': return 'bg-accent-100 text-accent-800 ring-accent-200';
      default: return 'bg-primary-100 text-primary-800 ring-primary-200';
    }
  };
  
  const activeUtilityCase = utilityCases.find(c => c.id === activeCase) || utilityCases[0];
  
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${className}`}>
      {/* Left column: Navigation */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Token Utility & Benefits</h3>
        
        <div className="space-y-4">
          {utilityCases.map((utilityCase) => {
            const isActive = activeCase === utilityCase.id;
            const colorClass = getColorClass(utilityCase.color);
            
            return (
              <motion.div
                key={utilityCase.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isActive 
                    ? 'border-primary-200 bg-white shadow-md' 
                    : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                }`}
                whileHover={{ y: -2 }}
                onClick={() => setActiveCase(utilityCase.id)}
              >
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full ${colorClass} ring-2 flex items-center justify-center text-2xl mr-4 flex-shrink-0`}>
                    {utilityCase.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {utilityCase.title}
                    </h4>
                    <p className="text-gray-700 text-sm line-clamp-1">
                      {utilityCase.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Right column: Detailed view */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCase}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard
            hoverEffect={false}
            glassOpacity={0.7}
            glassBlur="md"
            border={true}
            borderGlow={true}
            className="p-6 h-full"
          >
            <div className="flex items-center mb-6">
              <div className={`w-14 h-14 rounded-full ${getColorClass(activeUtilityCase.color)} ring-2 flex items-center justify-center text-3xl mr-4`}>
                {activeUtilityCase.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {activeUtilityCase.title}
              </h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              {activeUtilityCase.description}
            </p>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Benefits</h4>
              <ul className="space-y-3">
                {activeUtilityCase.benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default TokenUtilitySection;
