'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

interface Creator {
  name: string
  username: string
  avatar: string
  specialty: string
  stats: {
    battles: number
    wins: number
    followers: number
  }
}

const sampleCreators: Creator[] = [
  {
    name: 'Jessica Williams',
    username: '@freestyle_queen',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    specialty: 'Freestyle Rap',
    stats: {
      battles: 28,
      wins: 17,
      followers: 2480
    }
  },
  {
    name: 'Marcus Johnson',
    username: '@meme_master',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    specialty: 'Meme Creation',
    stats: {
      battles: 42,
      wins: 23,
      followers: 3150
    }
  },
  {
    name: 'Alicia Rodriguez',
    username: '@comedy_alicia',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    specialty: 'Stand-up Comedy',
    stats: {
      battles: 35,
      wins: 19,
      followers: 2890
    }
  }
]

export function CreatorSpotlight() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  
  return (
    <section className="py-16 px-4" ref={ref}>
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-display text-hype-white mb-4">
            Featured Creators
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Check out these talented creators who are making waves on the platform.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sampleCreators.map((creator, index) => (
            <motion.div
              key={creator.username}
              className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="p-6 text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-battle-yellow">
                  <img 
                    src={creator.avatar} 
                    alt={creator.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-hype-white text-xl font-semibold mb-1">{creator.name}</h3>
                <p className="text-battle-yellow text-sm mb-2">{creator.username}</p>
                <p className="text-zinc-400 text-sm mb-4">Specialty: {creator.specialty}</p>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="text-hype-white font-semibold">{creator.stats.battles}</div>
                    <div className="text-xs text-zinc-400">Battles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-hype-white font-semibold">{creator.stats.wins}</div>
                    <div className="text-xs text-zinc-400">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-hype-white font-semibold">{creator.stats.followers}</div>
                    <div className="text-xs text-zinc-400">Followers</div>
                  </div>
                </div>
                
                <Link 
                  href="/sign-up" 
                  className="block text-center bg-transparent hover:bg-battle-yellow/10 text-battle-yellow border border-battle-yellow font-medium px-4 py-2 rounded-md text-sm transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link 
            href="/sign-up" 
            className="inline-flex items-center text-battle-yellow hover:text-battle-yellow/80 font-medium transition-colors"
          >
            Discover More Creators
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
