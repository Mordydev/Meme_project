'use client'

import { motion } from 'framer-motion'
import { Check, Flame, CircleUser, Users, Coins } from 'lucide-react'

interface CompletionStepProps {
  userData: any
  onComplete: (data?: any) => void
  onBack: () => void
}

export function CompletionStep({ userData, onComplete, onBack }: CompletionStepProps) {
  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="max-w-3xl mx-auto w-full flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="w-24 h-24 bg-victory-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={48} className="text-victory-green" />
          </div>
          
          <h1 className="text-4xl font-display text-battle-yellow mb-2">
            You're All Set!
          </h1>
          <p className="text-xl text-zinc-300">
            Welcome to the Wild 'n Out community
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md bg-zinc-800/70 rounded-lg p-6 border border-zinc-700 mb-8"
        >
          <h3 className="text-lg font-medium text-hype-white mb-4">
            Your Profile Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <CircleUser size={20} className="text-zinc-400 mr-3" />
              <div>
                <div className="text-hype-white font-medium">
                  {userData.displayName || 'Display Name'}
                </div>
                <div className="text-sm text-zinc-400">
                  Display Name
                </div>
              </div>
            </div>
            
            {userData.interests && userData.interests.length > 0 && (
              <div className="flex items-center">
                <Flame size={20} className="text-zinc-400 mr-3" />
                <div>
                  <div className="text-hype-white font-medium">
                    {userData.interests.slice(0, 3).join(', ')}
                    {userData.interests.length > 3 && ` +${userData.interests.length - 3} more`}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Interests
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <Flame size={20} className="text-zinc-400 mr-3" />
              <div>
                <div className="text-hype-white font-medium">
                  {battleTypes[userData.battleStyle] || 'Wild Style'}
                </div>
                <div className="text-sm text-zinc-400">
                  Preferred Battle Type
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h3 className="text-lg font-medium text-hype-white mb-3">
            Getting Started
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <Flame size={24} className="text-battle-yellow mx-auto mb-2" />
              <div className="text-hype-white font-medium">
                Join a Battle
              </div>
              <div className="text-sm text-zinc-400">
                Compete in Wild 'n Out style battles
              </div>
            </div>
            
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <Users size={24} className="text-flow-blue mx-auto mb-2" />
              <div className="text-hype-white font-medium">
                Explore Community
              </div>
              <div className="text-sm text-zinc-400">
                Connect with other fans
              </div>
            </div>
            
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <Coins size={24} className="text-battle-yellow mx-auto mb-2" />
              <div className="text-hype-white font-medium">
                Connect Wallet
              </div>
              <div className="text-sm text-zinc-400">
                Link your crypto wallet
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={onBack}
            className="px-6 py-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800"
          >
            Back
          </button>
          <button
            onClick={() => onComplete()}
            className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-3 rounded-md"
          >
            Enter Wild 'n Out
          </button>
        </motion.div>
      </div>
    </div>
  )
}

const battleTypes: Record<string, string> = {
  'wildStyle': 'Wild Style',
  'pickUpKillIt': 'Pick Up & Kill It',
  'rAndBeef': 'R&Beef'
}
