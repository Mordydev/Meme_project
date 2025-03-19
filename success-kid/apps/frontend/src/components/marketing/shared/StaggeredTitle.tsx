'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TypewriterEffect } from '@/components/ui/typewriter-effect';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

export interface StaggeredTitleProps {
  text: string;
  highlightedText?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  highlightColor?: string;
  className?: string;
  delay?: number;
  useTypewriter?: boolean;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  align?: 'left' | 'center' | 'right';
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

export function StaggeredTitle({
  text,
  highlightedText,
  as = 'h1',
  highlightColor = 'text-primary',
  className = '',
  delay = 0,
  useTypewriter = false,
  animation = 'fade',
  align = 'left',
  gradient = false,
  gradientFrom = 'from-primary',
  gradientTo = 'to-secondary'
}: StaggeredTitleProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const Component = as;
  
  // Get text alignment class
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : '';
  
  // Get highlight classes
  const highlightClasses = gradient 
    ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent` 
    : highlightColor;
  
  // Get motion values based on animation type
  const getMotionProps = (isHighlighted = false) => {
    // For users who prefer reduced motion, use minimal animations
    if (prefersReducedMotion) {
      return { 
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 }
      };
    }
    
    // Motion props based on animation type
    switch (animation) {
      case 'slide':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { 
            type: "spring",
            damping: 12,
            stiffness: 100,
            delay: isHighlighted ? delay + 0.2 : delay
          }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { 
            type: "spring",
            damping: 12,
            stiffness: 100,
            delay: isHighlighted ? delay + 0.2 : delay
          }
        };
      case 'none':
        return {};
      default: // fade
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { 
            duration: 0.5,
            delay: isHighlighted ? delay + 0.2 : delay
          }
        };
    }
  };
  
  // If using typewriter effect
  if (useTypewriter) {
    // State to control which typewriter is active
    const [firstLineComplete, setFirstLineComplete] = useState(false);
    const [firstLineVisible, setFirstLineVisible] = useState(true);
    const [secondLineVisible, setSecondLineVisible] = useState(false);
    
    useEffect(() => {
      // Start the loop after component mounts
      const interval = setInterval(() => {
        // First, clear second line
        setSecondLineVisible(false);
        
        // Wait for second line to clear, then clear first line
        setTimeout(() => {
          setFirstLineVisible(false);
          
          // After both lines are clear, show first line
          setTimeout(() => {
            setFirstLineVisible(true);
            
            // After first line is complete, show second line
            setTimeout(() => {
              setSecondLineVisible(true);
              
              // Keep both visible for a while before next cycle
            }, 2000);
          }, 1000);
        }, 1000);
      }, 12000); // Full cycle every 12 seconds (longer for better readability)
      
      // Initial state: show first line, then second line after delay
      setFirstLineVisible(true);
      setTimeout(() => {
        setSecondLineVisible(true);
      }, 2000);
      
      return () => clearInterval(interval);
    }, []);
    
    // Create a coordinated typewriter effect between the two phrases
    return (
      <Component className={`${className} ${alignClass} min-h-[calc(4em)] flex flex-col justify-center`}>
        <div className="flex flex-col">
          <div className="mb-2 min-h-[1.5em]">
            {firstLineVisible && (
              <TypewriterEffect 
                phrases={[text]}
                typingSpeed={100}
                deletingSpeed={80}
                delayBetweenPhrases={3000}
                infiniteLoop={false} 
                className="font-bold"
                cursorClassName="text-primary" 
                onComplete={() => setFirstLineComplete(true)}
              />
            )}
          </div>
          {highlightedText && (
            <div className="min-h-[1.5em]">
              {secondLineVisible && (
                <TypewriterEffect 
                  phrases={[highlightedText]}
                  typingSpeed={100}
                  deletingSpeed={80} 
                  delayBetweenPhrases={3000}
                  infiniteLoop={false} 
                  className={`font-bold ${highlightClasses}`}
                  cursorClassName={highlightColor}
                />
              )}
            </div>
          )}
        </div>
      </Component>
    );
  }
  
  // Split text into individual words (if animated)
  const words = animation !== 'none' ? text.split(' ') : [text];
  const highlightedWords = highlightedText && animation !== 'none' ? highlightedText.split(' ') : highlightedText ? [highlightedText] : [];
  
  // Animation variants for staggered appearance
  const container = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: prefersReducedMotion ? 0 : 0.12, 
        delayChildren: prefersReducedMotion ? 0 : delay * i 
      },
    }),
  };
  
  const child = {
    hidden: {
      opacity: prefersReducedMotion ? 1 : 0,
      y: prefersReducedMotion ? 0 : 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };
  
  // If no animation, render simple component
  if (animation === 'none') {
    return (
      <Component className={`${className} ${alignClass}`}>
        {text} {highlightedText && (
          <>
            <br />
            <span className={highlightClasses}>{highlightedText}</span>
          </>
        )}
      </Component>
    );
  }
  
  return (
    <Component className={`${className} ${alignClass}`}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="inline-flex flex-wrap"
      >
        {/* Render regular text words */}
        {words.map((word, index) => (
          <motion.span 
            key={index} 
            variants={child} 
            className="inline-block mr-[0.25em] relative"
            {...getMotionProps()}
          >
            {word}{' '}
          </motion.span>
        ))}
        
        {/* Add line break if there's highlighted text */}
        {highlightedWords.length > 0 && (
          <>
            <br className="w-full" />
            
            {/* Render highlighted words */}
            {highlightedWords.map((word, index) => (
              <motion.span 
                key={`highlighted-${index}`} 
                variants={child} 
                className={`inline-block mr-[0.25em] relative ${highlightClasses}`}
                {...getMotionProps(true)}
              >
                {word}{' '}
              </motion.span>
            ))}
          </>
        )}
      </motion.div>
    </Component>
  );
}

export default StaggeredTitle;
