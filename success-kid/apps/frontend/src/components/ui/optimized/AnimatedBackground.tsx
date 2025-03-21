'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AnimatedBackgroundProps {
  className?: string;
  type?: 'gradient' | 'particles' | 'noise' | 'wave';
  primaryColor?: string;
  secondaryColor?: string;
  speed?: 'slow' | 'medium' | 'fast';
  intensity?: 'light' | 'medium' | 'strong';
}

/**
 * Animated Background component for creating dynamic, moving backgrounds
 */
export function AnimatedBackground({
  className = '',
  type = 'gradient',
  primaryColor = 'from-primary/10',
  secondaryColor = 'to-secondary/10',
  speed = 'medium',
  intensity = 'medium',
}: AnimatedBackgroundProps) {
  // Map speed to animation duration
  const getDuration = () => {
    switch (speed) {
      case 'slow': return 20;
      case 'medium': return 12;
      case 'fast': return 6;
      default: return 12;
    }
  };
  
  // Map intensity to opacity and size
  const getIntensity = () => {
    switch (intensity) {
      case 'light': return { opacity: 'opacity-10', size: 'scale-75' };
      case 'medium': return { opacity: 'opacity-20', size: 'scale-100' };
      case 'strong': return { opacity: 'opacity-30', size: 'scale-125' };
      default: return { opacity: 'opacity-20', size: 'scale-100' };
    }
  };
  
  const intensityVals = getIntensity();
  const duration = getDuration();
  
  // Gradient background
  if (type === 'gradient') {
    return (
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          primaryColor,
          secondaryColor,
          intensityVals.opacity,
          "bg-[length:200%_200%]",
          className
        )}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />
    );
  }
  
  // Particles background
  if (type === 'particles') {
    // Using useEffect to only render on client side
    const [particles, setParticles] = React.useState<Array<{size: number, xPos: number, yPos: number, delay: number, xOffset: number}>>([]);
    const [isMounted, setIsMounted] = React.useState(false);
    
    // Only run particle generation on client side
    React.useEffect(() => {
      setIsMounted(true);
      const newParticles = Array.from({ length: 20 }).map((_, i) => ({
        size: 4 + (i % 4) * 2 + Math.random() * 2, // More deterministic with a little randomness
        xPos: 10 + (i * 4) % 80,
        yPos: 5 + (i * 5) % 80,
        delay: i * 0.2,
        xOffset: i % 2 === 0 ? 20 : -20
      }));
      setParticles(newParticles);
    }, []);
    
    if (!isMounted) {
      // Return empty div during server render
      return <div className={cn("absolute inset-0 overflow-hidden", className)} />;
    }
    
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        {/* Generate particles only on client side */}
        {particles.map((particle, i) => (
          <motion.div
            key={`particle-${i}`}
            className={cn(
              "absolute rounded-full",
              primaryColor.replace('from-', 'bg-'),
              intensityVals.opacity
            )}
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.xPos}%`,
              top: `${particle.yPos}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, particle.xOffset, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }
  
  // Noise background
  if (type === 'noise') {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        <div className="absolute inset-0 bg-[url('/noise.svg')] bg-repeat bg-center opacity-5" />
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            primaryColor,
            secondaryColor,
            "opacity-10 mix-blend-overlay"
          )}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 3, 0, -3, 0],
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    );
  }
  
  // Wave background
  if (type === 'wave') {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)}>
        {/* Multiple wave layers */}
        {[1, 2, 3].map((layer) => {
          const baseOpacity = layer === 1 ? 0.2 : layer === 2 ? 0.15 : 0.1;
          const layerOpacity = 
            intensity === 'light' ? baseOpacity * 0.5 :
            intensity === 'strong' ? baseOpacity * 1.5 :
            baseOpacity;
            
          const animationDelay = layer * 1.5;
          
          return (
            <motion.div
              key={`wave-${layer}`}
              className="absolute inset-0 rounded-[100%]"
              style={{
                backgroundColor: 'transparent',
                border: `${layer * 20}px solid rgba(30, 136, 229, ${layerOpacity})`,
                transform: 'scale(1)',
              }}
              animate={{
                scale: [1, 1.1 + (layer * 0.05), 1],
                opacity: [layerOpacity, layerOpacity * 0.7, layerOpacity],
              }}
              transition={{
                duration: duration / layer,
                repeat: Infinity,
                delay: animationDelay,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>
    );
  }
  
  return null;
}

export default AnimatedBackground;
