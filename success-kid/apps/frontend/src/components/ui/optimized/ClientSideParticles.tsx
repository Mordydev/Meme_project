'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientSideParticlesProps {
  count?: number;
  colorClass?: string;
  animationDuration?: number;
  className?: string;
}

/**
 * ClientSideParticles - A component that handles particles rendering safely on the client side
 * to avoid hydration issues with Next.js
 */
export function ClientSideParticles({
  count = 20,
  colorClass = 'bg-white/10',
  animationDuration = 10,
  className = '',
}: ClientSideParticlesProps) {
  // Hold particle data in state to ensure it's only generated client-side
  const [particles, setParticles] = useState<Array<{
    size: number;
    xPos: number;
    yPos: number;
    opacity: number;
  }>>([]);

  // Generate particles only on client side
  useEffect(() => {
    const newParticles = Array.from({ length: count }).map(() => ({
      size: 4 + Math.random() * 6,
      xPos: Math.random() * 100,
      yPos: Math.random() * 100,
      opacity: 0.1 + Math.random() * 0.3,
    }));
    setParticles(newParticles);
    console.log('Client-side particles generated:', newParticles.length);
  }, [count]);

  // If no particles yet (server-side), return empty container
  if (particles.length === 0) {
    return <div className={className}></div>;
  }

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {particles.map((particle, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute rounded-full ${colorClass}`}
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.xPos}%`,
              top: `${particle.yPos}%`,
              opacity: particle.opacity,
            }}
            animate={{
              y: [0, -30 * (i % 2 === 0 ? 0.8 : 1.2), 0],
              x: [0, 15 * (i % 2 === 0 ? 0.7 : -0.7), 0],
              opacity: [particle.opacity * 0.5, particle.opacity, particle.opacity * 0.5],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: animationDuration + (i % 10),
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ClientSideParticles;
