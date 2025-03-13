'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PointsIntroductionStepProps {
  onNext: () => void;
  onSkip: () => void;
}

// Sample points activities
const POINT_ACTIVITIES = [
  { activity: 'Creating a post', points: 50, limit: '200/day' },
  { activity: 'Commenting', points: 15, limit: '150/day' },
  { activity: 'Receiving a comment', points: 5, limit: '100/day' },
  { activity: 'Upvote received', points: 5, limit: '100/day' },
  { activity: 'Daily login', points: 20, limit: '1/day' },
  { activity: 'Referring a new user', points: 500, limit: 'Unlimited' },
];

export function PointsIntroductionStep({ 
  onNext,
  onSkip
}: PointsIntroductionStepProps) {
  return (
    <div>
      <div className="mb-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4 inline-block"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl text-white">
            SP
          </div>
        </motion.div>
        
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-2 text-2xl font-bold text-gray-900"
        >
          Success Points
        </motion.h2>
        
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-gray-600"
        >
          Earn points for your contributions and redeem them for SKC tokens.
        </motion.p>
      </div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mb-8"
      >
        <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
          <div className="bg-gray-50 px-4 py-3">
            <h3 className="font-medium text-gray-900">How to Earn Points</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {POINT_ACTIVITIES.map((item, index) => (
              <div key={index} className="flex justify-between px-4 py-3">
                <span className="text-gray-700">{item.activity}</span>
                <div className="text-right">
                  <span className="font-semibold text-primary">{item.points} SP</span>
                  <span className="ml-2 text-xs text-gray-500">({item.limit})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-lg bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Points to Tokens</h3>
              <p className="text-sm text-gray-600">Convert your points to SKC tokens</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary">100 SP = 1 SKC</div>
              <div className="text-xs text-gray-500">Minimum: 1,000 SP</div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-col space-y-3 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0"
      >
        <Button onClick={onNext}>
          Continue
        </Button>
        <Button variant="outline" onClick={onSkip}>
          Skip Tutorial
        </Button>
      </motion.div>
    </div>
  );
}
