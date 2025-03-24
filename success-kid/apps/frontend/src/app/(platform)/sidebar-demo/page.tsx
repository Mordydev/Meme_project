'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AnimateElement, 
  StaggeredContainer, 
  SuccessCelebration 
} from '@/components/animations';
import { 
  LoadingSpinner, 
  AnimatedBadge,
  Button
} from '@/components/ui';
import { springs, bezierCurves } from '@/lib/animations';

/**
 * Animation Demo Page
 * Showcases all the animation components and effects in one place
 */
export default function AnimationDemoPage() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [toggleAnimation, setToggleAnimation] = useState(false);
  const [badgeCount, setBadgeCount] = useState(5);
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <AnimateElement>
        <h1 className="text-3xl font-bold mb-8">Animation Components Demo</h1>
      </AnimateElement>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Base Animation Components */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <AnimateElement variant="slide-up">
            <h2 className="text-xl font-semibold mb-4">Base Animation Components</h2>
          </AnimateElement>
          
          <StaggeredContainer>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">AnimateElement</h3>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setToggleAnimation(!toggleAnimation)}
                  className="mb-2"
                >
                  Trigger Animations
                </Button>
                
                {toggleAnimation && (
                  <>
                    <AnimateElement variant="fade" className="p-3 bg-primary-100 rounded-md">
                      Fade Animation
                    </AnimateElement>
                    
                    <AnimateElement variant="slide-up" className="p-3 bg-secondary-100 rounded-md">
                      Slide Up Animation
                    </AnimateElement>
                    
                    <AnimateElement variant="slide-right" className="p-3 bg-accent-100 rounded-md">
                      Slide Right Animation
                    </AnimateElement>
                    
                    <AnimateElement variant="scale" className="p-3 bg-alert-100 rounded-md">
                      Scale Animation
                    </AnimateElement>
                  </>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">StaggeredContainer</h3>
              <p className="text-sm text-gray-600 mb-2">Children appear with staggered timing</p>
              
              <Button 
                onClick={() => setToggleAnimation(!toggleAnimation)}
                className="mb-2"
              >
                Trigger Stagger
              </Button>
              
              {toggleAnimation && (
                <StaggeredContainer className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div 
                      key={i}
                      className="bg-primary-50 border border-primary-100 rounded-md p-3 text-center"
                    >
                      Item {i + 1}
                    </div>
                  ))}
                </StaggeredContainer>
              )}
            </div>
          </StaggeredContainer>
        </div>
        
        {/* Section 2: UI Component Animations */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <AnimateElement variant="slide-up">
            <h2 className="text-xl font-semibold mb-4">UI Component Animations</h2>
          </AnimateElement>
          
          <StaggeredContainer>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">LoadingSpinner</h3>
              <div className="flex flex-wrap gap-6 items-center">
                <LoadingSpinner size="sm" />
                <LoadingSpinner />
                <LoadingSpinner size="lg" />
                <LoadingSpinner color="secondary" withText text="Loading data..." />
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">AnimatedBadge</h3>
              <div className="space-y-3">
                <div className="flex gap-4 items-center">
                  <Button 
                    onClick={() => setBadgeCount(prev => prev + 1)}
                    variant="secondary"
                    size="sm"
                  >
                    Increment
                  </Button>
                  
                  <Button 
                    onClick={() => setBadgeCount(prev => Math.max(0, prev - 1))}
                    variant="outline"
                    size="sm"
                  >
                    Decrement
                  </Button>
                  
                  <div className="flex gap-3 items-center">
                    <span>Count:</span>
                    <AnimatedBadge count={badgeCount} variant="primary" />
                    <AnimatedBadge count={badgeCount} variant="secondary" />
                    <AnimatedBadge count={badgeCount} variant="accent" />
                    <AnimatedBadge count={badgeCount} variant="alert" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Motion Effects</h3>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  className="bg-primary-50 border border-primary-100 rounded-md p-3 text-center cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Hover & Tap Me
                </motion.div>
                
                <motion.div
                  className="bg-secondary-50 border border-secondary-100 rounded-md p-3 text-center"
                  animate={{ 
                    y: [0, -10, 0],
                    transition: { 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }
                  }}
                >
                  Floating Animation
                </motion.div>
                
                <motion.div
                  className="bg-accent-50 border border-accent-100 rounded-md p-3 text-center"
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(76, 175, 80, 0)",
                      "0 0 20px rgba(76, 175, 80, 0.7)",
                      "0 0 0 rgba(76, 175, 80, 0)"
                    ],
                    transition: { 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "easeInOut"
                    }
                  }}
                >
                  Pulse Glow Effect
                </motion.div>
                
                <motion.div
                  className="bg-alert-50 border border-alert-100 rounded-md p-3 text-center cursor-pointer"
                  whileHover={{ 
                    backgroundColor: "rgb(254, 226, 226)",
                    transition: { duration: 0.3 } 
                  }}
                >
                  Color Transition
                </motion.div>
              </div>
            </div>
          </StaggeredContainer>
        </div>
      </div>
      
      {/* Section 3: Celebration Effects */}
      <AnimateElement variant="slide-up" delay={0.2} className="mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Celebration Effects</h2>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => setShowCelebration(true)}
              className="mb-4"
            >
              Trigger Achievement Celebration
            </Button>
            
            <Button 
              onClick={() => {
                setBadgeCount(prev => prev + 10);
                setTimeout(() => setShowCelebration(true), 300);
              }}
              variant="secondary"
              className="mb-4"
            >
              Trigger Points Celebration
            </Button>
          </div>
          
          <p className="text-sm text-gray-600">
            Click the buttons above to see different celebration effects.
          </p>
          
          <SuccessCelebration 
            show={showCelebration}
            onComplete={() => setShowCelebration(false)}
            type="achievement"
            message="Level Up! You're now Level 5"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>
      </AnimateElement>
    </div>
  );
}
