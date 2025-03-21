'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { EnhancedButton } from '@/components/ui';
import Link from 'next/link';

// Define the community engagement flow steps
const engagementSteps = [
  {
    id: 'join',
    title: 'Join the Community',
    description: 'Create your account and set up your profile in under 2 minutes.',
    icon: '👋',
    color: 'primary',
    examples: ['Complete your profile', 'Set your interests', 'Follow topics']
  },
  {
    id: 'participate',
    title: 'Participate & Engage',
    description: 'Create content, comment on posts, and interact with other members.',
    icon: '💬',
    color: 'secondary',
    examples: ['Create a post', 'Comment on discussions', 'Upvote quality content']
  },
  {
    id: 'earn',
    title: 'Earn Success Points',
    description: 'Receive SP for your contributions, with more points for higher quality engagement.',
    icon: '🏆',
    color: 'accent',
    examples: ['+50 SP for posts', '+15 SP for comments', '+5 SP for upvotes received']
  },
  {
    id: 'redeem',
    title: 'Redeem for Tokens',
    description: 'Convert your Success Points to SKC tokens at a rate of 100 SP = 1 SKC.',
    icon: '💰',
    color: 'primary',
    examples: ['Weekly redemption', 'Connect wallet to claim', 'Track your earnings']
  },
  {
    id: 'grow',
    title: 'Grow Your Status',
    description: 'Level up, earn badges, and gain recognition in the community.',
    icon: '📈',
    color: 'secondary',
    examples: ['Unlock achievements', 'Climb the leaderboard', 'Become a community leader']
  }
];

export function EngagementFlowVisualization() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const flowRef = useRef(null);
  const controls = useAnimation();
  
  // Handle step change with animation
  const goToStep = (index) => {
    if (isAnimating || index === activeStep) return;
    
    setIsAnimating(true);
    setActiveStep(index);
    
    // Run transition animation
    controls.start({
      opacity: [0.5, 1],
      transition: { duration: 0.3 }
    }).then(() => {
      setIsAnimating(false);
    });
  };
  
  // Auto-rotate through steps
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        const nextStep = (activeStep + 1) % engagementSteps.length;
        goToStep(nextStep);
      }
    }, 8000);
    
    return () => clearInterval(interval);
  }, [activeStep, isAnimating]);
  
  // Get current step
  const currentStep = engagementSteps[activeStep];

  return (
    <section id="how-it-works" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">How Our Community Works</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            A simple, rewarding process that allows everyone to contribute and benefit from the Success Kid ecosystem.
          </p>
        </div>
        
        {/* Step indicators */}
        <div className="mb-12 relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2"></div>
          
          <div className="flex justify-between relative">
            {engagementSteps.map((step, index) => (
              <motion.button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`relative z-10 flex flex-col items-center ${activeStep === index ? 'cursor-default' : 'cursor-pointer'}`}
                whileHover={activeStep !== index ? { y: -2 } : {}}
              >
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                    activeStep === index
                      ? `bg-${step.color} text-white border-${step.color}`
                      : index < activeStep
                        ? `bg-${step.color}/20 text-${step.color} border-${step.color}`
                        : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600'
                  }`}
                  animate={activeStep === index ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      '0 0 0 rgba(0,0,0,0)',
                      `0 0 20px rgba(var(--color-${step.color}-rgb), 0.4)`,
                      '0 0 0 rgba(0,0,0,0)'
                    ]
                  } : {}}
                  transition={{ 
                    duration: 2, 
                    repeat: activeStep === index ? Infinity : 0,
                    repeatType: 'loop'
                  }}
                >
                  {index < activeStep ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </motion.div>
                
                <div className={`mt-2 text-sm font-medium hidden md:block ${
                  activeStep === index ? `text-${step.color}` : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.title}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Step content */}
        <motion.div 
          className="max-w-4xl mx-auto"
          ref={flowRef}
          animate={controls}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            >
              <div className={`bg-${currentStep.color} h-2`}></div>
              <div className="p-6">
                <div className="md:flex">
                  <div className="md:flex-1 mb-6 md:mb-0 md:pr-10">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full bg-${currentStep.color}/10 flex items-center justify-center text-2xl text-${currentStep.color} mr-4`}>
                        {currentStep.icon}
                      </div>
                      <h3 className="text-2xl font-bold">{currentStep.title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{currentStep.description}</p>
                    
                    <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-300">Examples:</h4>
                    <ul className="space-y-2">
                      {currentStep.examples.map((example, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                          className="flex items-center"
                        >
                          <svg className={`w-5 h-5 mr-2 text-${currentStep.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{example}</span>
                        </motion.li>
                      ))}
                    </ul>
                    
                    {/* Step-specific call to action */}
                    <div className="mt-8">
                      <EnhancedButton
                        variant={currentStep.id === 'join' ? 'primary' : 'outline'}
                        href={currentStep.id === 'join' ? '/join' : `#${currentStep.id}`}
                      >
                        {currentStep.id === 'join' ? 'Join Now' : `Learn About ${currentStep.title}`}
                      </EnhancedButton>
                    </div>
                  </div>
                  
                  <div className="md:w-1/3">
                    <div className={`bg-${currentStep.color}/5 rounded-lg p-4 h-full flex items-center justify-center`}>
                      {/* Step-specific illustration or interactive element */}
                      <StepVisualization step={currentStep} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation controls */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => goToStep((activeStep - 1 + engagementSteps.length) % engagementSteps.length)}
              className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isAnimating}
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => goToStep((activeStep + 1) % engagementSteps.length)}
              className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isAnimating}
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Step-specific visualization component
function StepVisualization({ step }) {
  switch(step.id) {
    case 'join':
      return <JoinVisualization />;
    case 'participate':
      return <ParticipateVisualization />;
    case 'earn':
      return <EarnVisualization />;
    case 'redeem':
      return <RedeemVisualization />;
    case 'grow':
      return <GrowVisualization />;
    default:
      return null;
  }
}

// Step-specific visualization components
function JoinVisualization() {
  return (
    <div className="text-center">
      <motion.div 
        className="text-6xl mb-4"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0, -5, 0] 
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        👋
      </motion.div>
      <div className="font-medium">Welcome!</div>
    </div>
  );
}

function ParticipateVisualization() {
  return (
    <div className="text-center">
      <motion.div 
        className="text-6xl mb-4"
        animate={{ 
          y: [0, -10, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        💬
      </motion.div>
      <div className="font-medium">Share & Discuss</div>
    </div>
  );
}

function EarnVisualization() {
  return (
    <div className="text-center">
      <motion.div 
        className="text-6xl mb-4"
        animate={{ 
          rotateY: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🏆
      </motion.div>
      <div className="font-medium">Earn Rewards</div>
    </div>
  );
}

function RedeemVisualization() {
  return (
    <div className="text-center">
      <motion.div 
        className="text-6xl mb-4"
        animate={{ 
          scale: [1, 1.15, 1],
          filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        💰
      </motion.div>
      <div className="font-medium">Get Tokens</div>
    </div>
  );
}

function GrowVisualization() {
  return (
    <div className="text-center">
      <motion.div 
        className="text-6xl mb-4"
        animate={{ 
          y: [0, -15, 0],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        📈
      </motion.div>
      <div className="font-medium">Level Up</div>
    </div>
  );
}
