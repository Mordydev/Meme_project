'use client'

import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'

interface WelcomeStepProps {
  userData: any
  onNext: (data?: any) => void
  onSkip: () => void
  isSaving?: boolean
}

export function WelcomeStep({ userData, onNext, onSkip, isSaving = false }: WelcomeStepProps) {
  const { user } = useUser()
  const firstName = user?.firstName || 'there'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-5xl md:text-6xl font-display text-battle-yellow mb-4">
          WELCOME TO WILD 'N OUT
        </h1>
        <p className="text-2xl text-hype-white">
          Hey {firstName}, ready to get wild?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="max-w-lg mb-12"
      >
        <p className="text-xl text-zinc-300 mb-4">
          You've just joined the ultimate entertainment platform where you can:
        </p>
        
        <ul className="text-left space-y-4 mb-8">
          {[
            'Compete in wild battles to showcase your skills',
            'Create and share content with the community',
            'Build your reputation and earn achievements',
            'Connect with other Wild 'n Out fans'
          ].map((item, i) => (
            <motion.li 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + (i * 0.1), duration: 0.5 }}
              className="flex items-center text-hype-white"
            >
              <span className="text-battle-yellow mr-2">●</span> {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button
          onClick={() => onNext()}
          disabled={isSaving}
          className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-3 rounded-md text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Let's Go!
        </button>
        <button
          onClick={onSkip}
          disabled={isSaving}
          className="text-zinc-400 hover:text-hype-white px-8 py-3 rounded-md text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSaving ? (
            <>
              <span className="mr-2 size-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></span>
              Please wait...
            </>
          ) : (
            'Skip Intro'
          )}
        </button>
      </motion.div>
    </div>
  )
}
