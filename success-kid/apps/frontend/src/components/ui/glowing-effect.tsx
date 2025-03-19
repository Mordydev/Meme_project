'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GlowingEffectProps {
  children: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: 'light' | 'medium' | 'strong';
  pulseEffect?: boolean;
  className?: string;
  disabled?: boolean;
}

export function GlowingEffect({
  children,
  color = 'primary',
  size = 'md',
  intensity = 'medium',
  pulseEffect = true,
  className = '',
  disabled = false,
}: GlowingEffectProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Calculate size class and blur amount based on size prop
  const sizeMapping = {
    sm: { className: 'w-[150%] h-[150%]', blur: 'blur-md' },
    md: { className: 'w-[200%] h-[200%]', blur: 'blur-lg' },
    lg: { className: 'w-[250%] h-[250%]', blur: 'blur-xl' },
    xl: { className: 'w-[300%] h-[300%]', blur: 'blur-2xl' },
  };
  
  // Calculate opacity based on intensity prop
  const intensityMapping = {
    light: 'opacity-10',
    medium: 'opacity-20',
    strong: 'opacity-30',
  };
  
  // Calculate color class
  const colorClass = `bg-${color}`;
  
  // Handle mouse move to update glow position
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!elementRef.current || disabled) return;
    
    const rect = elementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };
  
  // Add animation variants for the glowing effect
  const glowVariants = {
    rest: { 
      opacity: pulseEffect ? 0.1 : 0, 
      scale: 0.85, 
    },
    hover: { 
      opacity: pulseEffect ? [0.2, 0.3, 0.2] : 0.25, 
      scale: 1,
      transition: {
        opacity: { repeat: pulseEffect ? Infinity : 0, duration: 2 },
        scale: { duration: 0.3 }
      }
    },
  };
  
  return (
    <div 
      ref={elementRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Glowing effect */}
      <motion.div
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${sizeMapping[size].className} ${sizeMapping[size].blur} ${colorClass} ${intensityMapping[intensity]} pointer-events-none transition-opacity z-0`}
        animate={isHovering ? 'hover' : 'rest'}
        variants={glowVariants}
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
