'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define player abilities and their upgrades
export interface Ability {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseEffect: number;
  effectPerLevel: number;
  currentEffect: number;
  upgradeCoins: number[];
}

// Define player statistics
export interface PlayerStats {
  highScore: number;
  totalDistance: number;
  totalRuns: number;
  totalCoins: number;
  totalBubbles: number;
  totalPowerUps: number;
  totalObstaclesAvoided: number;
  longestRun: number;
  highestCombo: number;
}

// Store interface
interface ProgressionStore {
  // Player level and experience
  level: number;
  experience: number;
  experienceToNextLevel: number;
  
  // Currency
  coins: number;
  bubbles: number;
  
  // Abilities
  abilities: Ability[];
  
  // Stats
  stats: PlayerStats;
  
  // Unlockables (by level or achievement)
  unlockedThemes: string[];
  unlockedCharacters: string[];
  
  // Active selections
  activeCharacter: string;
  activeTheme: string;
  
  // Methods
  addExperience: (amount: number) => void;
  addCoins: (amount: number) => void;
  addBubbles: (amount: number) => void;
  upgradeAbility: (abilityId: string) => boolean;
  
  // Stats tracking
  updateHighScore: (score: number) => void;
  updateTotalDistance: (distance: number) => void;
  incrementRuns: () => void;
  updateLongestRun: (distance: number) => void;
  updateHighestCombo: (combo: number) => void;
  trackBubbleCollection: (count: number) => void;
  trackPowerUpCollection: () => void;
  trackObstacleAvoidance: () => void;
  
  // Unlockables
  unlockTheme: (themeId: string) => void;
  unlockCharacter: (characterId: string) => void;
  
  // Active selection
  setActiveCharacter: (characterId: string) => void;
  setActiveTheme: (themeId: string) => void;
  
  // Calculated values
  getAbilityEffect: (abilityId: string) => number;
  getExperienceProgress: () => number; // 0-1 progress value
  
  // Utility
  checkLevelUnlocks: () => void;
}

// Experience required per level (formula: 100 * level^1.5)
const calculateExperienceForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

// Define initial abilities
const initialAbilities: Ability[] = [
  {
    id: 'bubble_magnet',
    name: 'Bubble Magnet',
    description: 'Increases the collection radius for bubbles',
    level: 1,
    maxLevel: 5,
    baseEffect: 1.0, // Base radius multiplier
    effectPerLevel: 0.2, // +20% per level
    currentEffect: 1.0, // Will be calculated
    upgradeCoins: [100, 250, 500, 1000, 2000]
  },
  {
    id: 'slow_fall',
    name: 'Slow Fall',
    description: 'Reduces the speed of falling after jumps',
    level: 1,
    maxLevel: 5,
    baseEffect: 1.0, // Base fall speed multiplier (smaller is better)
    effectPerLevel: -0.1, // -10% per level
    currentEffect: 1.0, // Will be calculated
    upgradeCoins: [100, 250, 500, 1000, 2000]
  },
  {
    id: 'bubble_value',
    name: 'Bubble Value',
    description: 'Increases the value of collected bubbles',
    level: 1,
    maxLevel: 5,
    baseEffect: 1.0, // Base value multiplier
    effectPerLevel: 0.2, // +20% per level
    currentEffect: 1.0, // Will be calculated
    upgradeCoins: [150, 300, 600, 1200, 2400]
  },
  {
    id: 'swim_speed',
    name: 'Swim Speed',
    description: 'Increases your movement speed between lanes',
    level: 1,
    maxLevel: 5,
    baseEffect: 1.0, // Base speed multiplier
    effectPerLevel: 0.15, // +15% per level
    currentEffect: 1.0, // Will be calculated
    upgradeCoins: [200, 400, 800, 1600, 3200]
  },
  {
    id: 'shield_duration',
    name: 'Shield Duration',
    description: 'Increases the duration of shield power-ups',
    level: 1,
    maxLevel: 5,
    baseEffect: 1.0, // Base duration multiplier
    effectPerLevel: 0.2, // +20% per level
    currentEffect: 1.0, // Will be calculated
    upgradeCoins: [150, 300, 600, 1200, 2400]
  },
  {
    id: 'score_multiplier',
    name: 'Score Multiplier',
    description: 'Increases your overall score',
    level: 1,
    maxLevel: 5,
    baseEffect: 1.0, // Base score multiplier
    effectPerLevel: 0.1, // +10% per level
    currentEffect: 1.0, // Will be calculated
    upgradeCoins: [300, 600, 1200, 2400, 4800]
  }
];

// Calculate the current effect for an ability based on its level
const calculateAbilityEffect = (ability: Ability): number => {
  return ability.baseEffect + (ability.level - 1) * ability.effectPerLevel;
};

// Update ability effects
const updateAbilityEffects = (abilities: Ability[]): Ability[] => {
  return abilities.map(ability => ({
    ...ability,
    currentEffect: calculateAbilityEffect(ability)
  }));
};

// Define level unlocks
const levelUnlocks: Record<number, { themes?: string[], characters?: string[] }> = {
  2: { themes: ['coral_reef'] },
  5: { characters: ['yellow_tang'] },
  8: { themes: ['open_ocean'] },
  12: { characters: ['blue_tang'] },
  15: { themes: ['deep_sea'] },
  20: { characters: ['pufferfish'] }
};

// Create the progression store with persistence
export const useProgressionStore = create<ProgressionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      level: 1,
      experience: 0,
      experienceToNextLevel: calculateExperienceForLevel(1),
      
      coins: 0,
      bubbles: 0,
      
      abilities: updateAbilityEffects(initialAbilities),
      
      stats: {
        highScore: 0,
        totalDistance: 0,
        totalRuns: 0,
        totalCoins: 0,
        totalBubbles: 0,
        totalPowerUps: 0,
        totalObstaclesAvoided: 0,
        longestRun: 0,
        highestCombo: 0
      },
      
      unlockedThemes: ['default'],
      unlockedCharacters: ['clownfish'],
      
      activeCharacter: 'clownfish',
      activeTheme: 'default',
      
      // Experience and leveling
      addExperience: (amount: number) => {
        set((state) => {
          let newExperience = state.experience + amount;
          let newLevel = state.level;
          let newExperienceToNextLevel = state.experienceToNextLevel;
          
          // Level up while experience is sufficient
          while (newExperience >= newExperienceToNextLevel) {
            newExperience -= newExperienceToNextLevel;
            newLevel++;
            newExperienceToNextLevel = calculateExperienceForLevel(newLevel);
          }
          
          // Check for level-up unlocks if level changed
          const levelChanged = newLevel > state.level;
          
          return {
            experience: newExperience,
            level: newLevel,
            experienceToNextLevel: newExperienceToNextLevel
          };
        });
        
        // Check for level-based unlocks
        get().checkLevelUnlocks();
      },
      
      // Currency
      addCoins: (amount: number) => {
        set((state) => ({
          coins: state.coins + amount,
          stats: {
            ...state.stats,
            totalCoins: state.stats.totalCoins + amount
          }
        }));
      },
      
      addBubbles: (amount: number) => {
        set((state) => ({
          bubbles: state.bubbles + amount
        }));
      },
      
      // Ability upgrades
      upgradeAbility: (abilityId: string) => {
        const ability = get().abilities.find(a => a.id === abilityId);
        
        if (!ability) return false;
        if (ability.level >= ability.maxLevel) return false;
        
        const upgradeCost = ability.upgradeCoins[ability.level - 1];
        if (get().coins < upgradeCost) return false;
        
        // Upgrade the ability and deduct coins
        set((state) => {
          const updatedAbilities = state.abilities.map(a => {
            if (a.id === abilityId) {
              const newLevel = a.level + 1;
              return {
                ...a,
                level: newLevel,
                currentEffect: a.baseEffect + (newLevel - 1) * a.effectPerLevel
              };
            }
            return a;
          });
          
          return {
            abilities: updatedAbilities,
            coins: state.coins - upgradeCost
          };
        });
        
        return true;
      },
      
      // Stats tracking
      updateHighScore: (score: number) => {
        set((state) => {
          if (score > state.stats.highScore) {
            return {
              stats: {
                ...state.stats,
                highScore: score
              }
            };
          }
          return state;
        });
      },
      
      updateTotalDistance: (distance: number) => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalDistance: state.stats.totalDistance + distance
          }
        }));
      },
      
      incrementRuns: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalRuns: state.stats.totalRuns + 1
          }
        }));
      },
      
      updateLongestRun: (distance: number) => {
        set((state) => {
          if (distance > state.stats.longestRun) {
            return {
              stats: {
                ...state.stats,
                longestRun: distance
              }
            };
          }
          return state;
        });
      },
      
      updateHighestCombo: (combo: number) => {
        set((state) => {
          if (combo > state.stats.highestCombo) {
            return {
              stats: {
                ...state.stats,
                highestCombo: combo
              }
            };
          }
          return state;
        });
      },
      
      trackBubbleCollection: (count: number) => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalBubbles: state.stats.totalBubbles + count
          }
        }));
      },
      
      trackPowerUpCollection: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalPowerUps: state.stats.totalPowerUps + 1
          }
        }));
      },
      
      trackObstacleAvoidance: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            totalObstaclesAvoided: state.stats.totalObstaclesAvoided + 1
          }
        }));
      },
      
      // Unlockables
      unlockTheme: (themeId: string) => {
        set((state) => {
          if (state.unlockedThemes.includes(themeId)) return state;
          
          return {
            unlockedThemes: [...state.unlockedThemes, themeId]
          };
        });
      },
      
      unlockCharacter: (characterId: string) => {
        set((state) => {
          if (state.unlockedCharacters.includes(characterId)) return state;
          
          return {
            unlockedCharacters: [...state.unlockedCharacters, characterId]
          };
        });
      },
      
      // Active selection
      setActiveCharacter: (characterId: string) => {
        set((state) => {
          if (!state.unlockedCharacters.includes(characterId)) return state;
          
          return {
            activeCharacter: characterId
          };
        });
      },
      
      setActiveTheme: (themeId: string) => {
        set((state) => {
          if (!state.unlockedThemes.includes(themeId)) return state;
          
          return {
            activeTheme: themeId
          };
        });
      },
      
      // Calculated values
      getAbilityEffect: (abilityId: string) => {
        const ability = get().abilities.find(a => a.id === abilityId);
        if (!ability) return 1.0; // Default multiplier
        
        return ability.currentEffect;
      },
      
      getExperienceProgress: () => {
        const { experience, experienceToNextLevel } = get();
        return experience / experienceToNextLevel;
      },
      
      // Utility
      checkLevelUnlocks: () => {
        const currentLevel = get().level;
        
        // Check each level up to the current level
        for (const [levelStr, unlocks] of Object.entries(levelUnlocks)) {
          const level = parseInt(levelStr);
          
          if (currentLevel >= level) {
            // Unlock themes
            if (unlocks.themes) {
              unlocks.themes.forEach(theme => {
                if (!get().unlockedThemes.includes(theme)) {
                  get().unlockTheme(theme);
                }
              });
            }
            
            // Unlock characters
            if (unlocks.characters) {
              unlocks.characters.forEach(character => {
                if (!get().unlockedCharacters.includes(character)) {
                  get().unlockCharacter(character);
                }
              });
            }
          }
        }
      }
    }),
    {
      name: 'nemo-progression', // Storage key
      partialize: (state) => ({
        // Only persist these fields
        level: state.level,
        experience: state.experience,
        experienceToNextLevel: state.experienceToNextLevel,
        coins: state.coins,
        bubbles: state.bubbles,
        abilities: state.abilities,
        stats: state.stats,
        unlockedThemes: state.unlockedThemes,
        unlockedCharacters: state.unlockedCharacters,
        activeCharacter: state.activeCharacter,
        activeTheme: state.activeTheme
      })
    }
  )
);