'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { OnboardingFeature } from '../OnboardingContainer';

interface FeatureHighlightStepProps {
  features?: OnboardingFeature[];
  onNext: () => void;
  onSkip: () => void;
}

// Default features if none provided
const DEFAULT_FEATURES: OnboardingFeature[] = [
  {
    id: 'community',
    title: 'Vibrant Community',
    description: 'Connect with fellow members, share ideas, and build relationships.',
    icon: <span className="text-4xl">👥</span>,
  },
  {
    id: 'points',
    title: 'Success Points',
    description: 'Earn points for your contributions that can be redeemed for tokens.',
    icon: <span className="text-4xl">🏆</span>,
  },
  {
    id: 'wallet',
    title: 'Wallet Integration',
    description: 'Connect your wallet to track your tokens and enable redemptions.',
    icon: <span className="text-4xl">💰</span>,
  },
  {
    id: 'achievements',
    title: 'Achievements & Badges',
    description: 'Unlock achievements and earn badges as you participate.',
    icon: <span className="text-4xl">🏅</span>,
  },
];

export function FeatureHighlightStep({ 
  features = DEFAULT_FEATURES,
  onNext,
  onSkip
}: FeatureHighlightStepProps) {
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };
  
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Platform Features</h2>
        <p className="text-gray-600">
          Discover what makes the Success Kid platform special.
        </p>
      </div>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-8 grid gap-4 md:grid-cols-2"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            variants={item}
            className="flex flex-col items-center rounded-lg border border-gray-200 p-4 text-center sm:flex-row sm:text-left"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 sm:mb-0 sm:mr-4">
              {feature.icon}
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
        <Button onClick={onNext}>
          Continue
        </Button>
        <Button variant="outline" onClick={onSkip}>
          Skip Tutorial
        </Button>
      </div>
    </div>
  );
}
