'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Users, PencilLine, Coins } from 'lucide-react'

interface FeatureHighlightsStepProps {
  userData: any
  onNext: (data?: any) => void
  onBack: () => void
}

const features = [
  {
    title: 'Battle Arena',
    description: 'Compete in Wild 'n Out style battles to showcase your skills',
    icon: <Flame size={32} className="text-battle-yellow" />,
    color: 'battle-yellow'
  },
  {
    title: 'Creator Studio',
    description: 'Create and share your content with the community',
    icon: <PencilLine size={32} className="text-victory-green" />,
    color: 'victory-green'
  },
  {
    title: 'Community',
    description: 'Connect with other Wild 'n Out fans and creators',
    icon: <Users size={32} className="text-flow-blue" />,
    color: 'flow-blue'
  },
  {
    title: 'Achievements',
    description: 'Earn badges and recognition for your contributions',
    icon: <Trophy size={32} className="text-roast-red" />,
    color: 'roast-red'
  },
  {
    title: 'Token Hub',
    description: 'Track your $WILDNOUT tokens and platform milestones',
    icon: <Coins size={32} className="text-battle-yellow" />,
    color: 'battle-yellow'
  }
]

export function FeatureHighlightsStep({ userData, onNext, onBack }: FeatureHighlightsStepProps) {
  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-display text-battle-yellow mb-2">
            Platform Features
          </h1>
          <p className="text-xl text-zinc-300">
            Everything you can do on Wild 'n Out
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (index * 0.1), duration: 0.5 }}
              className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700"
            >
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  {feature.icon}
                </div>
                <div>
                  <h3 className={`text-xl font-display text-${feature.color} mb-2`}>
                    {feature.title}
                  </h3>
                  <p className="text-zinc-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex justify-between"
        >
          <button
            onClick={onBack}
            className="px-6 py-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800"
          >
            Back
          </button>
          <button
            onClick={() => onNext()}
            className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-2 rounded-md"
          >
            Continue
          </button>
        </motion.div>
      </div>
    </div>
  )
}
