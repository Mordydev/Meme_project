'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth/authStore';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

interface InterestsStepProps {
  onComplete: (data: any) => void;
  isSubmitting: boolean;
}

// Available interest categories
const availableInterests = [
  { id: 'crypto', name: 'Cryptocurrency', icon: '💰' },
  { id: 'nft', name: 'NFTs', icon: '🖼️' },
  { id: 'defi', name: 'DeFi', icon: '🏦' },
  { id: 'dao', name: 'DAOs', icon: '🤝' },
  { id: 'metaverse', name: 'Metaverse', icon: '🌐' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'art', name: 'Digital Art', icon: '🎨' },
  { id: 'collectibles', name: 'Collectibles', icon: '🏆' },
  { id: 'music', name: 'Music NFTs', icon: '🎵' },
  { id: 'web3', name: 'Web3', icon: '🕸️' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'innovation', name: 'Innovation', icon: '💡' },
  { id: 'community', name: 'Community', icon: '👥' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'trading', name: 'Trading', icon: '📊' }
];

export function InterestsStep({ onComplete, isSubmitting }: InterestsStepProps) {
  const { profile, updateProfile } = useAuthStore();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);
  
  // Toggle interest selection
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Minimum selections required
    if (selectedInterests.length < 3) {
      return;
    }
    
    // Update profile in store
    updateProfile({
      interests: selectedInterests
    });
    
    // Complete the step
    onComplete({ interests: selectedInterests });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Your Interests</h2>
        <p className="text-gray-600">
          Select topics you're interested in to personalize your experience.
          <br />
          Choose at least 3 topics.
        </p>
      </div>
      
      {/* Interest selection grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {availableInterests.map((interest) => (
          <motion.button
            key={interest.id}
            type="button"
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
              selectedInterests.includes(interest.id)
                ? 'border-primary bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => toggleInterest(interest.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl mb-2">{interest.icon}</span>
            <span className="text-sm font-medium">{interest.name}</span>
          </motion.button>
        ))}
      </div>
      
      {/* Selected interests count */}
      <div className="text-center text-sm">
        <span className={selectedInterests.length < 3 ? 'text-red-500' : 'text-primary'}>
          {selectedInterests.length} of {availableInterests.length} selected
        </span>
        {selectedInterests.length < 3 && (
          <p className="text-red-500 mt-1">Please select at least 3 interests</p>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={isSubmitting || selectedInterests.length < 3}
      >
        Continue
      </Button>
    </form>
  );
}
