'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterEffectProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenPhrases?: number;
  className?: string;
  cursorClassName?: string;
  infiniteLoop?: boolean;
  onComplete?: () => void;
}

export function TypewriterEffect({
  phrases,
  typingSpeed = 80, // Faster typing for better effect
  deletingSpeed = 40, // Faster deleting for better effect
  delayBetweenPhrases = 3000,
  className = '',
  cursorClassName = '',
  infiniteLoop = true,
  onComplete,
}: TypewriterEffectProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isBlinking, setIsBlinking] = useState(true);
  // Always show cursor with consistent blinking
  const showCursor = true;
  
  // Use a ref to track if the component is still mounted
  const isMounted = useRef(true);
  
  // Phrase to type or delete
  const currentPhrase = phrases[phraseIndex];
  
  useEffect(() => {
    // Clean up on unmount
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Skip if component unmounted
      if (!isMounted.current) return;
      
      if (!isDeleting && displayText.length < currentPhrase.length) {
        // Typing effect
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
      } else if (!isDeleting && displayText.length === currentPhrase.length) {
        // Delay before deleting
        setIsBlinking(true);
        // Call the completion callback if provided
        if (onComplete) {
          onComplete();
        }
        setTimeout(() => {
          if (isMounted.current) {
            setIsDeleting(true);
            setIsBlinking(false);
          }
        }, delayBetweenPhrases);
      } else if (isDeleting && displayText.length > 0) {
        // Deleting effect
        setDisplayText(currentPhrase.substring(0, displayText.length - 1));
      } else if (isDeleting && displayText.length === 0) {
        // Move to next phrase
        setIsDeleting(false);
        setPhraseIndex((prevIndex) => 
          infiniteLoop 
            ? (prevIndex + 1) % phrases.length
            : Math.min(prevIndex + 1, phrases.length - 1)
        );
      }
    }, isDeleting ? deletingSpeed : typingSpeed);
    
    return () => clearTimeout(timeout);
  }, [
    currentPhrase, 
    displayText, 
    isDeleting, 
    typingSpeed, 
    deletingSpeed, 
    delayBetweenPhrases, 
    phrases.length,
    infiniteLoop
  ]);
  
  return (
    <span className={className}>
      {displayText}
      <motion.span
        className={`inline-block ${cursorClassName || 'text-primary font-bold'}`}
        animate={{ opacity: [1, 0, 1] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        |
      </motion.span>
    </span>
  );
}
