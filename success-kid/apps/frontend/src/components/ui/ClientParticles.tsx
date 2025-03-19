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
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {Array.from({ length: count }).map((_, i) => {
        // Use deterministic values based on index to avoid hydration mismatches
        const width = 8;
        const height = 8;
        const left = `${10 + (i * 5) % 80}%`;
        const top = `${5 + (i * 7) % 90}%`;
        
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-white/30"
            style={{
              width,
              height,
              left,
              top,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 10, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 5 + (i % 5),
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        );
      })}
    </div>
  );
}
