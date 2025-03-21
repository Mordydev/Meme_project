'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UniversalGlow } from '@/components/ui/optimized';
// Remove confetti import since it's not installed

// Milestone data from Masterplan
const milestones = [
  { value: 100000, label: '$100K', status: 'complete', date: '10 Feb 2025', description: 'First milestone achievement - Initial community establishment' },
  { value: 500000, label: '$500K', status: 'current', date: null, description: 'Key growth target - Enhanced platform features and wider recognition' },
  { value: 1000000, label: '$1M', status: 'upcoming', date: null, description: 'Community establishment - Major marketing initiatives and partnerships' },
  { value: 5000000, label: '$5M', status: 'upcoming', date: null, description: 'Expansion milestone - Advanced features and ecosystem growth' },
  { value: 10000000, label: '$10M', status: 'upcoming', date: null, description: 'Medium-term goal - Significant market presence and adoption' },
  { value: 50000000, label: '$50M', status: 'upcoming', date: null, description: 'Ambitious target - Major exchange listings and mainstream recognition' },
  { value: 100000000, label: '$100M+', status: 'upcoming', date: null, description: 'Long-term vision - Established player in the token ecosystem' },
];

// Current market cap - would be fetched from API in production
const currentMarketCap = 420000;

type MilestoneStatus = 'complete' | 'current' | 'upcoming';

interface MilestoneProps {
  value: number;
  label: string;
  status: MilestoneStatus;
  date: string | null;
  description: string;
  index: number;
  onSelect: (index: number) => void;
  isSelected: boolean;
}

const Milestone: React.FC<MilestoneProps> = ({ 
  value, 
  label, 
  status, 
  date, 
  description,
  index,
  onSelect,
  isSelected
}) => {
  // Determine color and style based on status
  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return {
          dot: 'bg-green-500 ring-2 ring-green-200',
          line: 'bg-green-500',
          text: 'text-green-700',
          date: 'bg-green-100 text-green-800'
        };
      case 'current':
        return {
          dot: 'bg-primary ring-2 ring-primary-200',
          line: 'bg-gray-300',
          text: 'text-primary-700',
          date: 'bg-primary-100 text-primary-800'
        };
      case 'upcoming':
        return {
          dot: 'bg-gray-300 ring-2 ring-gray-100',
          line: 'bg-gray-300',
          text: 'text-gray-500',
          date: 'bg-gray-100 text-gray-500'
        };
    }
  };
  
  const styles = getStatusStyles();
  
  // Run celebration effects when a milestone is selected
  const handleMilestoneSelect = () => {
    onSelect(index);
    
    // Only run celebration for completed or current milestones
    // Note: confetti effect removed due to missing dependency
    // If you want to add confetti, install the canvas-confetti package
  };
  
  return (
    <div 
      className={`relative flex items-center cursor-pointer group ${
        isSelected ? 'z-20' : 'z-10'
      }`}
      onClick={handleMilestoneSelect}
    >
      <motion.div 
        className={`w-6 h-6 rounded-full ${styles.dot} flex items-center justify-center relative z-20`}
        whileHover={{ scale: 1.2 }}
        animate={isSelected ? { scale: 1.2 } : { scale: 1 }}
      >
        {status === 'complete' && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        
        {status === 'current' && (
          <motion.div 
            className="w-2 h-2 bg-white rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity
            }}
          />
        )}
      </motion.div>
      
      <motion.div 
        className={`absolute top-1/2 transform -translate-y-1/2 left-0 ml-6 ${
          isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100'
        } transition-opacity duration-200 bg-white rounded-lg shadow-lg border border-gray-100 p-3 z-30 w-56`}
        initial={false}
        animate={isSelected ? { x: 15, opacity: 1 } : { x: 0, opacity: 0 }}
      >
        <div className={`font-bold mb-1 ${styles.text}`}>{label}</div>
        {date && (
          <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${styles.date}`}>
            Achieved: {date}
          </div>
        )}
        <p className="text-sm text-gray-700">{description}</p>
      </motion.div>
      
      <div className={`h-0.5 flex-grow ${styles.line}`}></div>
    </div>
  );
};

interface MilestoneTrackerProps {
  className?: string;
}

export function MilestoneTracker({ className = '' }: MilestoneTrackerProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  
  // Calculate progress percentage toward next milestone
  const calculateProgress = () => {
    const currentIndex = milestones.findIndex(m => m.status === 'current');
    if (currentIndex === -1) return 0;
    
    const prevMilestone = currentIndex > 0 ? milestones[currentIndex - 1].value : 0;
    const nextMilestone = milestones[currentIndex].value;
    
    const range = nextMilestone - prevMilestone;
    const current = currentMarketCap - prevMilestone;
    
    return Math.min(100, Math.max(0, (current / range) * 100));
  };
  
  const progressPercentage = calculateProgress();
  
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Market Cap Milestones</h3>
        <p className="text-gray-700">
          Track our community journey through key market cap achievements. We're currently at ${currentMarketCap.toLocaleString()}.
        </p>
      </div>
      
      <div className="relative mb-10">
        {/* Progress bar overlay */}
        <div className="absolute -left-3 top-3 h-0.5 bg-green-500 z-0" style={{ width: `${progressPercentage}%` }}></div>
        
        {/* Milestones list */}
        <div className="space-y-10">
          {milestones.map((milestone, index) => (
            <Milestone
              key={milestone.label}
              {...milestone}
              index={index}
              onSelect={setSelectedMilestone}
              isSelected={selectedMilestone === index}
            />
          ))}
        </div>
      </div>
      
      {/* Current progress visualization */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-gray-900">Progress to Next Milestone</h4>
          <div className="text-primary font-bold">{progressPercentage.toFixed(0)}%</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
          <motion.div 
            className="h-4 rounded-full bg-gradient-to-r from-green-500 to-primary" 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div 
              className="absolute top-0 right-0 h-4 w-2 bg-white/30"
              animate={{ 
                x: [0, 20, 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
          </motion.div>
        </div>
        
        <div className="flex justify-between text-sm">
          <div className="text-green-700 font-medium">
            {milestones.find(m => m.status === 'complete')?.label || '$0'}
          </div>
          <div className="text-primary-700 font-medium">
            {milestones.find(m => m.status === 'current')?.label || '$100K'}
          </div>
        </div>
      </div>
      
      {/* Call to action */}
      <div className="mt-8 text-center">
        <p className="mb-4 text-gray-700">Help us reach the next milestone by joining the community!</p>
        <motion.a
          href="/sign-up"
          className="inline-block py-3 px-6 bg-primary text-white font-semibold rounded-md shadow-md"
          whileHover={{ 
            scale: 1.05, 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
          whileTap={{ scale: 0.95 }}
        >
          Join the Journey
        </motion.a>
      </div>
    </div>
  );
}

export default MilestoneTracker;
