'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, GameState } from '@/lib/game-engine/GameContext';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  position: 'top' | 'right' | 'bottom' | 'left' | 'center';
  showAfterDistance?: number;
  showOnAction?: string;
  requiresCompletion?: boolean;
  completedWhen?: () => boolean;
}

export default function TutorialSystem() {
  const { state, distance, changeState } = useGame();
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [tutorialEnabled, setTutorialEnabled] = useState<boolean>(true);
  const [tutorialShown, setTutorialShown] = useState<boolean>(false);

  // Load tutorial state from local storage
  useEffect(() => {
    const savedState = localStorage.getItem('nemo_tutorial_completed');
    if (savedState) {
      setTutorialShown(true);
      setTutorialEnabled(false);
    }
  }, []);

  // Tutorial steps definition
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to NEMO Runner!',
      description: 'Swim through the ocean, avoid obstacles, and collect bubbles for points. Ready to dive in?',
      position: 'center',
      showOnAction: 'gameStart',
    },
    {
      id: 'movement',
      title: 'Swimming Controls',
      description: 'Use arrow keys (↑ ↓ ← →) to navigate through the ocean. Try moving around now!',
      position: 'bottom',
      showAfterDistance: 20,
      requiresCompletion: true,
      completedWhen: () => true, // Auto-complete after being shown
    },
    {
      id: 'obstacles',
      title: 'Watch Out for Obstacles!',
      description: 'Avoid corals, rocks, and other sea creatures to stay swimming.',
      position: 'top',
      showAfterDistance: 100,
    },
    {
      id: 'collectibles',
      title: 'Collect Bubbles',
      description: 'Swim through bubbles to earn points. Larger bubbles are worth more!',
      position: 'right',
      showAfterDistance: 200,
    },
    {
      id: 'powerups',
      title: 'Power-Ups',
      description: 'Special power-ups will appear occasionally. Collect them for helpful abilities!',
      position: 'left',
      showAfterDistance: 300,
    },
    {
      id: 'zones',
      title: 'Ocean Zones',
      description: "You'll explore different ocean environments as you swim further. Each has unique challenges!",
      position: 'top',
      showAfterDistance: 500,
    }
  ];

  // Check for distance-based tutorial triggers
  useEffect(() => {
    if (!tutorialEnabled || state !== GameState.PLAYING) return;

    for (const step of tutorialSteps) {
      // Skip completed steps
      if (completedSteps.includes(step.id)) continue;

      // Check if this step should be shown based on distance
      if (step.showAfterDistance !== undefined && distance >= step.showAfterDistance) {
        setCurrentStep(step);
        break;
      }
    }
  }, [distance, tutorialEnabled, state, completedSteps]);

  // Handle tutorial step completion
  const completeCurrentStep = () => {
    if (!currentStep) return;

    setCompletedSteps(prev => [...prev, currentStep.id]);
    setCurrentStep(null);
  };

  // Skip the entire tutorial
  const skipTutorial = () => {
    setTutorialEnabled(false);
    setCurrentStep(null);
    localStorage.setItem('nemo_tutorial_completed', 'true');
  };

  // Handle the "gameStart" action trigger
  useEffect(() => {
    if (state === GameState.PLAYING && !tutorialShown && tutorialEnabled) {
      const welcomeStep = tutorialSteps.find(step => step.id === 'welcome');
      if (welcomeStep) {
        setCurrentStep(welcomeStep);
        setTutorialShown(true);
      }
    }
  }, [state, tutorialShown, tutorialEnabled]);

  // If no current step or game is not in playing state, don't render anything
  if (!currentStep || (state !== GameState.PLAYING && currentStep.id !== 'welcome')) return null;

  // Get position styles based on position prop
  const getPositionStyles = (position: string): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { top: '10%', left: '50%', transform: 'translateX(-50%)' };
      case 'right':
        return { top: '50%', right: '5%', transform: 'translateY(-50%)' };
      case 'bottom':
        return { bottom: '10%', left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { top: '50%', left: '5%', transform: 'translateY(-50%)' };
      case 'center':
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="absolute z-40"
        style={getPositionStyles(currentStep.position)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-blue-900/90 p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="text-xl font-bold text-white mb-2">{currentStep.title}</h3>
          <p className="text-blue-100 text-sm mb-4">{currentStep.description}</p>
          
          <div className="flex justify-between">
            <button 
              onClick={skipTutorial}
              className="text-blue-300 text-xs hover:text-white"
            >
              Skip Tutorial
            </button>
            <button 
              onClick={completeCurrentStep}
              className="bg-blue-600 text-white px-4 py-1 text-sm rounded hover:bg-blue-500"
            >
              Got it!
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}