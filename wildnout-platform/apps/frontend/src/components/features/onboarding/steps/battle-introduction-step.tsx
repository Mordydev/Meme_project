'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface BattleIntroductionStepProps {
  userData: any
  onNext: (data?: any) => void
  onBack: () => void
}

const battleTypes = [
  {
    id: 'wildStyle',
    name: 'Wild Style',
    description: 'Freestyle rap battle that tests your quick thinking and rhyming skills.',
    example: 'Example: "Your jokes so stale, like bread from last week, while my flow stay fresh, got the audience on their feet!"'
  },
  {
    id: 'pickUpKillIt',
    name: 'Pick Up & Kill It',
    description: 'Finish a setup line in the most creative and funny way possible.',
    example: 'Example: Setup: "Wild n Out so lit..." Response: "...even fire extinguishers tap out when we spit!"'
  },
  {
    id: 'rAndBeef',
    name: 'R&Beef',
    description: 'Turn popular R&B songs into disses against your opponent.',
    example: 'Example: "I don\'t want no scrub, a scrub is what you call this guy, hanging on the stage with no jokes and can\'t rhyme..."'
  }
]

export function BattleIntroductionStep({ userData, onNext, onBack }: BattleIntroductionStepProps) {
  const [selectedType, setSelectedType] = useState(userData.battleStyle || 'wildStyle')

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
            Battle Introduction
          </h1>
          <p className="text-xl text-zinc-300">
            The heart of Wild 'n Out is the battle system
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-zinc-300 mb-6">
            In battles, you'll showcase your creativity, humor, and skills in different formats.
            Select your preferred battle style to get started:
          </p>

          <div className="space-y-4">
            {battleTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.1), duration: 0.5 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedType === type.id
                    ? 'border-battle-yellow bg-battle-yellow/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedType === type.id ? 'border-battle-yellow' : 'border-zinc-500'
                    }`}>
                      {selectedType === type.id && (
                        <div className="w-3 h-3 rounded-full bg-battle-yellow"></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-xl font-medium ${
                      selectedType === type.id ? 'text-battle-yellow' : 'text-hype-white'
                    }`}>
                      {type.name}
                    </h3>
                    <p className="text-zinc-300 mt-1">
                      {type.description}
                    </p>
                    <p className="text-zinc-400 text-sm italic mt-2">
                      {type.example}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="p-4 border border-zinc-700 rounded-lg bg-zinc-800/50 mb-8"
        >
          <h3 className="text-lg font-medium text-hype-white mb-2">
            How Battles Work
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300">
            <li>Find an active battle in the Battle Arena</li>
            <li>Create your submission based on the battle format and rules</li>
            <li>Submit your entry before the deadline</li>
            <li>Vote on other entries during the voting phase</li>
            <li>Check results and earn achievements based on performance</li>
          </ol>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex justify-between"
        >
          <button
            onClick={onBack}
            className="px-6 py-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800"
          >
            Back
          </button>
          <button
            onClick={() => onNext({ battleStyle: selectedType })}
            className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-2 rounded-md"
          >
            Continue
          </button>
        </motion.div>
      </div>
    </div>
  )
}
