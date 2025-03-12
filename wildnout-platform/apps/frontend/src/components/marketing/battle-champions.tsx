'use client'

import { useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface Champion {
  id: string
  name: string
  position: number
  icon: string
  title: string
  wins: number
  battles: number
  badge: {
    text: string
    color: string
  }
  color: string
}

export default function BattleChampions() {
  // Champion data
  const champions: Champion[] = [
    {
      id: 'champ1',
      name: 'FlowMaster',
      position: 1,
      icon: '🎯',
      title: 'Wild Style Champion',
      wins: 28,
      battles: 42,
      badge: {
        text: 'Top Rated Creator',
        color: 'battle-yellow'
      },
      color: 'battle-yellow'
    },
    {
      id: 'champ2',
      name: 'MC Analytics',
      position: 2,
      icon: '🎤',
      title: 'Tournament Champion',
      wins: 19,
      battles: 38,
      badge: {
        text: 'Flow Master',
        color: 'flow-blue'
      },
      color: 'flow-blue'
    },
    {
      id: 'champ3',
      name: 'BattleBard',
      position: 3,
      icon: '⚡',
      title: 'R&Beef Champion',
      wins: 15,
      battles: 29,
      badge: {
        text: 'Crowd Favorite',
        color: 'victory-green'
      },
      color: 'victory-green'
    },
    {
      id: 'champ4',
      name: 'RhymeSlayer',
      position: 4,
      icon: '🔥',
      title: 'Pick Up & Kill It Champ',
      wins: 11,
      battles: 25,
      badge: {
        text: 'Rising Star',
        color: 'roast-red'
      },
      color: 'roast-red'
    }
  ]
  
  // Stats for the platform
  const stats = [
    {
      value: '12,500+',
      label: 'Battle Entries',
      color: 'battle-yellow'
    },
    {
      value: '250+',
      label: 'Active Battles',
      color: 'flow-blue'
    },
    {
      value: '1.5M+',
      label: 'Community Votes',
      color: 'victory-green'
    },
    {
      value: '75K+',
      label: 'Active Creators',
      color: 'roast-red'
    }
  ]
  
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  
  // Staggered animation for champion cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  }
  
  return (
    <div ref={containerRef}>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {champions.map((champion) => (
          <motion.div 
            key={champion.id}
            variants={itemVariants}
            whileHover={{ 
              y: -5,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
            className={`bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 rounded-xl overflow-hidden border border-zinc-700 p-6 text-center group relative transition-all duration-300`}
          >
            {/* Champion Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br from-${champion.color} via-${champion.color} to-${champion.position === 1 ? 'victory-green' : champion.position === 2 ? 'battle-yellow' : champion.position === 3 ? 'flow-blue' : 'battle-yellow'} rounded-full blur-md opacity-50 -z-10`}
                initial={{ opacity: 0.3 }}
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              <div className={`w-full h-full rounded-full border-2 border-${champion.color} flex items-center justify-center bg-zinc-900/50 overflow-hidden`}>
                <span className="text-3xl">{champion.icon}</span>
              </div>
              
              <motion.div 
                className={`absolute -top-1 -right-1 bg-${champion.color} text-wild-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                  delay: 0.6 + (champion.position * 0.1)
                }}
              >
                {champion.position}
              </motion.div>
            </div>
            
            <h3 className={`text-xl font-display text-hype-white mb-1 group-hover:text-${champion.color} transition-colors`}>
              {champion.name}
            </h3>
            <p className="text-zinc-400 text-sm mb-4">{champion.title}</p>
            
            <div className="flex justify-between text-sm mb-4">
              <span className="text-zinc-500">Wins: <span className="text-victory-green">{champion.wins}</span></span>
              <span className="text-zinc-500">Battles: <span className="text-flow-blue">{champion.battles}</span></span>
            </div>
            
            <div className={`bg-zinc-900/60 py-1.5 px-3 rounded-full text-xs text-${champion.badge.color} mx-auto inline-block`}>
              <span className="mr-1">★</span>
              <span>{champion.badge.text}</span>
            </div>
            
            {/* Highlight for first place champion */}
            {champion.position === 1 && (
              <motion.div 
                className="absolute -top-1 -left-1 -right-1 h-1 bg-gradient-to-r from-battle-yellow via-victory-green to-battle-yellow"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>
      
      {/* Champion Stats */}
      <motion.div 
        className="mt-12 bg-zinc-900/60 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.7, delay: 0.8 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
            >
              <motion.div 
                className={`text-${stat.color} text-3xl md:text-4xl font-display font-bold mb-1`}
                initial={{ y: 20 }}
                animate={isInView ? { y: 0 } : { y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1 + (index * 0.1) }}
              >
                {stat.value}
              </motion.div>
              <div className="text-zinc-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
