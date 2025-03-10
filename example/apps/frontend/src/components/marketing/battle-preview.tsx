'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

export function BattlePreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }
  
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-wild-black to-zinc-900" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.h2 
            className="text-3xl font-display text-hype-white mb-4"
            variants={itemVariants}
          >
            Battle Arena
          </motion.h2>
          <motion.p 
            className="text-zinc-400 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Compete in Wild 'n Out style battles, show off your skills, and earn recognition from the community.
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div 
            className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700"
            variants={itemVariants}
          >
            <div className="bg-battle-yellow/10 p-3">
              <div className="flex justify-between items-center">
                <span className="text-battle-yellow font-medium text-sm uppercase">Wild Style</span>
                <span className="bg-victory-green/20 text-victory-green text-xs px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-hype-white text-xl font-semibold mb-2">Monday Night Freestyle</h3>
              <p className="text-zinc-400 text-sm mb-4">Show off your best freestyle skills in this weekly battle.</p>
              <div className="flex justify-between text-sm text-zinc-500 mb-4">
                <span>24 participants</span>
                <span>Ends in 2h 45m</span>
              </div>
              <Link 
                href="/sign-up" 
                className="block text-center bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-4 py-2 rounded-md text-sm transition-colors"
              >
                Join Battle
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700"
            variants={itemVariants}
          >
            <div className="bg-flow-blue/10 p-3">
              <div className="flex justify-between items-center">
                <span className="text-flow-blue font-medium text-sm uppercase">Pick Up & Kill It</span>
                <span className="bg-victory-green/20 text-victory-green text-xs px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-hype-white text-xl font-semibold mb-2">Meme Remix Challenge</h3>
              <p className="text-zinc-400 text-sm mb-4">Take a meme template and create something hilarious.</p>
              <div className="flex justify-between text-sm text-zinc-500 mb-4">
                <span>42 participants</span>
                <span>Ends in 4h 15m</span>
              </div>
              <Link 
                href="/sign-up" 
                className="block text-center bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-4 py-2 rounded-md text-sm transition-colors"
              >
                Join Battle
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700"
            variants={itemVariants}
          >
            <div className="bg-roast-red/10 p-3">
              <div className="flex justify-between items-center">
                <span className="text-roast-red font-medium text-sm uppercase">R&Beef</span>
                <span className="bg-zinc-600/40 text-zinc-300 text-xs px-2 py-1 rounded-full">Coming Soon</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-hype-white text-xl font-semibold mb-2">Celebrity Roast Battle</h3>
              <p className="text-zinc-400 text-sm mb-4">Create the funniest celebrity roasts in this weekly face-off.</p>
              <div className="flex justify-between text-sm text-zinc-500 mb-4">
                <span>Starts in 2 days</span>
                <span>32 spots available</span>
              </div>
              <Link 
                href="/sign-up" 
                className="block text-center bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium px-4 py-2 rounded-md text-sm transition-colors"
              >
                Remind Me
              </Link>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mt-10 text-center"
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          transition={{ delay: 0.6 }}
        >
          <Link 
            href="/sign-up" 
            className="inline-flex items-center text-battle-yellow hover:text-battle-yellow/80 font-medium transition-colors"
          >
            View All Battles
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
