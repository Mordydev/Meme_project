'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LazySectionProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  fallback?: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  delay?: number;
}

/**
 * LazySection - A performance-optimized component that renders its children
 * only when they enter the viewport, with optional animation.
 * 
 * This saves resources by not rendering heavy components until they're needed,
 * and improves performance when many components are on the page.
 */
export function LazySection({
  children,
  threshold = 0.1,
  rootMargin = '0px',
  once = true,
  fallback,
  className = '',
  animation = 'fade',
  delay = 0
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const currentRef = ref.current;
    
    if (!currentRef) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(currentRef);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(currentRef);
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once, rootMargin, threshold]);
  
  // Animation variants based on animation type
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.6, delay } }
    },
    slide: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.6, delay } }
    },
    none: {
      hidden: {},
      visible: {}
    }
  };
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={variants[animation]}
    >
      {isVisible ? children : fallback || <div className="min-h-[100px]" />}
    </motion.div>
  );
}
