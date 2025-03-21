'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // Canvas ref for background animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Function to handle navigation to home
  const navigateToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/');
  };
  
  // Initialize and run the particle animation
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match window
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Initialize canvas size
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Create particles
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      speed: number;
      direction: number;
      vx: number;
      vy: number;
    }> = [];
    
    // Create a blue color palette
    const blueColors = [
      'rgba(30, 136, 229, 0.3)',  // Primary
      'rgba(33, 150, 243, 0.2)',  // Lighter blue
      'rgba(21, 101, 192, 0.25)', // Darker blue
      'rgba(100, 181, 246, 0.15)', // Very light blue
      'rgba(30, 136, 229, 0.2)',  // Primary again
      'rgba(25, 118, 210, 0.25)',  // Medium blue
    ];
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      const radius = Math.random() * 2 + 1;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: radius,
        color: blueColors[Math.floor(Math.random() * blueColors.length)],
        speed: 0.1 + Math.random() * 0.2,
        direction: Math.random() * Math.PI * 2,
        vx: Math.cos(Math.random() * Math.PI * 2) * (0.1 + Math.random() * 0.2),
        vy: Math.sin(Math.random() * Math.PI * 2) * (0.1 + Math.random() * 0.2),
      });
    }
    
    // Animation function
    const animate = () => {
      // Clear canvas with very subtle blue gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(232, 244, 252, 1)'); // Very light blue
      gradient.addColorStop(1, 'rgba(247, 249, 252, 1)'); // Almost white
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw light rays
      const rayGradient = ctx.createRadialGradient(
        canvas.width * 0.5, 
        canvas.height * 0.3, 
        0, 
        canvas.width * 0.5, 
        canvas.height * 0.3, 
        canvas.height * 0.8
      );
      rayGradient.addColorStop(0, 'rgba(30, 136, 229, 0.05)');
      rayGradient.addColorStop(1, 'rgba(30, 136, 229, 0)');
      ctx.fillStyle = rayGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add a second light ray
      const rayGradient2 = ctx.createRadialGradient(
        canvas.width * 0.8, 
        canvas.height * 0.7, 
        0, 
        canvas.width * 0.8, 
        canvas.height * 0.7, 
        canvas.height * 0.6
      );
      rayGradient2.addColorStop(0, 'rgba(33, 150, 243, 0.03)');
      rayGradient2.addColorStop(1, 'rgba(33, 150, 243, 0)');
      ctx.fillStyle = rayGradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        // Move particles
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx = -particle.vx;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy = -particle.vy;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
      
      // Request next frame
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Canvas background for particles and rays */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full z-0"
      />

      {/* Logo in top center */}
      <motion.div 
        className="fixed top-8 left-1/2 transform -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Using direct handler instead of Link */}
        <div 
          onClick={navigateToHome}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10" />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SK</span>
          </span>
          <span className="text-lg font-bold text-primary-600">Success Kid</span>
        </div>
      </motion.div>

      {/* Back to home button - Using direct a tag */}
      <motion.div 
        className="fixed top-8 left-8 z-10"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {/* Using a direct anchor tag with onClick handler as a fallback */}
        <a 
          href="/"
          onClick={navigateToHome}
          className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/90 shadow-sm border border-gray-100 text-primary-600 hover:bg-white hover:shadow transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          <span>Home</span>
        </a>
      </motion.div>

      {/* Content container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full">
        {children}
      </div>

      {/* Copyright/branded footer */}
      <div className="fixed bottom-4 w-full text-center text-xs text-gray-400 z-10">
        <div className="flex justify-center items-center gap-1">
          Powered by <span className="font-semibold text-primary-600">Success Kid</span>
        </div>
      </div>
    </div>
  );
}
