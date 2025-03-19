'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { TypewriterEffect } from '@/components/ui/typewriter-effect';

interface StaggeredTitleProps {
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
  
  // Convert the text to an array of words
  const words = text.split(' ');
  
  // Convert the highlighted text to an array of words (if provided)
  const highlightedWords = highlightedText ? highlightedText.split(' ') : [];
  
  // Create a parent variant for the container
  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      }
    }
  };
  
  // Create variants for the words
  const wordVariant = {
    hidden: { 
      y: prefersReducedMotion ? 0 : 20, 
      opacity: prefersReducedMotion ? 1 : 0 
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Determine which component to render based on the 'as' prop
  const Component = as;
  
  // If using typewriter effect
  if (useTypewriter) {
    const phrases = highlightedText 
      ? [`${text} ${highlightedText}`] 
      : [text];
      
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
  
  // Otherwise, use the staggered word animation
  return (
    <Component className={className}>
      <motion.span
        className="inline-block"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.25em] last:mr-0"
            variants={wordVariant}
          >
            {word}
          </motion.span>
        ))}
        {highlightedText && (
          <>
            <br />
            <motion.span
              className="inline-block"
              initial="hidden"
              animate="visible"
              variants={container}
            >
              {highlightedWords.map((word, i) => (
                <motion.span
                  key={i}
                  className={`inline-block mr-[0.25em] last:mr-0 ${highlightColor}`}
                  variants={wordVariant}
                >
                  {word}
                </motion.span>
              ))}
            </motion.span>
          </>
        )}
      </motion.span>
    </Component>
  );
}
