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
}

export function TypewriterEffect({
  phrases,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayBetweenPhrases = 2000,
  className = '',
  cursorClassName = '',
  infiniteLoop = true,
}: TypewriterEffectProps) {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isBlinking, setIsBlinking] = useState(true);
  
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
        animate={{ opacity: isBlinking ? [1, 0, 1] : 1 }}
        transition={{
          duration: 0.8,
          repeat: isBlinking ? Infinity : 0,
          repeatType: 'loop',
        }}
      >
        _
      </motion.span>
    </span>
  );
}
