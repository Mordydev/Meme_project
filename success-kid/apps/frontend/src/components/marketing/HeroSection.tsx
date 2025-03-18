'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import tokens from '@/theme/tokens';

// SVG component for the fist icon with animation
const AnimatedFistIcon = () => {
  return (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full"
    >
      <motion.g
        initial={{ scale: 0.8, y: 10 }}
        animate={{ 
          scale: [0.8, 1.05, 1],
          y: [10, -5, 0],
        }}
        transition={{
          duration: 1.2, 
          ease: tokens.animation.easings.emphatic,
          times: [0, 0.6, 1]
        }}
      >
        {/* Base of fist */}
        <motion.path
          d="M100 160C138.66 160 170 128.66 170 90C170 51.34 138.66 20 100 20C61.34 20 30 51.34 30 90C30 128.66 61.34 160 100 160Z"
          fill="#FFCC80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Fist details */}
        <motion.path
          d="M125 75C125 75 125 55 105 55C85 55 85 75 85 75V105H125V75Z"
          fill="#FFB74D"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
        
        {/* Thumb */}
        <motion.path
          d="M85 85C85 85 65 85 65 105C65 125 85 125 85 125H105V85H85Z"
          fill="#FFB74D"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        />
        
        {/* Arm */}
        <motion.path
          d="M125 105C125 105 145 105 145 125C145 145 125 145 125 145V105Z"
          fill="#FFB74D"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
        
        {/* Highlights */}
        <motion.path
          d="M100 130C111.046 130 120 121.046 120 110C120 98.954 111.046 90 100 90C88.954 90 80 98.954 80 110C80 121.046 88.954 130 100 130Z"
          fill="#FFE0B2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />
      </motion.g>
      
      {/* Success rays animation */}
      <g>
        {[...Array(8)].map((_, i) => (
          <motion.path
            key={i}
            d={`M100 20L100 0M${100 + 70.7 * Math.cos(Math.PI * i / 4)} ${100 + 70.7 * Math.sin(Math.PI * i / 4)}L${100 + 90 * Math.cos(Math.PI * i / 4)} ${100 + 90 * Math.sin(Math.PI * i / 4)}`}
            stroke="#FFD54F"
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ 
              opacity: [0, 1, 0.7],
              pathLength: [0, 1, 1] 
            }}
            transition={{ 
              duration: 1.5,
              delay: 0.7 + i * 0.08,
              ease: tokens.animation.easings.emphatic
            }}
          />
        ))}
      </g>
    </motion.svg>
  );
};

// Background animation component
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-gray-50"></div>
      
      {/* Animated circles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary-200/20"
          style={{
            width: `${150 + i * 50}px`,
            height: `${150 + i * 50}px`,
            left: `${10 + i * 5}%`,
            top: `${20 + i * 10}%`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0, 0.3, 0.1],
            scale: [0.8, 1.2, 1],
            x: [0, i % 2 === 0 ? 20 : -20, 0],
            y: [0, i % 2 === 0 ? -20 : 20, 0],
          }}
          transition={{
            duration: 8 + i,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.5
          }}
        />
      ))}
      
      {/* Secondary animated elements */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`secondary-${i}`}
          className="absolute rounded-full bg-secondary-200/15"
          style={{
            width: `${40 + i * 20}px`,
            height: `${40 + i * 20}px`,
            right: `${5 + i * 8}%`,
            bottom: `${10 + i * 5}%`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0, 0.2, 0.1],
            scale: [0.8, 1.1, 1],
            x: [0, i % 2 === 0 ? 15 : -15, 0],
            y: [0, i % 2 === 0 ? -15 : 15, 0],
          }}
          transition={{
            duration: 6 + i,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.3
          }}
        />
      ))}
    </div>
  );
};

// Floating coin animation component
const FloatingCoins = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`coin-${i}`}
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: `${30 + (i % 3) * 10}px`,
            height: `${30 + (i % 3) * 10}px`,
            left: `${5 + (i * 7) % 90}%`,
            bottom: '-20px',
            background: i % 2 === 0 ? 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)' : 'linear-gradient(135deg, #1E88E5 0%, #64B5F6 100%)',
            boxShadow: i % 2 === 0 ? '0 0 10px rgba(255, 193, 7, 0.5)' : '0 0 10px rgba(30, 136, 229, 0.5)',
            zIndex: i
          }}
          initial={{ y: '100%', opacity: 0, rotate: 0 }}
          animate={{ 
            y: ['100%', '-120%'],
            opacity: [0, 1, 1, 0],
            rotate: i % 2 === 0 ? [0, 180] : [0, -180],
            scale: [0.8, 1, 1, 0.8]
          }}
          transition={{
            duration: 10 + (i % 5),
            ease: "linear",
            repeat: Infinity,
            delay: i * 1.5,
            times: [0, 0.1, 0.9, 1]
          }}
        >
          <span className="text-xs font-bold text-white drop-shadow-md">
            {i % 2 === 0 ? 'SKC' : 'SP'}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export const HeroSection = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [controls, isInView]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: tokens.animation.easings.standard
      }
    }
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: tokens.animation.easings.emphatic
      }
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: {
        duration: 0.2,
        ease: tokens.animation.easings.emphatic
      }
    },
    tap: { 
      scale: 0.98,
      boxShadow: "0 5px 10px -3px rgba(0, 0, 0, 0.1), 0 2px 3px -2px rgba(0, 0, 0, 0.05)",
      transition: {
        duration: 0.1,
        ease: tokens.animation.easings.emphatic
      }
    }
  };

  return (
    <section 
      ref={ref}
      className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32"
    >
      {/* Animated background */}
      <AnimatedBackground />
      
      {/* Floating cryptocurrency coins effect */}
      <FloatingCoins />
      
      {/* Main content */}
      <div className="container relative mx-auto px-4">
        <motion.div
          className="flex flex-col items-center lg:flex-row lg:justify-between lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          {/* Text content */}
          <motion.div 
            className="max-w-xl lg:max-w-2xl" 
            variants={itemVariants}
          >
            <motion.h1
              className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl"
              variants={itemVariants}
            >
              <span className="block">Clench Your Fist,</span>
              <motion.span 
                className="mt-2 block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                variants={itemVariants}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 8,
                  ease: 'linear',
                  repeat: Infinity,
                }}
              >
                Claim Your Success!
              </motion.span>
            </motion.h1>
            
            <motion.p
              className="mt-6 max-w-md text-lg leading-relaxed text-gray-600 sm:text-xl md:mt-8 md:max-w-lg"
              variants={itemVariants}
            >
              Join a vibrant ecosystem where crypto enthusiasts and meme lovers 
              connect, engage, and create real value together. Earn rewards for 
              every contribution while building a thriving community.
            </motion.p>
            
            <motion.div
              className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 md:mt-10"
              variants={itemVariants}
            >
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link href="/sign-up">
                  <Button 
                    size="lg" 
                    className="w-full px-8 py-4 sm:w-auto"
                  >
                    Join the Community
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link href="/about">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full px-8 py-4 sm:w-auto"
                  >
                    Learn More
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Key metrics preview */}
            <motion.div 
              className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4"
              variants={itemVariants}
            >
              {[
                { label: 'Community Members', value: '50,000+' },
                { label: 'Points Awarded', value: '2.8M+' },
                { label: 'Daily Engagements', value: '27,500+' },
                { label: 'Token Value', value: 'Growing' },
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  className="rounded-lg bg-white/80 p-3 shadow-sm backdrop-blur-sm"
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <p className="font-display text-lg font-bold text-primary sm:text-xl">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Visual element - Custom animated SVG */}
          <motion.div
            className="relative mt-12 w-64 md:w-96 lg:mt-0 lg:w-[500px]"
            variants={itemVariants}
          >
            <div className="relative flex aspect-square items-center justify-center rounded-full bg-gradient-to-b from-primary-100/80 to-primary-200/30 shadow-xl backdrop-blur-sm">
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(66, 165, 245, 0)',
                    '0 0 0 20px rgba(66, 165, 245, 0.2)',
                    '0 0 0 40px rgba(66, 165, 245, 0)',
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              <div className="relative z-10 h-3/4 w-3/4">
                <AnimatedFistIcon />
              </div>
            </div>
            
            {/* Points animation - Small particles shooting from fist */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute h-2 w-2 rounded-full bg-secondary shadow-md shadow-secondary/40"
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{
                    x: [0, (Math.cos(i * 30 * Math.PI / 180) * 150)],
                    y: [0, (Math.sin(i * 30 * Math.PI / 180) * 150)],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 1 + i * 0.1,
                    repeatDelay: i * 0.2,
                    ease: [0.2, 0.65, 0.3, 0.9]
                  }}
                />
              ))}
            </div>
            
            {/* Interactive demo element */}
            <motion.div
              className="absolute -right-4 bottom-10 rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm lg:-right-12"
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                scale: 1,
                transition: { 
                  delay: 1.5, 
                  duration: 0.5,
                  ease: tokens.animation.easings.emphatic
                }
              }}
              whileHover={{ 
                y: -5, 
                scale: 1.05,
                transition: { duration: 0.2 } 
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <span className="text-accent">+123</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Points Earned</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="absolute -left-4 top-10 rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm lg:-left-12"
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                scale: 1,
                transition: { 
                  delay: 1.8, 
                  duration: 0.5,
                  ease: tokens.animation.easings.emphatic
                }
              }}
              whileHover={{ 
                y: -5, 
                scale: 1.05,
                transition: { duration: 0.2 } 
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                  <span className="text-secondary">🏆</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Achievement Unlocked</p>
                  <p className="text-xs text-gray-500">First Contribution</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
        initial={{ opacity: 0, y: -10 }}
        animate={{ 
          opacity: [0, 1, 0], 
          y: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.5
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L12 20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </section>
  );
};
