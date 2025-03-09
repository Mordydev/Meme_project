'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ProfileSetupStepProps {
  userData: any
  onNext: (data?: any) => void
  onBack: () => void
}

const INTERESTS = [
  "Comedy", "Rap Battles", "Freestyle", "Hip Hop", "Improv",
  "Wild 'n Out Show", "Nick Cannon", "Meme Culture", "Content Creation", 
  "Token Investing", "Community Building"
]

export function ProfileSetupStep({ userData, onNext, onBack }: ProfileSetupStepProps) {
  const [displayName, setDisplayName] = useState(userData.displayName || '')
  const [bio, setBio] = useState(userData.bio || '')
  const [interests, setInterests] = useState<string[]>(userData.interests || [])
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!displayName.trim()) {
      setError('Please enter a display name')
      return
    }
    
    if (displayName.trim().length < 3) {
      setError('Display name must be at least 3 characters long')
      return
    }
    
    if (displayName.trim().length > 30) {
      setError('Display name must be under 30 characters')
      return
    }
    
    // Bio validation (optional field)
    if (bio && bio.length > 200) {
      setError('Bio must be under 200 characters')
      return
    }
    
    // Clear any previous errors
    setError('')
    
    onNext({
      displayName: displayName.trim(),
      bio: bio.trim(),
      interests
    })
  }

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest))
    } else {
      setInterests([...interests, interest])
    }
  }

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display text-battle-yellow mb-2">
            Set Up Your Profile
          </h1>
          <p className="text-xl text-zinc-300">
            Let the community know who you are
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {error && (
            <div className="bg-roast-red/10 border border-roast-red p-3 rounded-md text-roast-red">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="displayName" className="block text-zinc-300 mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md text-hype-white focus:outline-none focus:ring-2 focus:ring-battle-yellow"
              placeholder="How should we call you?"
            />
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-zinc-300 mb-2">
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md text-hype-white focus:outline-none focus:ring-2 focus:ring-battle-yellow"
              placeholder="Tell us about yourself..."
            />
          </div>
          
          <div>
            <label className="block text-zinc-300 mb-3">
              Interests (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest, index) => (
                <motion.button
                  key={interest}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (index * 0.05), duration: 0.3 }}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-2 rounded-full text-sm ${
                    interests.includes(interest)
                      ? 'bg-battle-yellow text-wild-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {interest}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="submit"
              className="bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-2 rounded-md"
            >
              Continue
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
