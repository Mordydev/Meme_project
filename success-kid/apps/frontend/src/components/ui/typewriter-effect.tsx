'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterEffectProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenPhrases?: number;
  initialDelay?: number; // Add initialDelay property
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
  initialDelay = 0, // Default to no initial delay
  className = '',
  cursorClassName = '',
  infiniteLoop = true,
  onComplete,
}: TypewriterEffectProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  // Always show cursor for consistent experience regardless of typing state
  const showCursor = true; // Force cursor to always be visible
  
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
  
  // Apply initial delay only once at the start
  const [initialDelayApplied, setInitialDelayApplied] = useState(false);
  
  useEffect(() => {
    // Handle initial delay on first render only
    if (initialDelay > 0 && !initialDelayApplied) {
      const initialTimer = setTimeout(() => {
        setInitialDelayApplied(true);
      }, initialDelay);
      
      return () => clearTimeout(initialTimer);
    }
    
    // Don't start the typewriter animation until initial delay is completed
    if (initialDelay > 0 && !initialDelayApplied) {
      return;
    }
    
    const timeout = setTimeout(() => {
      // Skip if component unmounted
      if (!isMounted.current) return;
      
      if (!isDeleting && displayText.length < currentPhrase.length) {
        // Typing effect
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
      } else if (!isDeleting && displayText.length === currentPhrase.length) {
        // Delay before deleting - Keep visible longer before deletion
        // Call the completion callback if provided
        if (onComplete) {
          onComplete();
        }
        setTimeout(() => {
          if (isMounted.current) {
            // Only start deleting if this is the last phrase or infiniteLoop is enabled
            if (infiniteLoop || phraseIndex < phrases.length - 1) {
              setIsDeleting(true);
            }
          }
        }, delayBetweenPhrases); // Use the full delay time for better readability
      } else if (isDeleting && displayText.length > 0) {
        // Deleting effect - Make deletion a bit slower for better visibility
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
    }, isDeleting ? deletingSpeed * 1.5 : typingSpeed); // Slightly slower deletion for better effect
    
    return () => clearTimeout(timeout);
  }, [
    currentPhrase, 
    displayText, 
    isDeleting, 
    typingSpeed, 
    deletingSpeed, 
    delayBetweenPhrases, 
    phrases.length,
    infiniteLoop,
    phraseIndex,
    onComplete,
    initialDelay,
    initialDelayApplied
  ]);
  
  return (
    <span className={className}>
      {displayText}
      {showCursor && (
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
      )}
    </span>
  );
}
