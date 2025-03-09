'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface HeroSectionProps {
  title?: string
  subtitle?: string
  showTokenMetrics?: boolean
}

export function HeroSection({
  title = 'WILD 'N OUT',
  subtitle = 'Entertainment + Crypto + Community = Something you've never seen before. Create, battle, and build your legacy in the ultimate entertainment platform.',
  showTokenMetrics = false
}: HeroSectionProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  }
  
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-zinc-900 to-wild-black">
      <motion.div 
        className="container mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-5xl md:text-7xl font-display text-battle-yellow mb-6"
          variants={itemVariants}
        >
          {title}
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-hype-white mb-8 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          {subtitle}
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          variants={itemVariants}
        >
          <Link 
            href="/sign-up" 
            className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-3 rounded-md text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/token" 
            className="bg-transparent hover:bg-hype-white/10 text-hype-white border border-hype-white font-medium px-8 py-3 rounded-md text-lg transition-colors"
          >
            Token Info
          </Link>
        </motion.div>
        
        {showTokenMetrics && (
          <motion.div 
            className="inline-block mt-8 bg-zinc-800/50 backdrop-blur-sm rounded-lg p-4 border border-zinc-700"
            variants={itemVariants}
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-zinc-400 text-sm">Current Price</div>
                <div className="text-hype-white text-xl font-semibold">$0.00421</div>
              </div>
              <div>
                <div className="text-zinc-400 text-sm">Market Cap</div>
                <div className="text-hype-white text-xl font-semibold">$9.2M</div>
              </div>
              <div>
                <div className="text-zinc-400 text-sm">24h Change</div>
                <div className="text-victory-green text-xl font-semibold">+5.4%</div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
