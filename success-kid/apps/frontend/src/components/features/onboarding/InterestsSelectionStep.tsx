'use client';

import { useState } from 'react';
import { User } from '@clerk/nextjs/dist/types/server';
import { Button } from '@/components/ui/button';

interface InterestsSelectionStepProps {
  data: {
    selectedInterests?: string[];
  };
  onComplete: (data: any) => void;
  user: User | null;
}

// Available interest categories
const INTEREST_CATEGORIES = [
  { id: 'crypto', name: 'Cryptocurrency', description: 'Blockchain, tokens, and trading' },
  { id: 'investing', name: 'Investing', description: 'Investment strategies and finance' },
  { id: 'technology', name: 'Technology', description: 'Tech news and innovations' },
  { id: 'memes', name: 'Memes', description: 'Internet culture and humor' },
  { id: 'art', name: 'Digital Art', description: 'NFTs and digital creations' },
  { id: 'gaming', name: 'Gaming', description: 'Video games and gaming culture' },
  { id: 'defi', name: 'DeFi', description: 'Decentralized finance' },
  { id: 'nfts', name: 'NFTs', description: 'Non-fungible tokens' },
  { id: 'community', name: 'Community', description: 'Building and growing communities' },
  { id: 'education', name: 'Education', description: 'Learning and teaching resources' },
];

export default function InterestsSelectionStep({ data, onComplete, user }: InterestsSelectionStepProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    data.selectedInterests || []
  );
  
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };
  
  const handleContinue = () => {
    onComplete({ selectedInterests });
  };
  
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Select Your Interests</h2>
      <p className="mb-6 text-gray-600">
        Choose topics you're interested in to personalize your experience
      </p>
      
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {INTEREST_CATEGORIES.map(interest => (
          <div
            key={interest.id}
            className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
              selectedInterests.includes(interest.id)
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 bg-white'
            }`}
            onClick={() => toggleInterest(interest.id)}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{interest.name}</h3>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  selectedInterests.includes(interest.id)
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300'
                }`}
              >
                {selectedInterests.includes(interest.id) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">{interest.description}</p>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <p className="text-sm text-gray-500">
          {selectedInterests.length > 0
            ? `${selectedInterests.length} topic${selectedInterests.length !== 1 ? 's' : ''} selected`
            : 'Select at least 1 topic to continue'}
        </p>
        <Button
          onClick={handleContinue}
          disabled={selectedInterests.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// Static method to handle next button click from parent
InterestsSelectionStep.handleNext = (data: any) => {
  return data.selectedInterests && data.selectedInterests.length > 0;
};
