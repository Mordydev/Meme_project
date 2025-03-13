'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex justify-center"
      >
        {/* Success Kid logo/image would go here */}
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/20">
          <span className="text-6xl">🤜</span>
        </div>
      </motion.div>
      
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-3 text-3xl font-bold text-gray-900"
      >
        Welcome to Success Kid!
      </motion.h1>
      
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mb-8 text-gray-600"
      >
        You're about to join an amazing community where you can earn rewards, connect with others, and celebrate achievements together!
      </motion.p>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mx-auto mb-8 max-w-md rounded-lg bg-primary/5 p-4 text-left"
      >
        <h3 className="mb-2 font-medium text-primary">What to expect:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2 text-primary">✓</span>
            <span>Learn how Success Points work and how to earn them</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">✓</span>
            <span>Discover the key features of the platform</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">✓</span>
            <span>Set up your wallet for token rewards</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">✓</span>
            <span>Earn your first achievement!</span>
          </li>
        </ul>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-col space-y-3 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
      >
        <Button onClick={onNext} size="lg">
          Let's Go!
        </Button>
        <Button variant="outline" onClick={onSkip}>
          Skip Tutorial
        </Button>
      </motion.div>
    </div>
  );
}
