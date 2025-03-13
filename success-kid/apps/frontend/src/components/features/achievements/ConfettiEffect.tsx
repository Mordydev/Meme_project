'use client';

import React, { useRef, useEffect } from 'react';

/**
 * Props for ConfettiEffect component
 */
interface ConfettiEffectProps {
  duration?: number; // Animation duration in ms (default: 6000ms)
  particleCount?: number; // Number of confetti particles (default: 100)
  colors?: string[]; // Colors for confetti particles
  className?: string;
}

/**
 * Confetti particle effect for celebrations
 */
export function ConfettiEffect({
  duration = 6000,
  particleCount = 100,
  colors = ['#1E88E5', '#FFC107', '#4CAF50', '#F44336', '#9C27B0'],
  className = '',
}: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Create confetti particles
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(
        Math.random() * canvas.width, // x position
        Math.random() * canvas.height - canvas.height, // y position (above the viewport)
        Math.random() * 10 + 5, // size
        Math.random() * 3 - 1.5, // x velocity
        Math.random() * 3 + 2, // y velocity (always falling down)
        Math.random() * Math.PI * 2, // rotation
        Math.random() * 0.1 - 0.05, // rotation velocity
        colors[Math.floor(Math.random() * colors.length)] // random color
      ));
    }
    
    // Animation flags
    let animationId: number;
    let startTime = Date.now();
    
    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      for (const particle of particles) {
        particle.update();
        particle.draw(ctx);
        
        // Wrap particles around screen edges
        if (particle.y > canvas.height) {
          particle.y = -particle.size;
          particle.x = Math.random() * canvas.width;
        }
        
        if (particle.x < -particle.size) {
          particle.x = canvas.width + particle.size;
        } else if (particle.x > canvas.width + particle.size) {
          particle.x = -particle.size;
        }
      }
      
      // Check duration
      if (Date.now() - startTime < duration) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    // Start animation
    animationId = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [particleCount, colors, duration]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Particle class for confetti
 */
class Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  color: string;
  
  constructor(x: number, y: number, size: number, vx: number, vy: number, rotation: number, vr: number, color: string) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.vx = vx;
    this.vy = vy;
    this.rotation = rotation;
    this.vr = vr;
    this.color = color;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.vr;
    
    // Add some randomness to movement
    this.vx += Math.random() * 0.2 - 0.1;
    this.vx = Math.max(-1.5, Math.min(1.5, this.vx)); // Clamp velocity
    
    // Add gravity
    this.vy += 0.05;
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Draw a rectangular confetti piece
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    
    ctx.restore();
  }
}
