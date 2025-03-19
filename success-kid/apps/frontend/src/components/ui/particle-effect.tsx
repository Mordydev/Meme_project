'use client';

import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface ParticleEffectProps {
  count?: number;
  color?: string;
  duration?: number;
  size?: number;
  spread?: number;
  className?: string;
  trigger?: 'hover' | 'click' | 'auto';
}

export function ParticleEffect({
  count = 20,
  color = 'primary',
  duration = 2,
  size = 8,
  spread = 100,
  className = '',
  trigger = 'hover',
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotionPreference();
  
  // Generate initial particle positions
  const generateParticles = () => {
    const newParticles = Array.from({ length: prefersReducedMotion ? Math.min(count, 10) : count }).map((_, i) => ({
      id: i,
      x: 0,
      y: 0,
    }));
    setParticles(newParticles);
  };
  
  // Initialize particles on mount
  useEffect(() => {
    generateParticles();
  }, []);
  
  // Run the particle effect animation
  const runEffect = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    // Start the animation for each particle
    controls.start((i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spread;
      
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        scale: [1, 0],
        opacity: [1, 0],
        transition: { 
          duration: duration * (0.7 + Math.random() * 0.3), 
          ease: ['easeOut'] 
        }
      };
    });
    
    // Reset after animation completes
    setTimeout(() => {
      setIsPlaying(false);
    }, duration * 1000);
  };
  
  // Auto-play effect if trigger is 'auto'
  useEffect(() => {
    if (trigger === 'auto') {
      const interval = setInterval(() => {
        runEffect();
      }, duration * 1000 * 2); // Run at interval of twice the duration
      
      return () => clearInterval(interval);
    }
  }, [trigger, duration, isPlaying]);
  
  const getEventHandlers = () => {
    if (trigger === 'hover') {
      return {
        onMouseEnter: runEffect,
        onTouchStart: runEffect,
      };
    }
    
    if (trigger === 'click') {
      return {
        onClick: runEffect,
      };
    }
    
    return {};
  };
  
  return (
    <div className={`relative ${className}`} {...getEventHandlers()}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          custom={particle.id}
          animate={controls}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          className={`absolute top-1/2 left-1/2 rounded-full bg-${color}/80`}
          style={{
            width: size,
            height: size,
            transformOrigin: 'center center',
          }}
        />
      ))}
    </div>
  );
}
