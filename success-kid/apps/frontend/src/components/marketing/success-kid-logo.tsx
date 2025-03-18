import React from 'react';
import { motion } from 'framer-motion';

export interface SuccessKidLogoProps {
  size?: number;
  className?: string;
}

export function SuccessKidLogo({ size = 100, className = '' }: SuccessKidLogoProps) {
  // Animation variants for the logo
  const logoVariants = {
    initial: { scale: 0.9, opacity: 0.5 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        yoyo: Infinity,
        repeatDelay: 5
      }
    }
  };

  // Fist pump animation
  const fistVariants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: [0, 15, 0],
      transition: { 
        duration: 1.5, 
        repeat: Infinity, 
        repeatDelay: 4
      }
    }
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial="initial"
      animate="animate"
      variants={logoVariants}
    >
      {/* Main logo circle */}
      <div className="absolute inset-0 rounded-full bg-primary overflow-hidden">
        {/* Success Kid silhouette */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            variants={fistVariants}
            className="relative h-1/2 w-1/2"
          >
            {/* Simplified Success Kid silhouette - can be enhanced with SVG */}
            <div className="absolute bottom-0 left-1/2 h-1/2 w-1/2 -translate-x-1/2 bg-black opacity-80 rounded-full"></div>
            <div className="absolute bottom-0 right-0 h-1/3 w-1/3 bg-black opacity-80 rounded-full"></div>
          </motion.div>
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute -inset-2 rounded-full bg-primary/30 blur-md -z-10"></div>
    </motion.div>
  );
}

export default SuccessKidLogo;
