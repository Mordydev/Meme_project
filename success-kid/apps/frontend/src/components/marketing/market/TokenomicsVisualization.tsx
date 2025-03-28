'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UniversalGlow } from '@/components/ui/optimized';

// Token distribution data from Masterplan
const tokenDistribution = [
  {
    id: 'community',
    category: 'Community Rewards',
    percentage: 50,
    amount: '3.5 billion SKC',
    description: 'Reserved for platform engagement rewards, distributed weekly over 12 months (67.307M SKC/week)',
    color: '#1E88E5', // Primary color
    icon: '👥'
  },
  {
    id: 'development',
    category: 'Development Team',
    percentage: 20,
    amount: '1.4 billion SKC',
    description: 'Funds development, marketing, and ongoing platform improvements, distributed weekly over 12 months starting Month 3 (26.923M SKC/week)',
    color: '#4CAF50', // Accent color
    icon: '🔧'
  },
  {
    id: 'public',
    category: 'Public Sale',
    percentage: 30,
    amount: '2.1 billion SKC',
    description: 'Available for public distribution and liquidity, ensuring healthy trading and accessibility',
    color: '#FFC107', // Secondary color
    icon: '🌐'
  }
];

// Visual types for the tokenomics display
type VisualizationType = 'donut' | 'bars' | 'cards';

export interface TokenomicsVisualizationProps {
  className?: string;
}

export function TokenomicsVisualization({ className = '' }: TokenomicsVisualizationProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [visualType, setVisualType] = useState<VisualizationType>('donut');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Toggle visual representation
  const changeVisualType = (type: VisualizationType) => {
    if (type !== visualType && !isAnimating) {
      setIsAnimating(true);
      setVisualType(type);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };
  
  return (
    <div className={`w-full bg-white rounded-xl border border-gray-100 shadow-md ${className}`}>
      {/* Visual selector */}
      <div className="flex justify-center p-4 border-b border-gray-100">
        <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
          {[
            { type: 'donut', label: 'Donut Chart', icon: '🍩' },
            { type: 'bars', label: 'Bar Chart', icon: '📊' },
            { type: 'cards', label: 'Detail Cards', icon: '🗂️' }
          ].map((item) => (
            <button
              key={item.type}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                visualType === item.type 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => changeVisualType(item.type as VisualizationType)}
              aria-label={item.label}
            >
              <span className="mr-2">{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Donut Chart Visualization */}
          {visualType === 'donut' && (
            <motion.div
              key="donut"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f0f0f0"
                    strokeWidth="20"
                  />
                  
                  {/* Create donut segments */}
                  {tokenDistribution.map((segment, index) => {
                    // Calculate stroke dasharray and offset
                    const segmentPercentage = segment.percentage / 100;
                    const circumference = 2 * Math.PI * 40; // 2πr
                    const dashArray = circumference * segmentPercentage;
                    const dashOffset = circumference * (1 - segmentPercentage);
                    
                    // Calculate rotation so segments start from the top
                    let rotation = 0;
                    for (let i = 0; i < index; i++) {
                      rotation += (tokenDistribution[i].percentage / 100) * 360;
                    }
                    
                    return (
                      <motion.circle
                        key={segment.id}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                        strokeDashoffset={dashOffset}
                        transform={`rotate(${-90 + rotation} 50 50)`}
                        style={{ transformOrigin: 'center' }}
                        onMouseEnter={() => setActiveSegment(segment.id)}
                        onMouseLeave={() => setActiveSegment(null)}
                        whileHover={{ scale: 1.05 }}
                        animate={{ 
                          strokeWidth: activeSegment === segment.id ? 22 : 20,
                          filter: activeSegment === segment.id ? 'drop-shadow(0 0 5px rgba(0,0,0,0.3))' : 'none'
                        }}
                        className="cursor-pointer transition-all duration-300"
                      />
                    );
                  })}
                  
                  {/* Center text */}
                  <text 
                    x="50" 
                    y="45" 
                    textAnchor="middle" 
                    fontSize="10" 
                    fontWeight="bold"
                    fill="#333"
                  >
                    Total Supply
                  </text>
                  <text 
                    x="50" 
                    y="58" 
                    textAnchor="middle" 
                    fontSize="12" 
                    fontWeight="bold"
                    fill="#1E88E5"
                  >
                    7 Billion
                  </text>
                </svg>
                
                {/* Highlight glow effect for active segment */}
                {activeSegment && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <UniversalGlow
                      color="custom"
                      customColor={tokenDistribution.find(s => s.id === activeSegment)?.color || '#1E88E5'}
                      size="xl"
                      intensity="light"
                      animation="pulse"
                      shape="circle"
                    />
                  </motion.div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Token Distribution</h3>
                
                <div className="space-y-4">
                  {tokenDistribution.map((segment) => (
                    <motion.div 
                      key={segment.id}
                      className={`flex items-center p-3 rounded-lg transition-colors ${
                        activeSegment === segment.id ? 'bg-gray-50' : ''
                      }`}
                      onMouseEnter={() => setActiveSegment(segment.id)}
                      onMouseLeave={() => setActiveSegment(null)}
                      whileHover={{ backgroundColor: 'rgba(240, 240, 240, 0.6)' }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full mr-3 flex-shrink-0" 
                        style={{ backgroundColor: segment.color }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{segment.category}</span>
                          <span className="font-bold">{segment.percentage}%</span>
                        </div>
                        <div className="text-sm text-gray-500">{segment.amount}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-5 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <p className="font-medium mb-1">About our tokenomics:</p>
                  <p>Our distribution prioritizes community rewards, with 50% of tokens allocated to engage and reward platform participants. This ensures long-term value accrual to active community members.</p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Bar Chart Visualization */}
          {visualType === 'bars' && (
            <motion.div
              key="bars"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="h-96"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Token Allocation</h3>
              
              <div className="flex justify-around items-end h-64 px-4">
                {tokenDistribution.map((segment, index) => (
                  <div key={segment.id} className="flex flex-col items-center">
                    <div className="flex flex-col items-center mb-4">
                      <span className="text-lg font-bold">{segment.percentage}%</span>
                      <span className="text-sm text-gray-500">{segment.amount}</span>
                    </div>
                    
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${segment.percentage * 2}px` }}
                      transition={{ 
                        duration: 1, 
                        delay: index * 0.2,
                        type: "spring",
                        bounce: 0.3
                      }}
                      onMouseEnter={() => setActiveSegment(segment.id)}
                      onMouseLeave={() => setActiveSegment(null)}
                      className="w-24 rounded-t-lg cursor-pointer"
                      style={{ 
                        backgroundColor: segment.color,
                        filter: activeSegment === segment.id ? 'brightness(1.1) drop-shadow(0 0 10px rgba(0,0,0,0.2))' : 'none',
                        transform: activeSegment === segment.id ? 'scaleY(1.03)' : 'none'
                      }}
                    />
                    
                    <div className="mt-4 text-center">
                      <div className="text-2xl mb-1">{segment.icon}</div>
                      <div className="font-medium text-sm">{segment.category}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Description for selected segment */}
              <AnimatePresence mode="wait">
                {activeSegment && (
                  <motion.div
                    key={activeSegment}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 p-4 bg-gray-50 rounded-lg text-center"
                  >
                    <p className="text-gray-700">
                      {tokenDistribution.find(s => s.id === activeSegment)?.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          
          {/* Detailed Cards Visualization */}
          {visualType === 'cards' && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Detailed Token Allocation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tokenDistribution.map((segment, index) => (
                  <motion.div
                    key={segment.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-md overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: index * 0.1 }
                    }}
                    whileHover={{ 
                      y: -5,
                      boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                      transition: { duration: 0.3 }
                    }}
                  >
                    <div 
                      className="h-2"
                      style={{ backgroundColor: segment.color }}
                    />
                    <div className="p-5">
                      <div className="flex items-center mb-4">
                        <div className="text-3xl mr-3">{segment.icon}</div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{segment.category}</h4>
                          <div className="text-sm text-gray-500">{segment.amount}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm text-gray-500">Allocation</div>
                        <div className="text-2xl font-bold" style={{ color: segment.color }}>
                          {segment.percentage}%
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                        <motion.div 
                          className="h-2.5 rounded-full" 
                          style={{ backgroundColor: segment.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${segment.percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                      
                      <p className="text-sm text-gray-700">
                        {segment.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 p-4 bg-gray-50 rounded-lg"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Total Supply: 7 Billion SKC</h4>
                <p className="text-sm text-gray-700">
                  Our total supply is fixed at 7 billion tokens, chosen to symbolize the "lucky 7" and provide sufficient supply for a growing community. The distribution structure ensures community members receive the majority of tokens through engagement rewards.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TokenomicsVisualization;
