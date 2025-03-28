'use client';

import { motion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

interface ClientParticlesProps {
  count?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * ClientParticles - A component that renders animated particles
 * only on the client side to prevent hydration mismatches
 */
export function ClientParticles({ 
  count = 15, 
  className = '',
  children 
}: ClientParticlesProps) {
  // Only render on client
  const [isMounted, setIsMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{width: number; height: number; left: string; top: string; colorIndex: number}>>([]);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Generate particles once on client side
    const newParticles = Array.from({ length: count }).map((_, i) => {
      // Use deterministic values based on index to avoid hydration mismatches
      const width = 10 + (i % 5) * 2; // Larger particles
      const height = 10 + (i % 5) * 2;
      const left = `${10 + (i * 6) % 80}%`;
      const top = `${5 + (i * 7) % 90}%`;
      const colorIndex = i % 4; // 4 colors
      
      return { width, height, left, top, colorIndex };
    });
    
    setParticles(newParticles);
    console.log("ClientParticles mounted - UPDATED VERSION with improved hydration stability");
  }, [count]);
  
  if (!isMounted) {
    return <div className={className}>{children}</div>;
  }
  
  // Colors for particles
  const colors = [
    "bg-primary/50",
    "bg-secondary/50",
    "bg-accent/40",
    "bg-white/60",
  ];
  
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {particles.map((particle, i) => (
        <motion.div
          key={`particle-${i}`}
          className={`absolute rounded-full ${colors[particle.colorIndex]}`}
          style={{
            width: particle.width,
            height: particle.height,
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, i % 2 === 0 ? 20 : -20, 0],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 6 + (i % 5),
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
