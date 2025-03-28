'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/store/auth/authStore';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface InterestsSelectionStepProps {
  profile: UserProfile | null;
  onUpdate: (data: Partial<UserProfile>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Sample interest categories
const INTEREST_CATEGORIES = [
  { id: 'crypto', label: 'Cryptocurrency' },
  { id: 'defi', label: 'DeFi' },
  { id: 'nfts', label: 'NFTs' },
  { id: 'trading', label: 'Trading' },
  { id: 'blockchain', label: 'Blockchain Technology' },
  { id: 'memes', label: 'Memes & Culture' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'art', label: 'Digital Art' },
  { id: 'investing', label: 'Investing' },
  { id: 'community', label: 'Community Building' },
  { id: 'development', label: 'Software Development' },
  { id: 'education', label: 'Education' },
];

export function InterestsSelectionStep({ 
  profile, 
  onUpdate, 
  onNext,
  onPrevious
}: InterestsSelectionStepProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);
  const [error, setError] = useState<string | null>(null);
  
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
    setError(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate - require at least one interest
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest');
      return;
    }
    
    // Update profile
    onUpdate({ interests: selectedInterests });
    
    // Move to next step
    onNext();
  };
  
  // Animation variants for grid items
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-bold text-gray-800">Select Your Interests</h2>
          <p className="mb-4 text-gray-600">
            Choose topics you're interested in to help us personalize your experience.
          </p>
          
          {error && (
            <p className="mb-4 text-sm text-red-500">{error}</p>
          )}
          
          <motion.div 
            className="grid grid-cols-2 gap-3 md:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {INTEREST_CATEGORIES.map((interest) => (
              <motion.div key={interest.id} variants={item}>
                <button
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className={`flex w-full items-center justify-center rounded-lg border px-4 py-3 text-center text-sm font-medium transition-all ${
                    selectedInterests.includes(interest.id)
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {interest.label}
                </button>
              </motion.div>
            ))}
          </motion.div>
          
          <p className="mt-4 text-sm text-gray-500">
            Selected: {selectedInterests.length} of {INTEREST_CATEGORIES.length}
          </p>
        </div>
        
        <div className="flex justify-between">
          <Button 
            type="button" 
            onClick={onPrevious}
            variant="outline"
          >
            Back
          </Button>
          <Button type="submit">
            Continue
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
