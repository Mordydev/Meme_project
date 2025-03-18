import React from 'react';
import { motion } from 'framer-motion';

export interface StaggeredTitleProps {
  text: string;
  highlightedText?: string;
  className?: string;
  delay?: number;
}

export function StaggeredTitle({
  text,
  highlightedText,
  className = '',
  delay = 0
}: StaggeredTitleProps) {
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
      y: 20,
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
  
  return (
    <motion.div
      className={className}
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
              className="inline-block mr-[0.25em] relative text-primary"
            >
              {word}{' '}
            </motion.span>
          ))}
        </>
      )}
    </motion.div>
  );
}

export default StaggeredTitle;
