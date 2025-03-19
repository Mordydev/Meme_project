'use client';

import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface HeroBackgroundProps {
  className?: string;
  density?: 'low' | 'medium' | 'high';
  colorScheme?: 'primary' | 'secondary' | 'accent' | 'gradient';
  animate?: boolean;
}

export function HeroBackground({ 
  className = '',
  density = 'medium',
  colorScheme = 'primary',
  animate = true
}: HeroBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const particleCount = density === 'low' ? 10 : density === 'medium' ? 20 : 30;
  
  // Deterministic particle positions to avoid hydration errors
  const getParticlePosition = (index: number, total: number) => {
    // Use deterministic math based on index to create scattered effect
    const angle = (index / total) * Math.PI * 2;
    const radius = 30 + (index % 3) * 20;
    const xOffset = (index * 7.3) % 30;
    const yOffset = (index * 11.7) % 40;
    
    return {
      left: `${(50 + Math.cos(angle) * radius + xOffset).toFixed(2)}%`,
      top: `${(50 + Math.sin(angle) * radius + yOffset).toFixed(2)}%`
    };
  };
  
  // Generate particles with deterministic positions
  const particles = Array.from({ length: particleCount }, (_, i) => getParticlePosition(i, particleCount));
  
  // Get background colors based on colorScheme
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'secondary':
        return {
          gradient: 'bg-gradient-to-b from-white to-secondary/5',
          blob1: 'bg-secondary/5',
          blob2: 'bg-primary/5', 
          blob3: 'bg-secondary/10',
          particle: 'bg-secondary/20',
          glowParticle: 'bg-secondary/30 shadow-lg shadow-secondary/20'
        };
      case 'accent':
        return {
          gradient: 'bg-gradient-to-b from-white to-accent/5',
          blob1: 'bg-accent/5',
          blob2: 'bg-primary/5',
          blob3: 'bg-accent/10',
          particle: 'bg-accent/20',
          glowParticle: 'bg-accent/30 shadow-lg shadow-accent/20'
        };
      case 'gradient':
        return {
          gradient: 'bg-gradient-to-b from-white via-primary/5 to-secondary/5',
          blob1: 'bg-primary/5',
          blob2: 'bg-secondary/5',
          blob3: 'bg-accent/5',
          particle: 'bg-primary/20',
          glowParticle: 'bg-secondary/30 shadow-lg shadow-secondary/20'
        };
      default: // primary
        return {
          gradient: 'bg-gradient-to-b from-white to-primary/5',
          blob1: 'bg-primary/5',
          blob2: 'bg-secondary/5',
          blob3: 'bg-primary/10',
          particle: 'bg-primary/20',
          glowParticle: 'bg-primary/30 shadow-lg shadow-primary/20'
        };
    }
  };
  
  const colors = getColorClasses();

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 ${colors.gradient}`}></div>
      
      {/* Animated blobs - use motion.div only if animation is enabled */}
      {animate ? (
        <>
          <motion.div
            className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full ${colors.blob1} blur-3xl`}
            animate={!prefersReducedMotion ? {
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            } : undefined}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
          
          <motion.div
            className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full ${colors.blob2} blur-3xl`}
            animate={!prefersReducedMotion ? {
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1]
            } : undefined}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 5
            }}
          />
          
          <motion.div
            className={`absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full ${colors.blob3} blur-3xl`}
            animate={!prefersReducedMotion ? {
              x: [0, 40, 0],
              y: [0, -20, 0],
              scale: [1, 1.15, 1]
            } : undefined}
            transition={{
              duration: 18,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 2
            }}
          />
        </>
      ) : (
        <>
          <div className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full ${colors.blob1} blur-3xl`} />
          <div className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full ${colors.blob2} blur-3xl`} />
          <div className={`absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full ${colors.blob3} blur-3xl`} />
        </>
      )}
      
      {/* Particle effect with deterministic positions */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          animate ? (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${colors.particle}`}
              style={{
                left: particle.left,
                top: particle.top,
              }}
              animate={!prefersReducedMotion ? {
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              } : undefined}
              transition={{
                duration: 4 + (i % 4),
                repeat: Infinity,
                delay: (i % 10) * 0.5,
              }}
            />
          ) : (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${colors.particle} opacity-50`}
              style={{
                left: particle.left,
                top: particle.top,
              }}
            />
          )
        ))}
      </div>
      
      {/* Additional particles with glow effect */}
      {density !== 'low' && (
        <div className="absolute inset-0">
          {particles.slice(0, 5).map((particle, i) => (
            animate ? (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${colors.glowParticle}`}
                style={{
                  left: `${parseInt(particle.left) + 15}%`,
                  top: `${parseInt(particle.top) - 10}%`,
                }}
                animate={!prefersReducedMotion ? {
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                  boxShadow: [
                    '0 0 0px rgba(30, 136, 229, 0)',
                    '0 0 20px rgba(30, 136, 229, 0.5)',
                    '0 0 0px rgba(30, 136, 229, 0)'
                  ]
                } : undefined}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: (i % 5) * 2,
                }}
              />
            ) : (
              <div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${colors.glowParticle} opacity-30`}
                style={{
                  left: `${parseInt(particle.left) + 15}%`,
                  top: `${parseInt(particle.top) - 10}%`,
                }}
              />
            )
          ))}
        </div>
      )}
      
      {/* Subtle light rays - only if density is high */}
      {density === 'high' && animate && (
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[50%] bg-gradient-radial from-primary-200 to-transparent`}
            animate={!prefersReducedMotion ? {
              opacity: [0.2, 0.5, 0.2]
            } : undefined}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        </div>
      )}
      
      {/* Grid pattern overlay with very low opacity */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(to right, #6B7280 1px, transparent 1px), linear-gradient(to bottom, #6B7280 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}

export default HeroBackground;
