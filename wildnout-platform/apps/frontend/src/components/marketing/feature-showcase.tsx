'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface Feature {
  icon: string
  title: string
  description: string
}

interface FeatureShowcaseProps {
  features?: Feature[]
}

const defaultFeatures: Feature[] = [
  {
    icon: '🔥',
    title: 'Battle',
    description: 'Compete in Wild 'n Out style battles, show off your skills, and win recognition.'
  },
  {
    icon: '✨',
    title: 'Create',
    description: 'Make and share content, build your following, and showcase your creativity.'
  },
  {
    icon: '💰',
    title: 'Earn',
    description: 'Hold $WILDNOUT tokens, unlock exclusive features, and grow with the platform.'
  },
  {
    icon: '🏆',
    title: 'Achieve',
    description: 'Earn badges, level up, and track your progress as you build your reputation.'
  },
  {
    icon: '👥',
    title: 'Community',
    description: 'Connect with other fans and creators, collaborate, and grow together.'
  },
  {
    icon: '🌟',
    title: 'Discover',
    description: 'Find trending content, talented creators, and exciting new battles.'
  }
]

export function FeatureShowcase({ features = defaultFeatures }: FeatureShowcaseProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  
  return (
    <section className="py-16 px-4 bg-zinc-900" ref={ref}>
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display text-hype-white mb-4">
            Platform Features
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Explore the Wild 'n Out Meme Coin platform and discover what makes it unique.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-zinc-800 rounded-lg p-6 h-full flex flex-col"
              variants={{
                hidden: { y: 50, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <div className="w-16 h-16 bg-battle-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-display text-hype-white mb-3 text-center">
                {feature.title}
              </h3>
              <p className="text-zinc-300 text-center flex-1">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
