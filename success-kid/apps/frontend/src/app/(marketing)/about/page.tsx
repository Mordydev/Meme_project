'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { 
  MemeLegacySection, 
  CommunityValueSection 
} from '@/components/marketing/about';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ParticleEffect } from '@/components/ui/particle-effect';
import { ClientMotion, AnimateOnMount } from '@/components/ui';

export default function AboutPage() {
  const [activeStage, setActiveStage] = useState(3); // Default to Growth & Reinvestment
  const [isPlaying, setIsPlaying] = useState(true);
  const nodeControls = useAnimation();
  const flowControls = useAnimation();
  
  // The four stages of the success amplification cycle
  const stages = [
    { 
      id: 0, 
      title: "Individual Effort", 
      description: "Members contribute content and engage", 
      icon: "🚀", 
      emoji: "✊", 
      color: "from-blue-500 to-cyan-400",
      bgColor: "bg-blue-50",
      details: "Creating content (+50 SP) • Comments (+15 SP) • Referrals (+500 SP)"
    },
    { 
      id: 1, 
      title: "Community Amplification", 
      description: "The community upvotes and improves content", 
      icon: "👥",
      emoji: "👥", 
      color: "from-indigo-500 to-purple-400",
      bgColor: "bg-indigo-50",
      details: "Upvotes increase visibility • Comments add depth • Collective knowledge improves outcomes"
    },
    { 
      id: 2, 
      title: "Rewards Distribution", 
      description: "Value flows back as Success Points", 
      icon: "🏆",
      emoji: "🏆", 
      color: "from-amber-500 to-yellow-400",
      bgColor: "bg-amber-50",
      details: "Points for valuable contributions • Bonus for exceptional content • Achievements and recognition"
    },
    { 
      id: 3, 
      title: "Growth & Reinvestment", 
      description: "Success Points convert to tokens, fueling growth", 
      icon: "📈",
      emoji: "📈", 
      color: "from-green-500 to-emerald-400",
      bgColor: "bg-green-50",
      details: "100 SP = 1 SKC token • Token value grows with community • Sustainable ecosystem"
    }
  ];

  // Auto-play through stages
  useEffect(() => {
    let interval;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStage(prevStage => (prevStage + 1) % stages.length);
      }, 4000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, stages.length]);

  // Animate node connections based on current stage
  useEffect(() => {
    // Animate nodes based on current stage
    const animateStage = async () => {
      // Reset all nodes
      await nodeControls.start({
        scale: 1,
        boxShadow: "0 0 0 0 rgba(30, 136, 229, 0)",
        transition: { duration: 0.4, ease: "easeInOut" }
      });
      
      // Animate current stage node
      await nodeControls.start(node => {
        if (node.id === activeStage) {
          return {
            scale: 1.1, // More subtle scale
            boxShadow: "0 0 0 4px rgba(30, 136, 229, 0.15)", // More subtle glow
            transition: { 
              type: "spring", 
              stiffness: 200,
              damping: 20 
            }
          };
        }
        return {};
      });
      
      // Animate flows between nodes
      await flowControls.start(flow => {
        if (flow.from === activeStage && flow.to === (activeStage + 1) % stages.length) {
          return {
            opacity: 1,
            pathLength: 1,
            transition: { duration: 1.2, ease: "easeInOut" }
          };
        } else {
          return {
            opacity: 0.25,
            pathLength: 1,
            transition: { duration: 0.6, ease: "easeOut" }
          };
        }
      });
    };
    
    animateStage();
  }, [activeStage, nodeControls, flowControls]);

  return (
    <div className="relative bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with gradient background and particles */}
      <section className="relative overflow-hidden py-20 md:py-24 lg:py-24 border-b border-gray-200">
        {/* Enhanced Background Effects with more gradients and styling */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base gradient background with enhanced colors and animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-blue-50/80"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              filter: ['brightness(1)', 'brightness(1.02)', 'brightness(1)'],
            }}
            transition={{
              backgroundPosition: { duration: 40, repeat: Infinity, repeatType: 'loop', ease: 'linear' },
              filter: { duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
            }}
            style={{ backgroundSize: '200% 200%' }}
          />
          
          {/* Dynamic radial gradient overlay */}
          <motion.div 
            className="absolute inset-0 opacity-25" 
            animate={{
              background: [
                'radial-gradient(circle at 20% 20%, rgba(30,136,229,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.10) 0%, transparent 40%)',
                'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.12) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(30,136,229,0.10) 0%, transparent 40%)',
                'radial-gradient(circle at 20% 20%, rgba(30,136,229,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.10) 0%, transparent 40%)'
              ],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut"
            }}
          />
          
          {/* Multiple animated background blobs with varied positions and timings */}
          <motion.div
            className="absolute top-0 right-0 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-primary-100/40 to-blue-200/30 blur-3xl"
            animate={{
              x: [0, -15, 0],
              y: [0, 15, 0],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.45, 0.3],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
          
          <motion.div
            className="absolute bottom-0 left-0 w-1/4 h-1/4 rounded-full bg-gradient-to-r from-blue-200/30 to-primary-100/30 blur-3xl"
            animate={{
              x: [0, 20, 0],
              y: [0, -10, 0],
              scale: [1, 1.08, 1],
              opacity: [0.25, 0.4, 0.25],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
          
          {/* Added middle gradient blob */}
          <motion.div
            className="absolute top-1/2 left-1/4 w-1/4 h-1/4 rounded-full bg-gradient-to-tl from-sky-100/25 to-indigo-100/25 blur-3xl"
            animate={{
              x: [0, -15, 0],
              y: [0, -10, 0],
              scale: [0.9, 1.1, 0.9],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
          
          {/* Light rays effect - enhanced and more subtle */}
          <motion.div 
            className="absolute inset-0 opacity-[0.03]" 
            animate={{
              background: [
                'conic-gradient(from 180deg at 50% 50%, rgba(30,136,229,0.15) 0deg, transparent 40deg, rgba(59,130,246,0.12) 90deg, transparent 140deg, rgba(30,136,229,0.15) 210deg, transparent 280deg, rgba(59,130,246,0.08) 360deg)'
              ],
              rotate: [0, 360]
            }}
            transition={{
              rotate: {
                duration: 80,
                repeat: Infinity,
                ease: "linear"
              }
            }}
          />
          
          {/* Dual ray effect - more delicate */}
          <motion.div 
            className="absolute inset-0 opacity-[0.025]" 
            animate={{
              rotate: [0, -180, -360]
            }}
            transition={{
              duration: 120,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              background: 'conic-gradient(from 0deg at 30% 50%, rgba(59,130,246,0.08) 0deg, transparent 60deg, rgba(59,130,246,0.08) 180deg, transparent 240deg, rgba(59,130,246,0.08) 360deg)'
            }}
          />
          
          {/* Enhanced dot pattern with subtle animation */}
          <motion.div 
            className="absolute inset-0 opacity-[0.02]" 
            animate={{ 
              opacity: [0.02, 0.035, 0.02],
              scale: [1, 1.015, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            style={{
              backgroundImage: 'radial-gradient(#1E88E5 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />
          
          {/* Added subtle rays for enhanced effect */}
          <motion.div 
            className="absolute inset-0 opacity-[0.02]" 
            animate={{ 
              opacity: [0.02, 0.03, 0.02],
              rotate: [0, 1, 0, -1, 0],
            }}
            transition={{
              opacity: {
                duration: 15,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              rotate: {
                duration: 30,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
            style={{
              background: 'repeating-linear-gradient(45deg, rgba(30,136,229,0.03) 0px, transparent 4px, transparent 10px), repeating-linear-gradient(135deg, rgba(59,130,246,0.03) 0px, transparent 4px, transparent 10px)',
              backgroundSize: '100px 100px'
            }}
          />
          
          {/* Enhanced bottom border with animation */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-300 to-transparent"
            animate={{
              opacity: [0.6, 1, 0.6],
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
            }}
            transition={{
              opacity: { duration: 3, repeat: Infinity, repeatType: "reverse" },
              backgroundPosition: { duration: 10, repeat: Infinity, repeatType: "loop" }
            }}
            style={{ backgroundSize: '200% 100%' }}
          />
          
          {/* Top subtle gradient border */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary-200/30 via-transparent to-primary-200/30"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              backgroundPosition: ['100% 0%', '0% 0%', '100% 0%'],
            }}
            transition={{
              opacity: { duration: 4, repeat: Infinity, repeatType: "reverse" },
              backgroundPosition: { duration: 15, repeat: Infinity, repeatType: "loop" }
            }}
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
        
        {/* Enhanced animated particles in background - with varied sizes and animations */}
        <AnimateOnMount>
          {Array.from({ length: 15 }).map((_, i) => {
            // Vary particle sizes and properties based on index
            const size = (i % 3 === 0) ? 2 : (i % 3 === 1) ? 1.5 : 1;
            const opacity = (i % 4 === 0) ? 0.3 : (i % 4 === 1) ? 0.25 : (i % 4 === 2) ? 0.2 : 0.15;
            const speed = 6 + (i % 5);
            const delay = i * 0.3;
            const amplitude = (i % 3 === 0) ? 15 : (i % 3 === 1) ? 10 : 5;
            
            return (
              <ClientMotion
                key={`hero-particle-${i}`}
                className={`absolute rounded-full bg-primary/20 backdrop-blur-sm`}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${5 + (i * 6) % 90}%`,
                  top: `${5 + ((i * 7) % 85)}%`,
                  boxShadow: `0 0 ${size * 2}px rgba(30, 136, 229, 0.2)`
                }}
                animate={{
                  y: [0, -amplitude, 0],
                  x: [0, i % 2 === 0 ? amplitude * 0.6 : -amplitude * 0.6, 0],
                  opacity: [opacity * 0.5, opacity, opacity * 0.5],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: speed,
                  repeat: Infinity,
                  repeatType: 'loop',
                  ease: 'easeInOut',
                  delay: delay,
                }}
              />
            );
          })}
        </AnimateOnMount>
        
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-start">
            {/* Left side: About text - Enhanced with subtle effects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full lg:w-2/5 mb-12 lg:mb-0 lg:pr-10 lg:pt-4 relative"
            >
              {/* Subtle background effect for text section */}
              <div className="absolute -inset-4 bg-gradient-to-br from-white via-primary-50/30 to-blue-50/30 rounded-xl blur-xl opacity-70 -z-10"></div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="mb-10 relative"
              >
                <div className="text-gray-700">
                  The <span className="font-bold text-primary-700 relative inline-block">
                    Success Kid Community Platform
                    <motion.div 
                      className="absolute -inset-1 -z-10 opacity-0" 
                      animate={{ opacity: [0, 0.2, 0] }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                      style={{ 
                        background: 'radial-gradient(circle at center, rgba(30,136,229,0.3) 0%, transparent 70%)',
                        borderRadius: 'inherit'
                      }}
                    />
                  </span> harnesses the positive energy of the iconic meme to build an ecosystem where crypto enthusiasts and meme lovers alike can connect, engage, and create value together.
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                <div className="mr-4 relative">
                  <motion.div 
                    className="absolute inset-0 rounded-full blur-lg bg-primary-400/30 z-0"
                    animate={{ 
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                  />
                  <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-full w-16 h-16 flex items-center justify-center text-4xl border border-primary-200 relative z-10 shadow-md">
                    <motion.div
                      animate={{
                        rotate: [-1, 1, -1],
                        scale: [0.98, 1.02, 0.98]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative z-10"
                    >
                      ✊
                    </motion.div>
                    <motion.div 
                      className="absolute inset-0 rounded-full opacity-0 z-0"
                      animate={{
                        boxShadow: [
                          "0 0 0 rgba(30, 136, 229, 0)", 
                          "0 0 20px rgba(30, 136, 229, 0.5)", 
                          "0 0 0 rgba(30, 136, 229, 0)"
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <motion.p 
                    className="text-gray-700 font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-600 relative"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ backgroundSize: '200% 100%' }}
                  >
                    "Clench Your Fist, Claim Your Success!"
                  </motion.p>
                </div>
              </motion.div>
              
              <motion.p 
                className="text-xl text-gray-700 mt-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                Transforming a viral meme into a vibrant community where engagement creates value and success is amplified through collective effort.
              </motion.p>
            </motion.div>
            
            {/* Right side: Success amplification cycle visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="w-full lg:w-3/5 lg:pl-6"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md border border-gray-100 relative overflow-hidden">
                {/* Background pattern for cycle diagram */}
                <div className="absolute inset-0 opacity-[0.03]" 
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(30,136,229,0.3) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />
                
                {/* Subtle background gradient */}
                <motion.div 
                  className="absolute inset-0 opacity-20 -z-10"
                  animate={{
                    background: [
                      'radial-gradient(circle at 30% 30%, rgba(30,136,229,0.3) 0%, transparent 70%)',
                      'radial-gradient(circle at 70% 70%, rgba(30,136,229,0.3) 0%, transparent 70%)',
                      'radial-gradient(circle at 30% 30%, rgba(30,136,229,0.3) 0%, transparent 70%)'
                    ],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                  }}
                />
                
                <motion.h2 
                  className="text-2xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-600"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ backgroundSize: '200% 100%' }}
                >
                  The Success Amplification Cycle
                </motion.h2>
                
                <div className="relative mb-4">
                  {/* Center Success Kid fist with enhanced effects */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    {/* Pulsing glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary-300/30 blur-xl -z-10"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 0.6, 0.4]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        left: 0,
                        top: 0
                      }}
                    />
                    
                    {/* Circular connection lines radiating from center */}
                    <motion.div
                      className="absolute -inset-2 rounded-full border-2 border-dashed border-primary-200/40 z-0"
                      animate={{
                        rotate: [0, 360],
                        scale: [0.95, 1.05, 0.95]
                      }}
                      transition={{
                        rotate: { duration: 40, repeat: Infinity, ease: "linear" },
                        scale: { duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                      }}
                    />
                    
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center text-5xl relative border-2 border-primary-200 shadow-lg">
                      <motion.div
                        animate={{
                          rotate: [-2, 2, -2],
                          scale: [0.95, 1.05, 0.95]
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      >
                        👊
                      </motion.div>
                      
                      {/* Inner glow effect */}
                      <motion.div 
                        className="absolute inset-0 rounded-full opacity-0 z-0"
                        animate={{
                          boxShadow: [
                            "inset 0 0 10px rgba(30, 136, 229, 0.0)", 
                            "inset 0 0 30px rgba(30, 136, 229, 0.5)", 
                            "inset 0 0 10px rgba(30, 136, 229, 0.0)"
                          ]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Stage visualization - enhanced with gradients and animations */}
                  <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                    {/* Individual Effort - Top left */}
                    <motion.div 
                      className={`relative overflow-hidden ${activeStage === 0 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border border-gray-200'} rounded-lg p-4 cursor-pointer transition-all bg-white`}
                      onClick={() => {
                        setActiveStage(0);
                        setIsPlaying(false);
                      }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                      animate={{
                        boxShadow: activeStage === 0 ? [
                          '0 4px 12px rgba(30, 136, 229, 0.2)',
                          '0 4px 20px rgba(30, 136, 229, 0.4)',
                          '0 4px 12px rgba(30, 136, 229, 0.2)'
                        ] : 'none'
                      }}
                      transition={{
                        boxShadow: {
                          duration: 2,
                          repeat: activeStage === 0 ? Infinity : 0,
                          repeatType: "reverse"
                        }
                      }}
                    >
                      {activeStage === 0 && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-40"
                          animate={{ opacity: [0.4, 0.6, 0.4] }}
                          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        />
                      )}
                      <div className={`flex items-center mb-2`}>
                        <motion.div 
                          className={`w-10 h-10 rounded-full ${stages[0].bgColor} flex items-center justify-center text-xl mr-3 shadow-sm`}
                          animate={{
                            scale: activeStage === 0 ? [1, 1.05, 1] : 1,
                            boxShadow: activeStage === 0 ? [
                              '0 0 0 rgba(59, 130, 246, 0)',
                              '0 0 10px rgba(59, 130, 246, 0.5)',
                              '0 0 0 rgba(59, 130, 246, 0)'
                            ] : 'none'
                          }}
                          transition={{
                            scale: { duration: 2, repeat: activeStage === 0 ? Infinity : 0, repeatType: "reverse" },
                            boxShadow: { duration: 2, repeat: activeStage === 0 ? Infinity : 0, repeatType: "reverse" }
                          }}
                        >
                          {stages[0].emoji}
                        </motion.div>
                        <span className={`font-medium ${activeStage === 0 ? 'text-primary-700' : 'text-gray-700'}`}>Individual Effort</span>
                      </div>
                      

                    </motion.div>
                    
                    {/* Community Amplification - Top right */}
                    <motion.div 
                      className={`relative overflow-hidden ${activeStage === 1 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border border-gray-200'} rounded-lg p-4 cursor-pointer transition-all bg-white`}
                      onClick={() => {
                        setActiveStage(1);
                        setIsPlaying(false);
                      }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                      animate={{
                        boxShadow: activeStage === 1 ? [
                          '0 4px 12px rgba(79, 70, 229, 0.2)',
                          '0 4px 20px rgba(79, 70, 229, 0.4)',
                          '0 4px 12px rgba(79, 70, 229, 0.2)'
                        ] : 'none'
                      }}
                      transition={{
                        boxShadow: {
                          duration: 2,
                          repeat: activeStage === 1 ? Infinity : 0,
                          repeatType: "reverse"
                        }
                      }}
                    >
                      {activeStage === 1 && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-40"
                          animate={{ opacity: [0.4, 0.6, 0.4] }}
                          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        />
                      )}
                      <div className={`flex items-center mb-2`}>
                        <motion.div 
                          className={`w-10 h-10 rounded-full ${stages[1].bgColor} flex items-center justify-center text-xl mr-3 shadow-sm`}
                          animate={{
                            scale: activeStage === 1 ? [1, 1.05, 1] : 1,
                            boxShadow: activeStage === 1 ? [
                              '0 0 0 rgba(99, 102, 241, 0)',
                              '0 0 10px rgba(99, 102, 241, 0.5)',
                              '0 0 0 rgba(99, 102, 241, 0)'
                            ] : 'none'
                          }}
                          transition={{
                            scale: { duration: 2, repeat: activeStage === 1 ? Infinity : 0, repeatType: "reverse" },
                            boxShadow: { duration: 2, repeat: activeStage === 1 ? Infinity : 0, repeatType: "reverse" }
                          }}
                        >
                          {stages[1].emoji}
                        </motion.div>
                        <span className={`font-medium ${activeStage === 1 ? 'text-indigo-700' : 'text-gray-700'}`}>Community Amplification</span>
                      </div>
                      

                    </motion.div>
                    
                    {/* Growth & Reinvestment - Bottom left */}
                    <motion.div 
                      className={`relative overflow-hidden ${activeStage === 3 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border border-gray-200'} rounded-lg p-4 cursor-pointer transition-all bg-white`}
                      onClick={() => {
                        setActiveStage(3);
                        setIsPlaying(false);
                      }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                      animate={{
                        boxShadow: activeStage === 3 ? [
                          '0 4px 12px rgba(16, 185, 129, 0.2)',
                          '0 4px 20px rgba(16, 185, 129, 0.4)',
                          '0 4px 12px rgba(16, 185, 129, 0.2)'
                        ] : 'none'
                      }}
                      transition={{
                        boxShadow: {
                          duration: 2,
                          repeat: activeStage === 3 ? Infinity : 0,
                          repeatType: "reverse"
                        }
                      }}
                    >
                      {activeStage === 3 && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-40"
                          animate={{ opacity: [0.4, 0.6, 0.4] }}
                          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        />
                      )}
                      <div className={`flex items-center mb-2`}>
                        <motion.div 
                          className={`w-10 h-10 rounded-full ${stages[3].bgColor} flex items-center justify-center text-xl mr-3 shadow-sm`}
                          animate={{
                            scale: activeStage === 3 ? [1, 1.05, 1] : 1,
                            boxShadow: activeStage === 3 ? [
                              '0 0 0 rgba(16, 185, 129, 0)',
                              '0 0 10px rgba(16, 185, 129, 0.5)',
                              '0 0 0 rgba(16, 185, 129, 0)'
                            ] : 'none'
                          }}
                          transition={{
                            scale: { duration: 2, repeat: activeStage === 3 ? Infinity : 0, repeatType: "reverse" },
                            boxShadow: { duration: 2, repeat: activeStage === 3 ? Infinity : 0, repeatType: "reverse" }
                          }}
                        >
                          {stages[3].emoji}
                        </motion.div>
                        <span className={`font-medium ${activeStage === 3 ? 'text-green-700' : 'text-gray-700'}`}>Growth & Reinvestment</span>
                      </div>
                      

                    </motion.div>
                    
                    {/* Rewards Distribution - Bottom right */}
                    <motion.div 
                      className={`relative overflow-hidden ${activeStage === 2 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border border-gray-200'} rounded-lg p-4 cursor-pointer transition-all bg-white`}
                      onClick={() => {
                        setActiveStage(2);
                        setIsPlaying(false);
                      }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                      animate={{
                        boxShadow: activeStage === 2 ? [
                          '0 4px 12px rgba(245, 158, 11, 0.2)',
                          '0 4px 20px rgba(245, 158, 11, 0.4)',
                          '0 4px 12px rgba(245, 158, 11, 0.2)'
                        ] : 'none'
                      }}
                      transition={{
                        boxShadow: {
                          duration: 2,
                          repeat: activeStage === 2 ? Infinity : 0,
                          repeatType: "reverse"
                        }
                      }}
                    >
                      {activeStage === 2 && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-40"
                          animate={{ opacity: [0.4, 0.6, 0.4] }}
                          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        />
                      )}
                      <div className={`flex items-center mb-2`}>
                        <motion.div 
                          className={`w-10 h-10 rounded-full ${stages[2].bgColor} flex items-center justify-center text-xl mr-3 shadow-sm`}
                          animate={{
                            scale: activeStage === 2 ? [1, 1.05, 1] : 1,
                            boxShadow: activeStage === 2 ? [
                              '0 0 0 rgba(245, 158, 11, 0)',
                              '0 0 10px rgba(245, 158, 11, 0.5)',
                              '0 0 0 rgba(245, 158, 11, 0)'
                            ] : 'none'
                          }}
                          transition={{
                            scale: { duration: 2, repeat: activeStage === 2 ? Infinity : 0, repeatType: "reverse" },
                            boxShadow: { duration: 2, repeat: activeStage === 2 ? Infinity : 0, repeatType: "reverse" }
                          }}
                        >
                          {stages[2].emoji}
                        </motion.div>
                        <span className={`font-medium ${activeStage === 2 ? 'text-amber-700' : 'text-gray-700'}`}>Rewards Distribution</span>
                      </div>
                      

                    </motion.div>
                  </div>
                  
                  {/* Subtle central connections - using only blue tones */}
                  <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-30">
                    {/* Circular connecting paths */}
                    <motion.circle 
                      cx="245" 
                      cy="155" 
                      r="85" 
                      fill="none" 
                      stroke="#1E88E5" 
                      strokeWidth="1" 
                      strokeDasharray="3,3" 
                      opacity="0.25"
                      animate={{ 
                        rotate: [0, 360],
                      }}
                      transition={{ 
                        duration: 45, 
                        repeat: Infinity, 
                        ease: "linear",
                      }}
                      style={{ transformOrigin: '245px 155px' }}
                    />
                    
                    <motion.circle 
                      cx="245" 
                      cy="155" 
                      r="75" 
                      fill="none" 
                      stroke="#1E88E5" 
                      strokeWidth="1" 
                      strokeDasharray="5,5" 
                      opacity="0.15"
                      animate={{ 
                        rotate: [360, 0],
                      }}
                      transition={{ 
                        duration: 50, 
                        repeat: Infinity, 
                        ease: "linear",
                      }}
                      style={{ transformOrigin: '245px 155px' }}
                    />
                  </svg>
                </div>
                
                {/* Enhanced Controls */}
                <div className="flex justify-center space-x-3 mb-4">
                  <motion.button
                    className={`px-4 py-1.5 rounded-full flex items-center text-xs font-medium shadow-sm ${
                      isPlaying 
                        ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50' 
                        : 'bg-gradient-to-r from-primary-500 to-blue-600 text-white'
                    }`}
                    onClick={() => setIsPlaying(!isPlaying)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {isPlaying ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pause Animation
                      </>
                    ) : (
                      <>
                        <motion.svg 
                          className="w-4 h-4 mr-1" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          animate={{
                            x: isPlaying ? 0 : [0, 2, 0]
                          }}
                          transition={{
                            duration: 1,
                            repeat: isPlaying ? 0 : Infinity,
                            repeatType: "loop"
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </motion.svg>
                        Play Animation
                      </>
                    )}
                    {!isPlaying && (
                      <motion.div 
                        className="absolute inset-0 rounded-full opacity-0"
                        animate={{
                          boxShadow: [
                            "0 0 0 rgba(30, 136, 229, 0)", 
                            "0 0 20px rgba(30, 136, 229, 0.5)", 
                            "0 0 0 rgba(30, 136, 229, 0)"
                          ],
                          opacity: [0, 0.2, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      />
                    )}
                  </motion.button>
                  
                  <motion.button
                    className="px-4 py-1.5 bg-white text-primary-600 border border-primary-200 rounded-full flex items-center text-xs font-medium shadow-sm hover:shadow"
                    onClick={() => setActiveStage((activeStage + 1) % stages.length)}
                    whileHover={{ scale: 1.05, y: -2, backgroundColor: "#f5faff" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <motion.svg 
                      className="w-4 h-4 mr-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      animate={{
                        x: [0, 2, 0]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "loop",
                        repeatDelay: 1
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                    Next Stage
                  </motion.button>
                </div>
                
                {/* Enhanced Current Stage Description */}
                <motion.div 
                  className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4 mt-2 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  key={activeStage} // This forces re-render when activeStage changes
                >
                  {/* Background gradient for the active stage */}
                  <motion.div 
                    className="absolute inset-0 opacity-10"
                    animate={{
                      background: activeStage === 0 ? 'linear-gradient(to right bottom, rgba(59, 130, 246, 0.2), transparent)' :
                        activeStage === 1 ? 'linear-gradient(to right bottom, rgba(99, 102, 241, 0.2), transparent)' :
                        activeStage === 2 ? 'linear-gradient(to right bottom, rgba(245, 158, 11, 0.2), transparent)' :
                        'linear-gradient(to right bottom, rgba(16, 185, 129, 0.2), transparent)'
                    }}
                    transition={{ duration: 0.5 }}
                  />
                  
                  <div className="flex items-start relative z-10">
                    <motion.div 
                      className={`w-12 h-12 rounded-full ${stages[activeStage].bgColor} flex items-center justify-center text-2xl mr-4 flex-shrink-0 shadow-md`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <motion.span
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0, -5, 0]
                        }}
                        transition={{
                          scale: { duration: 3, repeat: Infinity, repeatType: "reverse" },
                          rotate: { duration: 6, repeat: Infinity, repeatType: "loop" }
                        }}
                      >
                        {stages[activeStage].emoji}
                      </motion.span>
                      
                      {/* Pulsing glow effect */}
                      <motion.div 
                        className="absolute inset-0 rounded-full opacity-0" 
                        animate={{
                          boxShadow: activeStage === 0 ? [
                            "0 0 0 rgba(59, 130, 246, 0)",
                            "0 0 15px rgba(59, 130, 246, 0.8)",
                            "0 0 0 rgba(59, 130, 246, 0)"
                          ] : activeStage === 1 ? [
                            "0 0 0 rgba(99, 102, 241, 0)",
                            "0 0 15px rgba(99, 102, 241, 0.8)",
                            "0 0 0 rgba(99, 102, 241, 0)"
                          ] : activeStage === 2 ? [
                            "0 0 0 rgba(245, 158, 11, 0)",
                            "0 0 15px rgba(245, 158, 11, 0.8)",
                            "0 0 0 rgba(245, 158, 11, 0)"
                          ] : [
                            "0 0 0 rgba(16, 185, 129, 0)",
                            "0 0 15px rgba(16, 185, 129, 0.8)",
                            "0 0 0 rgba(16, 185, 129, 0)"
                          ]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity
                        }}
                      />
                    </motion.div>
                    
                    <div>
                      <motion.h3 
                        className={`text-lg font-bold bg-clip-text text-transparent`}
                        style={{
                          backgroundImage: activeStage === 0 ? 'linear-gradient(to right, #2563eb, #60a5fa)' :
                            activeStage === 1 ? 'linear-gradient(to right, #4f46e5, #818cf8)' :
                            activeStage === 2 ? 'linear-gradient(to right, #d97706, #fbbf24)' :
                            'linear-gradient(to right, #059669, #34d399)'
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                      >
                        {stages[activeStage].title}
                      </motion.h3>
                      
                      <motion.div 
                        className="text-gray-700 text-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                      >
                        {activeStage === 0 && (
                          <>
                            <p className="mb-2">
                              The cycle begins with individual community members contributing content and engaging in discussions. Each action represents a contribution to the ecosystem.
                            </p>
                            <motion.div 
                              className="text-xs bg-gradient-to-r from-blue-50 to-white p-2 rounded text-gray-600 border border-blue-100"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.3 }}
                            >
                              {stages[activeStage].details}
                            </motion.div>
                          </>
                        )}
                        
                        {activeStage === 1 && (
                          <>
                            <p className="mb-2">
                              The community acts as an amplifier, providing feedback and support that increases the value of individual contributions beyond what any single person could achieve.
                            </p>
                            <motion.div 
                              className="text-xs bg-gradient-to-r from-indigo-50 to-white p-2 rounded text-gray-600 border border-indigo-100"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.3 }}
                            >
                              {stages[activeStage].details}
                            </motion.div>
                          </>
                        )}
                        
                        {activeStage === 2 && (
                          <>
                            <p className="mb-2">
                              The platform's rewards system distributes value back through Success Points, creating a direct link between community contribution and individual benefit.
                            </p>
                            <motion.div 
                              className="text-xs bg-gradient-to-r from-amber-50 to-white p-2 rounded text-gray-600 border border-amber-100"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.3 }}
                            >
                              {stages[activeStage].details}
                            </motion.div>
                          </>
                        )}
                        
                        {activeStage === 3 && (
                          <>
                            <p className="mb-2">
                              Success Points convert to SKC tokens, creating real economic value. This fuels further platform development, completing the cycle for sustainable growth.
                            </p>
                            <motion.div 
                              className="text-xs bg-gradient-to-r from-green-50 to-white p-2 rounded text-gray-600 border border-green-100"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.3 }}
                            >
                              {stages[activeStage].details}
                            </motion.div>
                          </>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Meme History and Legacy */}
      <MemeLegacySection />
      
      {/* Community Value and Purpose */}
      <CommunityValueSection />
      
      {/* Call to Action */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-blue-700">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                'linear-gradient(225deg, #1976d2 0%, #0d47a1 100%)',
                'linear-gradient(315deg, #1e88e5 0%, #1565c0 100%)',
                'linear-gradient(45deg, #1976d2 0%, #0d47a1 100%)',
              ],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
            }}
          />
        </div>
        
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[url('/images/noise.png')] bg-repeat mix-blend-soft-light"></div>
          <div className="h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl font-bold mb-6 text-white"
            >
              Join Our Growing Community Today
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-xl mb-8 text-white/90"
            >
              Be part of a platform that turns engagement into real value. Connect, contribute, and claim your success!
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="relative inline-block"
            >
              <ParticleEffect
                count={15}
                color="white"
                duration={2.5}
                size={5}
                trigger="hover"
                className="absolute inset-0"
              />
              <a
                href="/register"
                className="inline-block bg-white text-primary-600 px-8 py-4 rounded-full font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                Register Now
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
