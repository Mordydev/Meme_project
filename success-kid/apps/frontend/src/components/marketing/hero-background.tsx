import React from 'react';
import { motion } from 'framer-motion';

export interface HeroBackgroundProps {
  className?: string;
}

export function HeroBackground({ className = '' }: HeroBackgroundProps) {
  // Deterministic particle positions to avoid hydration errors
  const particles = [
    { left: '49.34%', top: '46.43%' },
    { left: '15.70%', top: '96.91%' },
    { left: '54.23%', top: '83.00%' },
    { left: '2.54%', top: '28.47%' },
    { left: '74.78%', top: '2.40%' },
    { left: '62.98%', top: '46.29%' },
    { left: '27.96%', top: '73.88%' },
    { left: '94.62%', top: '18.12%' },
    { left: '7.01%', top: '77.02%' },
    { left: '56.96%', top: '43.00%' },
    { left: '91.34%', top: '25.13%' },
    { left: '75.02%', top: '42.93%' },
    { left: '72.37%', top: '79.07%' },
    { left: '69.36%', top: '29.68%' },
    { left: '70.47%', top: '80.96%' },
    { left: '89.13%', top: '59.22%' },
    { left: '46.40%', top: '62.27%' },
    { left: '21.56%', top: '91.91%' },
    { left: '50.51%', top: '86.78%' },
    { left: '16.00%', top: '50.64%' },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-primary/5"></div>
      
      {/* Animated blob 1 */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />
      
      {/* Animated blob 2 */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-secondary/5 blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 5
        }}
      />
      
      {/* Additional animated blob for more dynamics */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full bg-accent/5 blur-3xl"
        animate={{
          x: [0, 40, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 2
        }}
      />
      
      {/* Particle effect with deterministic positions */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + (i % 4),
              repeat: Infinity,
              delay: (i % 10) * 0.5,
            }}
          />
        ))}
      </div>
      
      {/* Additional particles with glow effect */}
      <div className="absolute inset-0">
        {particles.slice(0, 5).map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-secondary/30 shadow-lg shadow-secondary/20"
            style={{
              left: `${parseInt(particle.left) + 15}%`,
              top: `${parseInt(particle.top) - 10}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
              boxShadow: [
                '0 0 0px rgba(255, 193, 7, 0)',
                '0 0 20px rgba(255, 193, 7, 0.5)',
                '0 0 0px rgba(255, 193, 7, 0)'
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: (i % 5) * 2,
            }}
          />
        ))}
      </div>
      
      {/* Subtle light rays */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[50%] bg-gradient-radial from-primary-200 to-transparent"
          animate={{
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      </div>
      
      {/* Grid pattern overlay */}
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
