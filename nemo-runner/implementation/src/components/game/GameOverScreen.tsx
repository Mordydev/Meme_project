'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/lib/game-engine/GameContext';

interface GameOverScreenProps {
  onRestart: () => void;
  onExit: () => void;
}

export default function GameOverScreen({ onRestart, onExit }: GameOverScreenProps) {
  const { score, distance } = useGame();
  const [animationState, setAnimationState] = useState<'initial' | 'scoreReveal' | 'complete'>('initial');
  const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number>(0);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  
  // Load high score and check if current score is a new high score
  useEffect(() => {
    const savedHighScore = localStorage.getItem('nemo_high_score');
    const currentHighScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;
    
    setHighScore(currentHighScore);
    
    if (score > currentHighScore) {
      localStorage.setItem('nemo_high_score', score.toString());
      setIsNewHighScore(true);
      setHighScore(score);
    }
  }, [score]);
  
  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationState('scoreReveal'), 500);
    const timer2 = setTimeout(() => setAnimationState('complete'), 2500);
    
    // Simulate checking leaderboard position
    // In a real implementation, this would be an API call
    const mockLeaderboardCheck = setTimeout(() => {
      setLeaderboardPosition(Math.floor(Math.random() * 20) + 1);
    }, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(mockLeaderboardCheck);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <motion.div 
        className="bg-blue-900/90 p-8 rounded-xl max-w-md w-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl text-center text-white font-bold mb-2">Game Over</h2>
        
        <motion.div 
          className="text-center mb-6"
          animate={animationState !== 'initial' ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="text-5xl font-bold text-yellow-300 mb-1">
            {score.toLocaleString()}
          </div>
          <div className="text-blue-200">
            Distance: {Math.floor(distance).toLocaleString()}m
          </div>
          
          {isNewHighScore && (
            <motion.div 
              className="mt-2 text-green-300 font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              NEW HIGH SCORE!
            </motion.div>
          )}
          
          {!isNewHighScore && (
            <div className="mt-2 text-gray-300">
              High Score: {highScore.toLocaleString()}
            </div>
          )}
          
          {leaderboardPosition && (
            <motion.div 
              className="mt-4 text-green-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              Today's Leaderboard: #{leaderboardPosition}
            </motion.div>
          )}
        </motion.div>
        
        <motion.div 
          className="flex flex-col gap-3 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <button 
            onClick={onRestart}
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full transition-colors"
          >
            Play Again
          </button>
          <button 
            onClick={onExit}
            className="bg-transparent border border-blue-500 text-blue-300 hover:bg-blue-800/30 py-2 px-6 rounded-full transition-colors"
          >
            Back to Menu
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}