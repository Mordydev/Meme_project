'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowingEffectProps {
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'alert' | 'white';
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
  
  // Map color to the correct Tailwind class
  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-secondary';
      case 'accent':
        return 'bg-accent';
      case 'alert':
        return 'bg-alert';
      case 'white':
        return 'bg-white';
      default:
        return 'bg-primary';
    }
  };
  
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
      opacity: pulseEffect ? [0.25, 0.35, 0.25] : 0.3, 
      scale: 0.85,
      rotate: [0, 2, 0, -2, 0],
      boxShadow: [
        '0 0 20px rgba(30, 136, 229, 0.2)',
        '0 0 30px rgba(30, 136, 229, 0.3)',
        '0 0 20px rgba(30, 136, 229, 0.2)'
      ],
      transition: {
        opacity: { repeat: pulseEffect ? Infinity : 0, duration: 2 },
        rotate: { repeat: Infinity, duration: 8, ease: "easeInOut" },
        boxShadow: { repeat: Infinity, duration: 3, ease: "easeInOut" }
      }
    },
    hover: { 
      opacity: pulseEffect ? [0.4, 0.6, 0.4] : 0.55, 
      scale: 1.15,
      rotate: [0, 5, -5, 0],
      filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
      boxShadow: [
        '0 0 30px rgba(30, 136, 229, 0.4)',
        '0 0 50px rgba(30, 136, 229, 0.6)',
        '0 0 30px rgba(30, 136, 229, 0.4)'
      ],
      transition: {
        opacity: { repeat: pulseEffect ? Infinity : 0, duration: 1.2 },
        scale: { duration: 0.3, type: 'spring', stiffness: 400, damping: 10 },
        rotate: { repeat: pulseEffect ? Infinity : 0, duration: 6, ease: "easeInOut" },
        filter: { repeat: pulseEffect ? Infinity : 0, duration: 2 },
        boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" }
      }
    },
  };
  
  return (
    <div 
      ref={elementRef}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Glowing effect */}
      <motion.div
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-opacity z-0",
          sizeMapping[size].className,
          sizeMapping[size].blur,
          getColorClass(),
          intensityMapping[intensity]
        )}
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
