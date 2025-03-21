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
  const particleCount = density === 'low' ? 15 : density === 'medium' ? 30 : 45;
  
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
          gradient: 'bg-gradient-to-b from-white to-secondary-500/5',
          blob1: 'bg-secondary-500/5',
          blob2: 'bg-primary-500/5', 
          blob3: 'bg-secondary-500/10',
          particle: 'bg-secondary-500/20',
          glowParticle: 'bg-secondary-500/30 shadow-lg shadow-secondary-500/20'
        };
      case 'accent':
        return {
          gradient: 'bg-gradient-to-b from-white to-accent-500/5',
          blob1: 'bg-accent-500/5',
          blob2: 'bg-primary-500/5',
          blob3: 'bg-accent-500/10',
          particle: 'bg-accent-500/20',
          glowParticle: 'bg-accent-500/30 shadow-lg shadow-accent-500/20'
        };
      case 'gradient':
        return {
          gradient: 'bg-gradient-to-br from-white via-primary-500/10 to-secondary-500/10',
          blob1: 'bg-primary-500/10',
          blob2: 'bg-secondary-500/10',
          blob3: 'bg-accent-500/10',
          particle: 'bg-primary-500/20',
          glowParticle: 'bg-secondary-500/30 shadow-lg shadow-secondary-500/20'
        };
      default: // primary
        return {
          gradient: 'bg-gradient-to-br from-white via-primary-300/10 to-primary-500/10',
          blob1: 'bg-primary-500/10',
          blob2: 'bg-secondary-500/10',
          blob3: 'bg-primary-500/15',
          particle: 'bg-primary-500/20',
          glowParticle: 'bg-primary-500/30 shadow-lg shadow-primary-500/20'
        };
    }
  };
  
  const colors = getColorClasses();

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Background gradient with subtle animation */}
      {animate ? (
        <motion.div 
          className={`absolute inset-0 ${colors.gradient}`}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            boxShadow: [
              'inset 0 0 50px rgba(30,136,229,0.05)',
              'inset 0 0 100px rgba(30,136,229,0.1)',
              'inset 0 0 50px rgba(30,136,229,0.05)'
            ]
          }}
          transition={{
            backgroundPosition: {
              duration: 15,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'reverse'
            },
            boxShadow: {
              duration: 8,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'reverse'
            }
          }}
          style={{ 
            backgroundSize: '200% 200%',
            boxShadow: 'inset 0 0 50px rgba(30,136,229,0.05)'
          }}
        />
      ) : (
        <div className={`absolute inset-0 ${colors.gradient}`}></div>
      )}
      
      {/* Animated blobs - use motion.div only if animation is enabled */}
      {animate ? (
        <>
          <motion.div
            className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full ${colors.blob1} blur-3xl`}
            style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(30,136,229,0.12) 0%, rgba(30,136,229,0.03) 70%)',
              boxShadow: '0 0 80px 10px rgba(30,136,229,0.12)'
            }}
            animate={!prefersReducedMotion ? {
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
              rotate: [0, 3, 0, -2, 0],
              background: [
                'radial-gradient(circle, rgba(30,136,229,0.12) 0%, rgba(30,136,229,0.03) 70%)',
                'radial-gradient(circle, rgba(30,136,229,0.18) 0%, rgba(30,136,229,0.05) 70%)',
                'radial-gradient(circle, rgba(30,136,229,0.12) 0%, rgba(30,136,229,0.03) 70%)'
              ],
              boxShadow: [
                '0 0 80px 10px rgba(30,136,229,0.12)',
                '0 0 100px 20px rgba(30,136,229,0.18)',
                '0 0 80px 10px rgba(30,136,229,0.12)'
              ]
            } : undefined}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
          
          <motion.div
            className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full ${colors.blob2} blur-3xl`}
            style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(255,193,7,0.12) 0%, rgba(255,193,7,0.03) 70%)',
              boxShadow: '0 0 80px 10px rgba(255,193,7,0.12)'
            }}
            animate={!prefersReducedMotion ? {
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
              rotate: [0, -3, 0, 2, 0],
              background: [
                'radial-gradient(circle, rgba(255,193,7,0.12) 0%, rgba(255,193,7,0.03) 70%)',
                'radial-gradient(circle, rgba(255,193,7,0.18) 0%, rgba(255,193,7,0.05) 70%)',
                'radial-gradient(circle, rgba(255,193,7,0.12) 0%, rgba(255,193,7,0.03) 70%)'
              ],
              boxShadow: [
                '0 0 80px 10px rgba(255,193,7,0.12)',
                '0 0 100px 20px rgba(255,193,7,0.18)',
                '0 0 80px 10px rgba(255,193,7,0.12)'
              ]
            } : undefined}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 5
            }}
          />
          
          {/* Add back a more subtle third blob with yellow tones instead of blue */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-yellow-300/10 blur-3xl"
            style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(255,193,7,0.10) 0%, rgba(255,193,7,0.02) 70%)',
              boxShadow: '0 0 60px 10px rgba(255,193,7,0.08)'
            }}
            animate={!prefersReducedMotion ? {
              x: [0, -30, 0],
              y: [0, 20, 0],
              scale: [1, 1.15, 1],
              rotate: [0, -2, 0, 1, 0],
              opacity: [0.5, 0.7, 0.5],
              background: [
                'radial-gradient(circle, rgba(255,193,7,0.10) 0%, rgba(255,193,7,0.02) 70%)',
                'radial-gradient(circle, rgba(255,193,7,0.15) 0%, rgba(255,193,7,0.04) 70%)',
                'radial-gradient(circle, rgba(255,193,7,0.10) 0%, rgba(255,193,7,0.02) 70%)'
              ]
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
          <div className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full ${colors.blob1} blur-3xl`} style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(30,136,229,0.10) 0%, rgba(30,136,229,0.02) 70%)',
              boxShadow: '0 0 80px 10px rgba(30,136,229,0.10)'
            }} />
          <div className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full ${colors.blob2} blur-3xl`} style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(255,193,7,0.10) 0%, rgba(255,193,7,0.02) 70%)',
              boxShadow: '0 0 80px 10px rgba(255,193,7,0.10)'
            }} />
          {/* Subtle yellow-toned third blob */}
          <div className="absolute top-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-yellow-300/10 blur-3xl" style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(255,193,7,0.08) 0%, rgba(255,193,7,0.01) 70%)',
              boxShadow: '0 0 60px 10px rgba(255,193,7,0.06)'
            }} />
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
      
      {/* Enhanced light rays - only if density is high or animate is enabled */}
      {(density === 'high' || (animate && colorScheme === 'gradient')) && (
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[50%] bg-gradient-radial from-primary-200 to-transparent`}
            animate={!prefersReducedMotion ? {
              opacity: [0.2, 0.5, 0.2],
              scale: [0.9, 1.1, 0.9],
              backgroundPosition: ['center center', '51% 49%', 'center center']
            } : undefined}
            transition={{
              opacity: {
                duration: 8,
                repeat: Infinity,
                repeatType: 'reverse'
              },
              scale: {
                duration: 12,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              },
              backgroundPosition: {
                duration: 15,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }
            }}
          />
          
          {/* Additional dynamic ray effect - subtle diagonal light beam */}
          {animate && !prefersReducedMotion && (
            <motion.div 
              className="absolute inset-0 opacity-0" 
              style={{
                background: 'linear-gradient(135deg, rgba(30,136,229,0.03) 0%, transparent 50%, rgba(255,193,7,0.03) 100%)'
              }}
              animate={{ 
                opacity: [0, 0.15, 0],
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
              }}
              transition={{ 
                opacity: {
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                },
                backgroundPosition: {
                  duration: 25,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear"
                }
              }}
            />
          )}
        </div>
      )}
      
      {/* Grid pattern overlay with very low opacity */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(to right, #6B7280 1px, transparent 1px), linear-gradient(to bottom, #6B7280 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Enhanced shimmer effect */}
      {animate && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 opacity-0"
          style={{
            background: 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)',
            backgroundSize: '200% 200%'
          }}
          animate={{
            opacity: [0, 0.08, 0],
            backgroundPosition: ['-100% -100%', '200% 200%']
          }}
          transition={{
            opacity: {
              duration: 3,
              repeat: Infinity,
              repeatDelay: 8,
              ease: "easeInOut"
            },
            backgroundPosition: {
              duration: 5,
              repeat: Infinity,
              repeatDelay: 8,
              ease: "easeInOut"
            }
          }}
        />
      )}
    </div>
  );
}

export default HeroBackground;
