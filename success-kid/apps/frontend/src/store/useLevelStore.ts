import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UserLevelData } from '@/types';

interface LevelState {
  // Data
  currentLevel: number;
  currentPoints: number;
  nextLevelPoints: number;
  progress: number; // 0-100 percentage
  title: string;
  benefits: string[];
  badges: {
    current: string; // Badge URL
    next?: string;
  };
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setLevelData: (data: Partial<UserLevelData>) => void;
  addPoints: (points: number) => void;
  fetchLevelData: () => Promise<void>;
  checkLevelUp: () => Promise<{
    leveledUp: boolean;
    previousLevel?: number;
    newLevel?: number;
  }>;
  resetError: () => void;
}

// Level thresholds and titles
const LEVEL_CONFIG: Array<{
  threshold: number;
  title: string;
  benefits: string[];
  badge: string;
}> = [
  {
    threshold: 0,
    title: "New Arrival",
    benefits: ["Access to basic features"],
    badge: "/images/levels/level-1.svg"
  },
  {
    threshold: 500,
    title: "First Steps",
    benefits: ["Custom avatar frame", "Basic profile customization"],
    badge: "/images/levels/level-2.svg"
  },
  {
    threshold: 1000,
    title: "Sand Grabber",
    benefits: ["Post formatting options", "Expanded profile options"],
    badge: "/images/levels/level-3.svg"
  },
  {
    threshold: 2500,
    title: "Determined",
    benefits: ["Custom name color", "Priority in new features"],
    badge: "/images/levels/level-4.svg"
  },
  {
    threshold: 5000,
    title: "Achiever",
    benefits: ["Post highlighting", "Extended character limits"],
    badge: "/images/levels/level-5.svg"
  },
  {
    threshold: 10000,
    title: "Winner",
    benefits: ["Special emotes", "Custom profile badges"],
    badge: "/images/levels/level-6.svg"
  },
  {
    threshold: 25000,
    title: "Celebrated",
    benefits: ["Profile banner options", "Content showcase features"],
    badge: "/images/levels/level-7.svg"
  },
  {
    threshold: 50000,
    title: "Success Story",
    benefits: ["Comment spotlight", "Featured profile moments"],
    badge: "/images/levels/level-8.svg"
  },
  {
    threshold: 100000,
    title: "Victory Kid",
    benefits: ["Special platform effects", "Exclusive community access"],
    badge: "/images/levels/level-9.svg"
  },
  {
    threshold: 250000,
    title: "Legendary",
    benefits: ["Platform ambassador status", "Beta feature access"],
    badge: "/images/levels/level-10.svg"
  }
];

/**
 * Calculate level data based on points
 */
function calculateLevelData(points: number): UserLevelData {
  // Find the highest level threshold that the points exceed
  let currentLevelIndex = 0;
  
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (points >= LEVEL_CONFIG[i].threshold) {
      currentLevelIndex = i;
      break;
    }
  }
  
  const currentLevel = currentLevelIndex + 1;
  const currentLevelConfig = LEVEL_CONFIG[currentLevelIndex];
  
  // Calculate next level threshold and progress
  const nextLevelIndex = Math.min(currentLevelIndex + 1, LEVEL_CONFIG.length - 1);
  const nextLevelConfig = LEVEL_CONFIG[nextLevelIndex];
  
  const currentThreshold = currentLevelConfig.threshold;
  const nextThreshold = nextLevelConfig.threshold;
  
  // Calculate progress percentage to next level
  let progress = 0;
  if (currentLevelIndex < LEVEL_CONFIG.length - 1) {
    const pointsInLevel = points - currentThreshold;
    const pointsRequired = nextThreshold - currentThreshold;
    progress = Math.min(100, Math.round((pointsInLevel / pointsRequired) * 100));
  } else {
    // Max level reached
    progress = 100;
  }
  
  return {
    level: currentLevel,
    title: currentLevelConfig.title,
    currentPoints: points,
    nextLevelPoints: nextThreshold,
    progress,
    benefits: currentLevelConfig.benefits,
    badges: {
      current: currentLevelConfig.badge,
      next: nextLevelIndex !== currentLevelIndex ? nextLevelConfig.badge : undefined
    }
  };
}

/**
 * Level System Store
 * 
 * Central state management for the level system.
 */
export const useLevelStore = create<LevelState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentLevel: 1,
        currentPoints: 0,
        nextLevelPoints: 500,
        progress: 0,
        title: "New Arrival",
        benefits: ["Access to basic features"],
        badges: {
          current: "/images/levels/level-1.svg",
          next: "/images/levels/level-2.svg"
        },
        isLoading: false,
        error: null,
        
        // Set level data
        setLevelData: (data) => {
          set((state) => ({
            ...state,
            ...data,
            error: null
          }));
        },
        
        // Add points and recalculate level
        addPoints: (points) => {
          set((state) => {
            const newPoints = state.currentPoints + points;
            const levelData = calculateLevelData(newPoints);
            
            return {
              currentLevel: levelData.level,
              currentPoints: levelData.currentPoints,
              nextLevelPoints: levelData.nextLevelPoints,
              progress: levelData.progress,
              title: levelData.title,
              benefits: levelData.benefits,
              badges: levelData.badges,
              error: null
            };
          });
        },
        
        // Fetch level data from API
        fetchLevelData: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // This would be an API call in production
            // For now, we'll simulate with a delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock data - would be from API
            const mockPoints = 1230; // Example points
            const levelData = calculateLevelData(mockPoints);
            
            set({
              currentLevel: levelData.level,
              currentPoints: levelData.currentPoints,
              nextLevelPoints: levelData.nextLevelPoints,
              progress: levelData.progress,
              title: levelData.title,
              benefits: levelData.benefits,
              badges: levelData.badges,
              isLoading: false
            });
          } catch (error) {
            console.error('Error fetching level data:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error : new Error('Failed to fetch level data')
            });
          }
        },
        
        // Check for level up
        checkLevelUp: async () => {
          const { currentLevel, currentPoints } = get();
          
          // Recalculate level data based on current points
          const levelData = calculateLevelData(currentPoints);
          
          // Check if level changed
          const leveledUp = levelData.level > currentLevel;
          
          if (leveledUp) {
            // Update state with new level data
            set({
              currentLevel: levelData.level,
              nextLevelPoints: levelData.nextLevelPoints,
              progress: levelData.progress,
              title: levelData.title,
              benefits: levelData.benefits,
              badges: levelData.badges
            });
          }
          
          return {
            leveledUp,
            previousLevel: leveledUp ? currentLevel : undefined,
            newLevel: leveledUp ? levelData.level : undefined
          };
        },
        
        // Reset error state
        resetError: () => {
          set({ error: null });
        }
      }),
      {
        name: 'level-storage',
        // Only persist level data, not loading state or errors
        partialize: (state) => ({
          currentLevel: state.currentLevel,
          currentPoints: state.currentPoints
        }),
      }
    )
  )
);
