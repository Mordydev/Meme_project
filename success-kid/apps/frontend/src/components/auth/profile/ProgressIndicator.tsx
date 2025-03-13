'use client';

import { motion } from 'framer-motion';

interface Step {
  id: string;
  title: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  progress: number;
}

export function ProgressIndicator({ 
  steps, 
  currentStep, 
  progress 
}: ProgressIndicatorProps) {
  return (
    <div className="relative mb-8">
      {/* Progress bar */}
      <div className="relative mb-6 h-2 w-full rounded-full bg-gray-200">
        <motion.div 
          className="absolute left-0 top-0 h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="flex w-full justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div 
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                index <= currentStep
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <span 
              className={`mt-2 text-xs font-medium ${
                index <= currentStep
                  ? 'text-primary'
                  : 'text-gray-500'
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
