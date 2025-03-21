'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/optimized/GlassCard';
import { 
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter 
} from '@/components/ui/optimized/glass/card-components';
import { motion } from 'framer-motion';
import { ClientParticles } from '@/components/ui/ClientParticles';

export default function GlassTestPage() {
  const [activeCard, setActiveCard] = useState('complete');
  
  return (
    <ClientParticles count={20} className="relative overflow-hidden min-h-screen">
      {/* Background with rays */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"></div>
        
        {/* Animated rays */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div 
            key={`ray-${i}`}
            className="absolute top-0 left-1/2 h-full w-[1px] bg-gradient-to-b from-primary/30 via-primary/5 to-transparent"
            style={{ 
              translateX: `-${i * 20}px`,
              rotate: `${i * 5}deg`,
              transformOrigin: 'top'
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.05, 1],
              filter: ['blur(1px)', 'blur(2px)', 'blur(1px)']
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* Light orbs */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div 
            key={`orb-${i}`}
            className="absolute rounded-full bg-gradient-to-br from-primary/20 to-secondary/10"
            style={{
              width: `${100 + i * 20}px`,
              height: `${100 + i * 20}px`,
              top: `${10 + (i * 15)}%`,
              left: `${5 + (i * 20)}%`,
              filter: 'blur(40px)'
            }}
            animate={{
              x: [0, 20, 0, -20, 0],
              y: [0, 15, 0, -15, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold mb-6">GlassCard Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => setActiveCard('basic')}
            className={`px-4 py-2 rounded-lg ${activeCard === 'basic' ? 'bg-primary text-white' : 'bg-white'}`}
          >
            Basic GlassCard
          </button>
          <button 
            onClick={() => setActiveCard('gradient')}
            className={`px-4 py-2 rounded-lg ${activeCard === 'gradient' ? 'bg-primary text-white' : 'bg-white'}`}
          >
            Gradient Background
          </button>
          <button 
            onClick={() => setActiveCard('glow')}
            className={`px-4 py-2 rounded-lg ${activeCard === 'glow' ? 'bg-primary text-white' : 'bg-white'}`}
          >
            Glowing Border
          </button>
          <button 
            onClick={() => setActiveCard('complete')}
            className={`px-4 py-2 rounded-lg ${activeCard === 'complete' ? 'bg-primary text-white' : 'bg-white'}`}
          >
            Complete Solution
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Basic Glass Card */}
          {activeCard === 'basic' && (
            <GlassCard className="p-6 col-span-full">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Basic Glass Card</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mb-4">This is a basic glass card with default settings. It features a frosted glass effect with subtle transparency.</p>
                <div className="flex gap-2">
                  <span className="bg-primary/20 px-2 py-1 rounded-md text-sm">glassOpacity: 0.6</span>
                  <span className="bg-primary/20 px-2 py-1 rounded-md text-sm">glassBlur: 'lg'</span>
                </div>
              </CardContent>
            </GlassCard>
          )}
          
          {/* Gradient Background Card */}
          {activeCard === 'gradient' && (
            <GlassCard 
              className="p-6 col-span-full" 
              gradientBackground={true}
              gradientColors="from-primary/10 via-white/90 to-secondary/10"
            >
              <CardHeader className="px-0 pt-0">
                <CardTitle>Gradient Background</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mb-4">This card uses a gradient background that smoothly blends between colors, creating a more vibrant appearance.</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-primary/20 px-2 py-1 rounded-md text-sm">gradientBackground: true</span>
                  <span className="bg-primary/20 px-2 py-1 rounded-md text-sm">gradientColors: "from-primary/10 via-white/90 to-secondary/10"</span>
                </div>
              </CardContent>
            </GlassCard>
          )}
          
          {/* Glowing Border Card */}
          {activeCard === 'glow' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 col-span-full">
              <GlassCard 
                className="p-6" 
                borderGlow={true}
                borderGlowIntensity="light"
                gradientBackground={true}
              >
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Light Glow</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <p className="mb-4">A subtle glowing border effect.</p>
                  <div className="bg-primary/20 px-2 py-1 rounded-md text-sm inline-block">borderGlowIntensity: "light"</div>
                </CardContent>
              </GlassCard>
              
              <GlassCard 
                className="p-6" 
                borderGlow={true}
                borderGlowIntensity="medium"
                gradientBackground={true}
              >
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Medium Glow</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <p className="mb-4">A standard glowing border effect.</p>
                  <div className="bg-primary/20 px-2 py-1 rounded-md text-sm inline-block">borderGlowIntensity: "medium"</div>
                </CardContent>
              </GlassCard>
              
              <GlassCard 
                className="p-6" 
                borderGlow={true}
                borderGlowIntensity="strong"
                gradientBackground={true}
              >
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Strong Glow</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <p className="mb-4">An intense glowing border effect.</p>
                  <div className="bg-primary/20 px-2 py-1 rounded-md text-sm inline-block">borderGlowIntensity: "strong"</div>
                </CardContent>
              </GlassCard>
            </div>
          )}
          
          {/* Complete Solution */}
          {activeCard === 'complete' && (
            <GlassCard 
              className="p-6 col-span-full" 
              gradientBackground={true}
              gradientBorder={true}
              borderGlow={true}
              borderGlowIntensity="medium"
              hoverEffect={true}
            >
              <CardHeader className="px-0 pt-0">
                <CardTitle>Complete Glass Card Solution</CardTitle>
                <CardDescription>Our optimal glass card implementation with all features</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mb-4">This card uses all of our optimized features:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Gradient background for subtle color transition</li>
                  <li>Gradient border for a premium appearance</li>
                  <li>Glowing effect for depth and emphasis</li>
                  <li>Hover animation for interactivity</li>
                  <li>No internal borders for a clean look</li>
                </ul>
              </CardContent>
              <CardFooter className="px-0 pb-0">
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-primary/20 px-2 py-1 rounded-md text-sm">gradientBackground: true</span>
                  <span className="bg-primary/20 px-2 py-1 rounded-md text-sm">gradientBorder: true</span>
                  <span className="bg-primary/20 px-2 py-1 rounded-md text-sm">borderGlow: true</span>
                </div>
              </CardFooter>
            </GlassCard>
          )}
        </div>
      </div>
    </ClientParticles>
  );
}
