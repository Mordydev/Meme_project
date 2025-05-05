'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useDifficultyStore, useInterpolatedDifficulty } from './DifficultyManager';
import { useEnvironmentStore, EnvironmentZone } from './EnvironmentManager';
import { useAudioStore } from './AudioContext';
import { AudioCategory } from './AudioManager';

export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER
}

interface GameContextType {
  state: GameState;
  score: number;
  distance: number;
  speed: number;
  lives: number;
  multiplier: number;
  difficultyLevel: number;
  environmentZone: EnvironmentZone;
  isEnvironmentTransitioning: boolean;
  // Audio settings
  isMuted: boolean;
  globalVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  // Methods
  changeState: (newState: GameState) => void;
  addScore: (points: number) => void;
  increaseDistance: (amount: number) => void;
  increaseSpeed: (amount: number) => void;
  decreaseLives: () => void;
  setMultiplier: (value: number) => void;
  resetGame: () => void;
  // Audio methods
  toggleMute: () => void;
  setGlobalVolume: (volume: number) => void;
  setAudioCategoryVolume: (category: AudioCategory, volume: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  // Game state
  const [state, setState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [multiplier, setMultiplier] = useState<number>(1);
  
  // Difficulty management
  const updateDifficultyDistance = useDifficultyStore(state => state.updateDistance);
  const resetDifficulty = useDifficultyStore(state => state.reset);
  const difficultyLevel = useDifficultyStore(state => state.currentLevel);
  const difficultyParams = useInterpolatedDifficulty();
  const [speed, setSpeed] = useState<number>(1);
  
  // Environment management
  const updateEnvironmentDistance = useEnvironmentStore(state => state.updateDistance);
  const resetEnvironment = useEnvironmentStore(state => state.reset);
  const currentZone = useEnvironmentStore(state => state.currentZone);
  const isTransitioning = useEnvironmentStore(state => state.isTransitioning);
  
  // Audio management
  const muted = useAudioStore(state => state.muted);
  const globalVolume = useAudioStore(state => state.globalVolume);
  const categoryVolumes = useAudioStore(state => state.categoryVolumes);
  const toggleMute = useAudioStore(state => state.toggleMute);
  const setGlobalVol = useAudioStore(state => state.setGlobalVolume);
  const setCategoryVolume = useAudioStore(state => state.setCategoryVolume);
  
  // Update difficulty and environment based on distance
  useEffect(() => {
    if (state === GameState.PLAYING) {
      updateDifficultyDistance(distance);
      updateEnvironmentDistance(distance);
    }
  }, [distance, state, updateDifficultyDistance, updateEnvironmentDistance]);
  
  // Update speed based on difficulty
  useEffect(() => {
    if (state === GameState.PLAYING) {
      setSpeed(difficultyParams.speedMultiplier);
    }
  }, [difficultyParams.speedMultiplier, state]);

  const changeState = useCallback((newState: GameState) => {
    setState(newState);
  }, []);

  const addScore = useCallback((points: number) => {
    setScore(prevScore => prevScore + (points * multiplier));
  }, [multiplier]);

  const increaseDistance = useCallback((amount: number) => {
    setDistance(prevDistance => prevDistance + amount);
  }, []);

  const increaseSpeed = useCallback((amount: number) => {
    setSpeed(prevSpeed => Math.min(prevSpeed + amount, 5)); // Cap speed at 5
  }, []);

  const decreaseLives = useCallback(() => {
    setLives(prevLives => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        setState(GameState.GAME_OVER);
      }
      return newLives;
    });
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setDistance(0);
    setSpeed(1);
    setLives(3);
    setMultiplier(1);
    resetDifficulty();
    resetEnvironment();
    setState(GameState.MENU);
  }, [resetDifficulty, resetEnvironment]);
  
  // Audio control methods
  const setGlobalVolume = useCallback((volume: number) => {
    setGlobalVol(Math.max(0, Math.min(1, volume)));
  }, [setGlobalVol]);
  
  const setAudioCategoryVolume = useCallback((category: AudioCategory, volume: number) => {
    setCategoryVolume(category, Math.max(0, Math.min(1, volume)));
  }, [setCategoryVolume]);

  const value = {
    state,
    score,
    distance,
    speed,
    lives,
    multiplier,
    difficultyLevel,
    environmentZone: currentZone,
    isEnvironmentTransitioning: isTransitioning,
    // Audio settings
    isMuted: muted,
    globalVolume,
    musicVolume: categoryVolumes[AudioCategory.MUSIC],
    sfxVolume: categoryVolumes[AudioCategory.SFX],
    ambientVolume: categoryVolumes[AudioCategory.AMBIENT],
    // Methods
    changeState,
    addScore,
    increaseDistance,
    increaseSpeed,
    decreaseLives,
    setMultiplier,
    resetGame,
    // Audio methods
    toggleMute,
    setGlobalVolume,
    setAudioCategoryVolume
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}