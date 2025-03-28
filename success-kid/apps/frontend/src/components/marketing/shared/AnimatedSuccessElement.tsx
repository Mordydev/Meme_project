'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Rename to better reflect what this component actually does
export interface AnimatedSuccessElementProps {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: 'rays' | 'particles' | 'minimal' | 'starburst';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  intensity?: 'low' | 'medium' | 'high';
}

export function AnimatedSuccessElement({ 
  size = 70, // Reduced size further from 80 to 70
  className = '',
  animated = true,
  variant = 'rays',
  color = 'primary',
  intensity = 'medium'
}: AnimatedSuccessElementProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Get color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case 'secondary':
        return {
          base: 'from-secondary-300/40 to-secondary-500/30', // Added transparency
          highlight: 'from-secondary-200/50 to-secondary-400/40', // Added transparency
          accent: 'from-primary-300/40 to-primary-500/30' // Added transparency
        };
      case 'accent':
        return {
          base: 'from-accent-300/40 to-accent-500/30', // Added transparency
          highlight: 'from-accent-200/50 to-accent-400/40', // Added transparency
          accent: 'from-primary-300/40 to-primary-500/30' // Added transparency
        };
      case 'white':
        return {
          base: 'from-white/40 to-white/50', // More transparent
          highlight: 'from-white/60 to-white/70', // More transparent
          accent: 'from-white/30 to-white/40' // More transparent
        };
      default: // primary
        return {
          base: 'from-yellow-300/40 to-yellow-500/30', // More transparent
          highlight: 'from-yellow-200/50 to-yellow-400/40', // More transparent
          accent: 'from-amber-300/40 to-amber-500/30' // More transparent
        };
    }
  };
  
  // Get the number of particles based on intensity
  const getParticleCount = () => {
    switch (intensity) {
      case 'low': return 8;
      case 'high': return 20;
      default: return 12; // medium
    }
  };
  
  const colors = getColorClasses();
  const particleCount = getParticleCount();
  
  // Animation variants for the container
  const containerVariants = {
    initial: { scale: 0.95, opacity: 0.4 },
    animate: { 
      scale: 1, 
      opacity: 0.8, // More transparent
      transition: { 
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };
  
  // Starburst rays animation variants
  const raysVariants = {
    initial: { scale: 0.9, opacity: 0.1 }, // More subtle
    animate: { 
      scale: prefersReducedMotion ? 1 : [0.9, 1.05, 0.95, 1], // Less scaling
      opacity: prefersReducedMotion ? 0.3 : [0.1, 0.3, 0.2, 0.3], // More transparent
      rotate: prefersReducedMotion ? 0 : [0, 15, 5, 20, 0], // Less rotation
      transition: { 
        duration: 10, // Longer duration for subtlety
        repeat: Infinity, 
        repeatType: 'loop',
        times: [0, 0.3, 0.6, 0.8, 1]
      }
    }
  };
  
  // Core glow animation
  const glowVariants = {
    initial: { scale: 0.95, opacity: 0.2 }, // More subtle
    animate: {
      scale: prefersReducedMotion ? 1 : [0.95, 1.08, 0.97, 1.05, 1], // Less scaling
      opacity: prefersReducedMotion ? 0.3 : [0.2, 0.4, 0.25, 0.35, 0.3], // More transparent
      transition: {
        duration: 8, // Longer duration
        repeat: Infinity,
        repeatType: 'loop',
        times: [0, 0.25, 0.5, 0.75, 1]
      }
    }
  };

  // Render different variants
  const renderContent = () => {
    // Rays starburst effect
    if (variant === 'rays') {
      return (
        <div className="relative w-full h-full">
          {/* Base glow circle */}
          <motion.div 
            className={`absolute inset-[20%] rounded-full bg-gradient-to-br ${colors.highlight} z-10 flex items-center justify-center opacity-80`}
            animate={animated ? {
              boxShadow: ['0 0 15px rgba(255,255,255,0.15)', '0 0 25px rgba(255,255,255,0.25)', '0 0 15px rgba(255,255,255,0.15)'],
            } : {}}
            transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
          >
            {/* Achievement icon in the center */}
            <motion.div
              className="text-2xl" // Smaller icon
              animate={animated && !prefersReducedMotion ? { 
                scale: [1, 1.05, 1], // Less scaling
                rotate: [0, 3, -3, 0] // Less rotation
              } : {}}
              transition={{ 
                duration: 5, // Slower animation
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut'
              }}
            >
              🔥
            </motion.div>
          </motion.div>
          
          {/* Rays emanating from center - fewer rays */}
          <motion.div
            className="absolute inset-0"
            variants={raysVariants}
            initial="initial"
            animate={animated ? "animate" : "initial"}
          >
            {/* Generate rays dynamically - reduced count to 8 */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * 360;
              return (
                <motion.div
                  key={`ray-${i}`}
                  className={`absolute top-1/2 left-1/2 h-[110%] w-[2px] bg-gradient-to-b ${colors.base} origin-bottom opacity-50`} // Thinner rays
                  style={{ 
                    transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                  animate={animated && !prefersReducedMotion ? { 
                    height: [`${105 + (i % 3) * 5}%`, `${110 + (i % 3) * 8}%`, `${105 + (i % 3) * 5}%`], // Less height variation
                    opacity: [0.3, 0.5, 0.3] // More transparent
                  } : {}}
                  transition={{ 
                    duration: 4 + (i % 3), // Slower animation
                    repeat: Infinity,
                    repeatType: 'reverse',
                    delay: i * 0.3
                  }}
                />
              );
            })}
          </motion.div>
          
          {/* Outer glow effect - more subtle */}
          <motion.div 
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.base} opacity-15 blur-lg`} // More blur, less opacity
            variants={glowVariants}
            initial="initial"
            animate={animated ? "animate" : "initial"}
          />
        </div>
      );
    }
    
    // Particles effect
    if (variant === 'particles') {
      return (
        <div className="relative w-full h-full">
          {/* Central glowing core */}
          <motion.div 
            className={`absolute inset-[15%] rounded-full bg-gradient-to-br ${colors.highlight} z-10 flex items-center justify-center`}
            animate={animated ? {
              boxShadow: ['0 0 30px rgba(255,255,255,0.3)', '0 0 50px rgba(255,255,255,0.5)', '0 0 30px rgba(255,255,255,0.3)'],
            } : {}}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
          >
            {/* Achievement icon */}
            <motion.div
              className="text-3xl"
              animate={animated && !prefersReducedMotion ? { 
                scale: [1, 1.1, 1], 
                rotate: [0, -5, 5, 0] 
              } : {}}
              transition={{ 
                duration: 4, 
                repeat: Infinity 
              }}
            >
              🔥
            </motion.div>
          </motion.div>
          
          {/* Particles floating around */}
          {Array.from({ length: particleCount }).map((_, i) => {
            const particleSize = 4 + (i % 3) * 2;
            const orbitSize = 0.7 + (i % 5) * 0.1;
            const speed = 15 + (i % 10);
            const delay = i * 1.5;
            const startAngle = (i / particleCount) * 360;
            
            return (
              <motion.div
                key={`particle-${i}`}
                className={`absolute rounded-full bg-gradient-to-br ${i % 2 === 0 ? colors.base : colors.accent} shadow-lg z-[5]`}
                style={{ 
                  width: particleSize,
                  height: particleSize,
                  top: '50%',
                  left: '50%',
                  x: '-50%',
                  y: '-50%',
                }}
                animate={animated && !prefersReducedMotion ? {
                  x: [`calc(-50% + ${Math.cos(startAngle * Math.PI / 180) * size * orbitSize}px)`, `calc(-50% + ${Math.cos((startAngle + 360) * Math.PI / 180) * size * orbitSize}px)`],
                  y: [`calc(-50% + ${Math.sin(startAngle * Math.PI / 180) * size * orbitSize}px)`, `calc(-50% + ${Math.sin((startAngle + 360) * Math.PI / 180) * size * orbitSize}px)`],
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1.2, 0.8]
                } : {}}
                transition={{
                  duration: speed,
                  ease: "linear",
                  repeat: Infinity,
                  delay: delay,
                }}
              />
            );
          })}
          
          {/* Outer glow */}
          <motion.div 
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.base} opacity-20 blur-md`}
            variants={glowVariants}
            initial="initial"
            animate={animated ? "animate" : "initial"}
          />
        </div>
      );
    }
    
    // Starburst - explosive energy effect
    if (variant === 'starburst') {
      return (
        <div className="relative w-full h-full">
          {/* Central core */}
          <motion.div 
            className={`absolute inset-[20%] rounded-full bg-gradient-to-br ${colors.highlight} z-10 flex items-center justify-center`}
            animate={animated && !prefersReducedMotion ? {
              boxShadow: ['0 0 30px rgba(255,255,255,0.3)', '0 0 60px rgba(255,255,255,0.6)', '0 0 30px rgba(255,255,255,0.3)'],
              scale: [1, 1.1, 0.95, 1]
            } : {}}
            transition={{ 
              boxShadow: { duration: 3, repeat: Infinity, repeatType: 'reverse' },
              scale: { duration: 5, repeat: Infinity, repeatType: 'loop' }
            }}
          >
            {/* Achievement icon */}
            <motion.div
              className="text-3xl"
              animate={animated && !prefersReducedMotion ? { 
                scale: [1, 1.3, 1], 
                rotate: [0, 15, -15, 0] 
              } : {}}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                repeatType: 'loop'
              }}
            >
              🔥
            </motion.div>
          </motion.div>
          
          {/* Energy burst lines */}
          <div className="absolute inset-0">
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * 360;
              const length = 50 + (i % 4) * 10;
              const width = 2 + (i % 3);
              
              return (
                <motion.div
                  key={`burst-${i}`}
                  className={`absolute top-1/2 left-1/2 bg-gradient-to-b ${colors.base} rounded-full`}
                  style={{ 
                    height: `${length}%`,
                    width: `${width}px`,
                    transformOrigin: 'top center',
                    transform: `translate(-50%, 0%) rotate(${angle}deg)`,
                  }}
                  animate={animated && !prefersReducedMotion ? {
                    height: [`${length - 10}%`, `${length + 15}%`, `${length - 10}%`],
                    opacity: [0.3, 0.8, 0.3],
                    filter: ['blur(0px)', 'blur(1px)', 'blur(0px)']
                  } : {}}
                  transition={{
                    duration: 4 + (i % 3),
                    repeat: Infinity,
                    repeatType: 'loop',
                    delay: i * 0.1,
                  }}
                />
              );
            })}
          </div>
          
          {/* Spinning outer ring */}
          <motion.div
            className={`absolute inset-[5%] border-[2px] border-dashed rounded-full border-opacity-40`}
            style={{ borderColor: color === 'primary' ? '#1E88E5' : color === 'secondary' ? '#FFC107' : color === 'accent' ? '#4CAF50' : '#FFFFFF' }}
            animate={animated && !prefersReducedMotion ? {
              rotate: [0, 360],
              borderWidth: ['2px', '3px', '2px'],
              opacity: [0.3, 0.6, 0.3],
            } : {}}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
              borderWidth: { duration: 5, repeat: Infinity, repeatType: 'reverse' },
              opacity: { duration: 5, repeat: Infinity, repeatType: 'reverse' },
            }}
          />
          
          {/* Outer glow effect */}
          <motion.div 
            className={`absolute inset-[-10%] rounded-full bg-gradient-to-br ${colors.base} opacity-10 blur-xl`}
            variants={glowVariants}
            initial="initial"
            animate={animated ? "animate" : "initial"}
          />
        </div>
      );
    }
    
    // Minimal mode - just a glowing circle
    return (
      <div className="relative w-full h-full">
        <motion.div
          className={`absolute inset-[10%] rounded-full bg-gradient-to-br ${colors.base} flex items-center justify-center`}
          animate={animated && !prefersReducedMotion ? {
            boxShadow: ['0 0 20px rgba(255,255,255,0.2)', '0 0 40px rgba(255,255,255,0.4)', '0 0 20px rgba(255,255,255,0.2)'],
          } : {}}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
        >
          <motion.div
            className="text-3xl"
            animate={animated && !prefersReducedMotion ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            🔥
          </motion.div>
        </motion.div>
        
        {/* Subtle glow behind */}
        <motion.div 
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.highlight} opacity-30 blur-md`}
          animate={animated && !prefersReducedMotion ? {
            scale: [0.9, 1.1, 0.9],
            opacity: [0.2, 0.4, 0.2],
          } : {}}
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
    );
  };

  return (
    <motion.div 
      className={`relative ${className} scale-70`} // Scale down further from 75 to 70
      style={{ width: size, height: size }}
      initial="initial"
      animate={animated ? "animate" : "initial"}
      variants={containerVariants}
    >
      {renderContent()}
    </motion.div>
  );
}

// For backward compatibility, keep the old name as an alias
export const SuccessKidLogo = AnimatedSuccessElement;

export default AnimatedSuccessElement;
