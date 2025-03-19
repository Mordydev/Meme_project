import React from 'react';
import { motion } from 'framer-motion';
import { TypewriterEffect } from '@/components/ui/typewriter-effect';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

export interface StaggeredTitleProps {
  text: string;
  highlightedText?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  highlightColor?: string;
  className?: string;
  delay?: number;
  useTypewriter?: boolean;
}

export function StaggeredTitle({
  text,
  highlightedText,
  as = 'h1',
  highlightColor = 'text-primary',
  className = '',
  delay = 0,
  useTypewriter = false
}: StaggeredTitleProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  
  // If using typewriter effect
  if (useTypewriter) {
    const phrases = highlightedText 
      ? [`${text} ${highlightedText}`] 
      : [text];
      
    const Component = as;
    return (
      <Component className={className}>
        <TypewriterEffect 
          phrases={phrases}
          typingSpeed={80}
          deletingSpeed={40}
          delayBetweenPhrases={1500}
          infiniteLoop={true}
          className="font-bold"
          cursorClassName={highlightColor}
        />
      </Component>
    );
  }
  
  // Split text into individual words
  const words = text.split(' ');
  const highlightedWords = highlightedText ? highlightedText.split(' ') : [];
  
  // Animation variants for staggered appearance
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: 0.12, 
        delayChildren: delay * i 
      },
    }),
  };
  
  const child = {
    hidden: {
      opacity: 0,
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
  
  const Component = as;
  return (
    <Component className={className}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Render regular text words */}
        {words.map((word, index) => (
          <motion.span key={index} variants={child} className="inline-block mr-[0.25em] relative">
            {word}{' '}
          </motion.span>
        ))}
        
        {/* Add line break if there's highlighted text */}
        {highlightedWords.length > 0 && (
          <>
            <br />
            
            {/* Render highlighted words */}
            {highlightedWords.map((word, index) => (
              <motion.span 
                key={`highlighted-${index}`} 
                variants={child} 
                className={`inline-block mr-[0.25em] relative ${highlightColor}`}
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
