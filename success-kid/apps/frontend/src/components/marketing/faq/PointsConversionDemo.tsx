'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Define the step structure for the demo
const DEMO_STEPS = [
  { 
    title: "Select Points Amount", 
    description: "Choose how many Success Points you want to convert to tokens."
  },
  { 
    title: "Initiate Conversion", 
    description: "Initiate the conversion process to transform your points into tokens."
  },
  { 
    title: "Receive Tokens", 
    description: "Your Success Points are converted to SKC tokens at a rate of 100 SP = 1 SKC."
  }
];

// Step indicator component
interface StepIndicatorProps {
  currentStep: number;
  steps: { title: string; description: string }[];
  onStepChange: (step: number) => void;
  isAutoPlaying: boolean;
  autoPlayProgress: number;
}

const StepIndicator = ({ 
  currentStep, 
  steps, 
  onStepChange, 
  isAutoPlaying,
  autoPlayProgress
}: StepIndicatorProps) => {
  return (
    <div className="flex justify-between mb-8">
      {steps.map((step, index) => (
        <button
          key={index}
          onClick={() => onStepChange(index)}
          className={`flex flex-col items-center text-center flex-1 ${
            index <= currentStep ? 'text-primary' : 'text-gray-400'
          }`}
          disabled={isAutoPlaying}
        >
          <div className="relative">
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 border-2 ${
                index <= currentStep 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-300'
              }`}
            >
              {/* Active step progress indicator */}
              {index === currentStep && isAutoPlaying && (
                <svg className="absolute inset-0 w-12 h-12" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="46" 
                    fill="none" 
                    stroke="rgba(30, 136, 229, 0.2)" 
                    strokeWidth="8" 
                  />
                  <motion.circle 
                    cx="50" 
                    cy="50" 
                    r="46" 
                    fill="none" 
                    stroke="rgba(30, 136, 229, 0.6)" 
                    strokeWidth="8" 
                    strokeDasharray="290"
                    strokeDashoffset={290 * (1 - autoPlayProgress)}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              )}
              <span className="text-lg font-medium relative z-10">{index + 1}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="relative">
                {/* Base track */}
                <div 
                  className="absolute top-1/2 left-6 right-0 transform -translate-y-1/2 h-1 bg-gray-200"
                ></div>
                
                {/* Progress track for completed steps */}
                {index < currentStep && (
                  <div 
                    className="absolute top-1/2 left-6 right-0 transform -translate-y-1/2 h-1 bg-primary"
                  ></div>
                )}
                
                {/* Animated progress for current step */}
                {index === currentStep && isAutoPlaying && (
                  <motion.div 
                    className="absolute top-1/2 left-6 right-0 transform -translate-y-1/2 h-1 bg-primary origin-left"
                    style={{ scaleX: autoPlayProgress }}
                  ></motion.div>
                )}
              </div>
            )}
          </div>
          <span className="text-sm font-medium mt-2 max-w-[120px]">{step.title}</span>
        </button>
      ))}
    </div>
  );
};

// Points selector component
interface PointsSelectorProps {
  value: number;
  onChange: (value: number) => void;
  isAutoPlaying: boolean;
}

const PointsSelector = ({ value, onChange, isAutoPlaying }: PointsSelectorProps) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };
  
  const presetAmounts = [100, 500, 1000, 5000, 10000];
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-medium text-gray-700">Amount of Points</span>
        <motion.span 
          key={value}
          initial={{ scale: 1.2, color: '#2563EB' }}
          animate={{ scale: 1, color: '#1F2937' }}
          transition={{ duration: 0.3 }}
          className="font-bold"
        >
          {value.toLocaleString()} SP
        </motion.span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="100"
          max="10000"
          step="100"
          value={value}
          onChange={handleSliderChange}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${
            isAutoPlaying ? 'opacity-70' : 'accent-primary'
          }`}
          disabled={isAutoPlaying}
        />
        
        {isAutoPlaying && (
          <motion.div 
            className="absolute inset-y-0 left-0 bg-primary rounded-l-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
          ></motion.div>
        )}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>100 SP</span>
        <span>10,000 SP</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4">
        {presetAmounts.map(amount => (
          <button
            key={amount}
            onClick={() => onChange(amount)}
            className={`px-3 py-1 rounded-full text-sm ${
              value === amount
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${isAutoPlaying ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isAutoPlaying}
          >
            {amount.toLocaleString()} SP
          </button>
        ))}
      </div>
    </div>
  );
};

// Conversion initiator component
interface ConversionInitiatorProps {
  pointsAmount: number;
  onConvert: () => void;
  isAnimating: boolean;
  isAutoPlaying: boolean;
  autoPlayProgress: number;
}

const ConversionInitiator = ({ 
  pointsAmount, 
  onConvert, 
  isAnimating, 
  isAutoPlaying,
  autoPlayProgress
}: ConversionInitiatorProps) => {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="text-xl font-bold text-primary">{pointsAmount.toLocaleString()} SP</div>
        <div className="text-gray-500 text-sm">Ready to convert</div>
      </div>
      
      <div className="relative">
        <button
          onClick={onConvert}
          disabled={isAnimating || isAutoPlaying}
          className={`relative z-10 px-6 py-3 rounded-lg bg-primary text-white font-medium ${
            (isAnimating || isAutoPlaying) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-600 shadow-md hover:shadow-lg transition-all'
          }`}
        >
          {isAnimating ? 'Converting...' : 'Convert to Tokens'}
        </button>
        
        {isAutoPlaying && (
          <>
            <motion.div 
              className="absolute inset-0 rounded-lg bg-primary-600 opacity-30"
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <div className="mt-4 text-sm text-gray-500">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Auto-converting in progress...
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Conversion result component
interface ConversionResultProps {
  pointsAmount: number;
  tokenAmount: number;
  completed: boolean;
  onReset: () => void;
  isAutoPlaying: boolean;
  autoPlayProgress: number;
}

const ConversionResult = ({ 
  pointsAmount, 
  tokenAmount, 
  completed, 
  onReset, 
  isAutoPlaying,
  autoPlayProgress
}: ConversionResultProps) => {
  return (
    <div className="text-center">
      {completed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-5xl mb-4"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ 
              duration: 1.5,
              delay: 0.3
            }}
          >
            🎉
          </motion.div>
          <h4 className="text-xl font-bold text-primary mb-2">Conversion Complete!</h4>
          <p className="mb-6 text-gray-700">
            You've successfully converted <span className="font-semibold">{pointsAmount.toLocaleString()} Success Points</span> to <span className="font-semibold">{tokenAmount.toLocaleString()} SKC tokens</span>!
          </p>
          
          <div className="relative">
            <button
              onClick={onReset}
              disabled={isAutoPlaying}
              className={`relative z-10 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors ${
                isAutoPlaying ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              Start New Conversion
            </button>
            
            {isAutoPlaying && (
              <motion.div 
                className="absolute inset-0 rounded-lg bg-primary/10"
                style={{ scaleX: autoPlayProgress }}
              />
            )}
          </div>
          
          {isAutoPlaying && (
            <div className="mt-3 text-sm text-gray-500">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Demo will restart in {Math.ceil(4 * (1 - autoPlayProgress))} seconds...
              </motion.div>
            </div>
          )}
        </motion.div>
      ) : (
        <div>
          <div className="mb-6">
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">
                  {pointsAmount.toLocaleString()} SP
                </div>
                <div className="text-gray-500 text-sm">Success Points</div>
              </div>
              <motion.div 
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, repeatType: "reverse" }
                }}
                className="text-3xl"
              >
                ⟳
              </motion.div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">
                  {tokenAmount.toLocaleString()} SKC
                </div>
                <div className="text-gray-500 text-sm">Tokens</div>
              </div>
            </div>
          </div>
          
          <div className="animate-pulse text-center text-gray-600">
            Waiting for confirmation...
          </div>
        </div>
      )}
    </div>
  );
};

// Conversion visualization component
interface ConversionVisualizationProps {
  step: number;
  pointsAmount: number;
  isAnimating: boolean;
  completedConversion: boolean;
}

const ConversionVisualization = ({ 
  step, 
  pointsAmount, 
  isAnimating,
  completedConversion
}: ConversionVisualizationProps) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-lg p-8 border border-gray-200 flex items-center justify-center shadow-inner h-72">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${step}-${isAnimating}-${completedConversion}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {step === 0 && (
            <div>
              <motion.div 
                className="text-7xl mb-4 inline-block"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                ⭐
              </motion.div>
              <div className="text-xl font-semibold mb-3 text-gray-800">Success Points</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-transparent bg-clip-text mb-2">
                {pointsAmount.toLocaleString()} SP
              </div>
              <div className="text-gray-600">Ready to convert to tokens</div>
            </div>
          )}
          
          {step === 1 && !isAnimating && (
            <div>
              <motion.div 
                className="text-7xl mb-4 inline-block"
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                💱
              </motion.div>
              <div className="text-xl font-semibold mb-3 text-gray-800">Ready to Convert</div>
              <div className="text-gray-600 max-w-xs mx-auto">
                Click the button to convert {pointsAmount.toLocaleString()} SP to {(pointsAmount / 100).toLocaleString()} SKC
              </div>
            </div>
          )}
          
          {step === 1 && isAnimating && (
            <div>
              <div className="relative h-40 w-64 mx-auto">
                <motion.div
                  className="absolute top-1/2 left-0 transform -translate-y-1/2"
                  animate={{ 
                    x: [0, 120],
                    opacity: [1, 0],
                    scale: [1, 0.8]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <div className="text-6xl mb-2">⭐</div>
                  <div className="font-medium text-gray-700">Points</div>
                </motion.div>
                
                <motion.div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  animate={{ 
                    rotate: 360,
                    scale: [1.2, 1.4, 1.2]
                  }}
                  transition={{ 
                    rotate: { repeat: Infinity, duration: 3, ease: "linear" },
                    scale: { repeat: Infinity, duration: 1.5, repeatType: "reverse" }
                  }}
                >
                  <div className="text-5xl text-primary">⚙️</div>
                </motion.div>
                
                <motion.div
                  className="absolute top-1/2 right-0 transform -translate-y-1/2"
                  animate={{ 
                    x: [-120, 0],
                    opacity: [0, 1],
                    scale: [0.8, 1]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <div className="text-6xl mb-2">🪙</div>
                  <div className="font-medium text-gray-700">Tokens</div>
                </motion.div>
              </div>
              <div className="mt-4 text-gray-600">Converting your points to tokens...</div>
            </div>
          )}
          
          {step === 2 && !completedConversion && (
            <div>
              <motion.div 
                className="text-7xl mb-4 inline-block"
                animate={{ 
                  rotate: 360,
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                ⏳
              </motion.div>
              <div className="text-xl font-semibold mb-3 text-gray-800">Almost There!</div>
              <div className="text-gray-600">Finalizing your conversion</div>
              
              <motion.div
                className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden w-48 mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          )}
          
          {step === 2 && completedConversion && (
            <div>
              <motion.div 
                className="text-7xl mb-4 inline-block"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                  y: [0, -10, 0],
                }}
                transition={{ 
                  scale: { duration: 0.6, type: "spring" },
                  rotate: { duration: 0.6, type: "spring" },
                  y: { delay: 0.7, duration: 2, repeat: Infinity, repeatType: "reverse" }
                }}
              >
                🪙
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-xl font-semibold mb-3 text-gray-800"
              >
                Conversion Complete
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text mb-2"
              >
                {(pointsAmount / 100).toLocaleString()} SKC
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-gray-600"
              >
                Tokens are now in your wallet
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Toolbar component for auto-play controls
interface ToolbarProps {
  isAutoPlaying: boolean;
  toggleAutoPlay: () => void;
  autoPlaySpeed: 'slow' | 'medium' | 'fast';
  setAutoPlaySpeed: (speed: 'slow' | 'medium' | 'fast') => void;
}

const Toolbar = ({ isAutoPlaying, toggleAutoPlay, autoPlaySpeed, setAutoPlaySpeed }: ToolbarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border border-gray-200 mb-6 shadow-sm">
      <div className="flex items-center">
        <button
          onClick={toggleAutoPlay}
          className={`flex items-center justify-center px-3 py-1.5 rounded-md ${
            isAutoPlaying 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-primary hover:bg-primary-600 text-white'
          } transition-colors shadow-sm`}
        >
          {isAutoPlaying ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause Demo
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Play Demo
            </>
          )}
        </button>
        
        {isAutoPlaying && (
          <div className="ml-4 flex items-center space-x-1 sm:space-x-2">
            <span className="text-sm text-gray-600 hidden sm:inline">Speed:</span>
            <div className="flex rounded-md overflow-hidden border border-gray-300 shadow-sm">
              <button
                onClick={() => setAutoPlaySpeed('slow')}
                className={`px-2 py-1 text-xs ${
                  autoPlaySpeed === 'slow' 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } transition-colors`}
              >
                Slow
              </button>
              <button
                onClick={() => setAutoPlaySpeed('medium')}
                className={`px-2 py-1 text-xs ${
                  autoPlaySpeed === 'medium' 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } transition-colors`}
              >
                Medium
              </button>
              <button
                onClick={() => setAutoPlaySpeed('fast')}
                className={`px-2 py-1 text-xs ${
                  autoPlaySpeed === 'fast' 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } transition-colors`}
              >
                Fast
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 italic mt-2 sm:mt-0">
        {isAutoPlaying ? (
          <span className="flex items-center">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Auto-playing demonstration
          </span>
        ) : (
          "Interactive mode - try it yourself"
        )}
      </div>
    </div>
  );
};

export const PointsConversionDemo = () => {
  // Core state
  const [step, setStep] = useState(0);
  const [pointsAmount, setPointsAmount] = useState(500);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedConversion, setCompletedConversion] = useState(false);
  
  // Auto-play feature
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);
  
  // Use refs to store timeouts and interval IDs to avoid re-renders
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressCounterRef = useRef<number>(0);
  const totalStepsRef = useRef<number>(50);
  
  // Helper function to get step duration based on speed
  const getStepDuration = useCallback((): number => {
    switch (autoPlaySpeed) {
      case 'slow': return 8000;
      case 'fast': return 3000;
      case 'medium':
      default: return 5000;
    }
  }, [autoPlaySpeed]);
  
  // Helper function to get convert animation duration
  const getConvertDuration = useCallback((): number => {
    switch (autoPlaySpeed) {
      case 'slow': return 4000;
      case 'fast': return 1500;
      case 'medium':
      default: return 2500;
    }
  }, [autoPlaySpeed]);
  
  // Helper function to get final stage duration
  const getFinalStageDuration = useCallback((): number => {
    switch (autoPlaySpeed) {
      case 'slow': return 6000;
      case 'fast': return 2000;
      case 'medium':
      default: return 4000;
    }
  }, [autoPlaySpeed]);
  
  // Reset demo to initial state
  const resetDemo = useCallback(() => {
    setStep(0);
    setPointsAmount(500);
    setCompletedConversion(false);
    setAutoPlayProgress(0);
    progressCounterRef.current = 0;
  }, []);
  
  // Update progress in a separate effect to avoid dependency issues
  useEffect(() => {
    // Only run this when auto-playing is active
    if (!isAutoPlaying) return;
    
    // Clear any existing interval
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
    }
    
    // Reset progress counter
    progressCounterRef.current = 0;
    setAutoPlayProgress(0);
    
    // Determine the duration based on current state
    let duration: number;
    
    if (step === 0) {
      duration = getStepDuration();
    } else if (step === 1 && !isAnimating) {
      duration = 1000; // Short delay before animation
    } else if (step === 1 && isAnimating) {
      duration = getConvertDuration();
    } else if (step === 2 && !completedConversion) {
      duration = 1500; // Waiting for confirmation
    } else if (step === 2 && completedConversion) {
      duration = getFinalStageDuration();
    } else {
      duration = getStepDuration();
    }
    
    // Calculate total steps for the progress interval
    const interval = 100; // Update every 100ms for smooth progress
    totalStepsRef.current = Math.floor(duration / interval);
    
    // Set up the progress update interval
    autoPlayIntervalRef.current = setInterval(() => {
      // Increment the progress counter
      progressCounterRef.current += 1;
      
      // Update the progress state based on the counter
      setAutoPlayProgress(progressCounterRef.current / totalStepsRef.current);
      
      // Clear the interval when we've reached the target
      if (progressCounterRef.current >= totalStepsRef.current) {
        if (autoPlayIntervalRef.current) {
          clearInterval(autoPlayIntervalRef.current);
        }
      }
    }, interval);
    
    // Clean up when component unmounts or when dependencies change
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [
    isAutoPlaying, 
    step, 
    isAnimating, 
    completedConversion, 
    getStepDuration, 
    getConvertDuration, 
    getFinalStageDuration
  ]);
  
  // Control the autoplay sequence in a separate effect
  useEffect(() => {
    // Only run when auto-playing is active
    if (!isAutoPlaying) return;
    
    // Clear any existing timeout
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
    }
    
    // Define the sequence based on current state
    if (step === 0) {
      // Step 1: Select amount, then move to next step
      autoPlayTimeoutRef.current = setTimeout(() => {
        setStep(1);
      }, getStepDuration());
    } 
    else if (step === 1 && !isAnimating) {
      // Step 2: Start conversion after a short delay
      autoPlayTimeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        
        // When animation completes, move to step 3
        setTimeout(() => {
          setIsAnimating(false);
          setStep(2);
          
          // Show completion after a delay
          setTimeout(() => {
            setCompletedConversion(true);
            
            // Restart the cycle after showing completed state
            setTimeout(() => {
              resetDemo();
            }, getFinalStageDuration());
          }, 1500);
        }, getConvertDuration());
      }, 1000);
    }
    
    // Clean up when component unmounts or when dependencies change
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [
    isAutoPlaying, 
    step, 
    isAnimating, 
    getStepDuration, 
    getConvertDuration, 
    getFinalStageDuration, 
    resetDemo
  ]);
  
  // Handle manual conversion
  const handleConvert = useCallback(() => {
    if (isAutoPlaying) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setStep(2);
      
      setTimeout(() => {
        setCompletedConversion(true);
      }, 1500);
    }, getConvertDuration());
  }, [isAutoPlaying, getConvertDuration]);
  
  // Toggle autoplay state
  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      // Turning off autoplay
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
      setIsAutoPlaying(false);
      resetDemo();
    } else {
      // Turning on autoplay
      setIsAutoPlaying(true);
      resetDemo();
    }
  }, [isAutoPlaying, resetDemo]);
  
  // Handle manual step change
  const handleStepChange = useCallback((newStep: number) => {
    if (!isAutoPlaying) {
      setStep(newStep);
      setIsAnimating(false);
      setCompletedConversion(false);
    }
  }, [isAutoPlaying]);
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-primary to-primary-600 text-white p-4">
        <h3 className="text-xl font-semibold">Points to Tokens: Interactive Demo</h3>
      </div>
      
      <div className="p-6">
        <Toolbar 
          isAutoPlaying={isAutoPlaying}
          toggleAutoPlay={toggleAutoPlay}
          autoPlaySpeed={autoPlaySpeed}
          setAutoPlaySpeed={setAutoPlaySpeed}
        />
        
        <StepIndicator 
          currentStep={step} 
          steps={DEMO_STEPS}
          onStepChange={handleStepChange}
          isAutoPlaying={isAutoPlaying}
          autoPlayProgress={autoPlayProgress}
        />
        
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          {/* Left side: Controls */}
          <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-medium text-lg mb-4 text-gray-800">{DEMO_STEPS[step].title}</h4>
            <p className="text-gray-600 mb-6">{DEMO_STEPS[step].description}</p>
            
            {step === 0 && (
              <PointsSelector 
                value={pointsAmount} 
                onChange={setPointsAmount}
                isAutoPlaying={isAutoPlaying}
              />
            )}
            
            {step === 1 && (
              <ConversionInitiator
                pointsAmount={pointsAmount}
                onConvert={handleConvert}
                isAnimating={isAnimating}
                isAutoPlaying={isAutoPlaying}
                autoPlayProgress={autoPlayProgress}
              />
            )}
            
            {step === 2 && (
              <ConversionResult
                pointsAmount={pointsAmount}
                tokenAmount={pointsAmount / 100}
                completed={completedConversion}
                onReset={resetDemo}
                isAutoPlaying={isAutoPlaying}
                autoPlayProgress={autoPlayProgress}
              />
            )}
          </div>
          
          {/* Right side: Visualization */}
          <ConversionVisualization
            step={step}
            pointsAmount={pointsAmount}
            isAnimating={isAnimating}
            completedConversion={completedConversion}
          />
        </div>
        
        <div className="mt-8 bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h5 className="font-medium mb-4 text-gray-800">Key Points:</h5>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-2 mt-0.5">✓</span>
              <span className="text-gray-700">Conversion rate: <span className="font-semibold">100 SP = 1 SKC token</span></span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-2 mt-0.5">✓</span>
              <span className="text-gray-700">Minimum conversion: <span className="font-semibold">100 SP (1 SKC)</span></span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-2 mt-0.5">✓</span>
              <span className="text-gray-700">Weekly redemption cap: <span className="font-semibold">10,000 SP (100 SKC)</span></span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-2 mt-0.5">✓</span>
              <span className="text-gray-700">Wallet connection required for redemption</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-2 mt-0.5">✓</span>
              <span className="text-gray-700">No platform fees for conversion (only standard network fees apply)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
