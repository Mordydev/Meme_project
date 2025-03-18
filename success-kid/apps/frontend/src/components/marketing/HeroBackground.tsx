'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import tokens from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface HeroBackgroundProps {
  className?: string;
}

export function HeroBackground({ className = '' }: HeroBackgroundProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation with canvas for performance
  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Create particles
    const particles: Particle[] = [];
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
      
      constructor() {
        this.x = Math.random() * canvas.offsetWidth;
        this.y = Math.random() * canvas.offsetHeight;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = Math.random() > 0.5 ? tokens.colors.primary[200] : tokens.colors.secondary[200];
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > canvas.offsetWidth) this.x = 0;
        else if (this.x < 0) this.x = canvas.offsetWidth;
        
        if (this.y > canvas.offsetHeight) this.y = 0;
        else if (this.y < 0) this.y = canvas.offsetHeight;
      }
      
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
      }
    }
    
    // Create initial particles
    const createParticles = () => {
      // Adjust number of particles based on screen size
      const particleCount = Math.min(
        50,
        Math.round((canvas.offsetWidth * canvas.offsetHeight) / 20000)
      );
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };
    
    createParticles();
    
    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      for (const particle of particles) {
        particle.update();
        particle.draw();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    let animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasDimensions);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);
  
  // Gradient overlay
  const gradientOverlayVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 0.8,
      transition: { duration: 2 }
    }
  };
  
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Canvas for dynamic particles */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      
      {/* Gradient overlay */}
      <motion.div 
        className="absolute inset-0"
        initial="initial"
        animate="animate"
        variants={gradientOverlayVariants}
        style={{
          background: `
            radial-gradient(circle at 20% 30%, ${tokens.colors.primary[50]}60 0%, transparent 30%),
            radial-gradient(circle at 80% 70%, ${tokens.colors.secondary[50]}60 0%, transparent 30%),
            linear-gradient(to bottom, white, #f5f5f5)
          `,
        }}
      />
    </div>
  );
}
