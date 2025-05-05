'use client';

import { create } from 'zustand';

// Mission types for different objectives
export enum MissionType {
  DISTANCE = 'distance',
  COLLECT = 'collect',
  AVOID = 'avoid',
  COMBO = 'combo',
  TIME = 'time',
  PERFECT = 'perfect'
}

// Mission difficulties
export enum MissionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

// Mission status
export enum MissionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Mission interface
export interface Mission {
  id: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  status: MissionStatus;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  reward: {
    coins: number;
    experience: number;
  };
  additionalParams?: Record<string, any>;
}

// Daily challenge interface
export interface DailyChallenge extends Mission {
  expiresAt: number; // Timestamp
}

// Mission progress tracking
interface MissionProgress {
  missions: Mission[];
  dailyChallenges: DailyChallenge[];
  activeMissionId: string | null;
  completedMissions: string[];
  
  // Total rewards
  totalCoins: number;
  totalExperience: number;
  playerLevel: number;
}

// Interface for the mission store
interface MissionStore extends MissionProgress {
  // Mission management
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  completeMission: (id: string) => void;
  failMission: (id: string) => void;
  setActiveMission: (id: string) => void;
  
  // Mission progress tracking
  updateDistance: (distance: number) => void;
  collectItem: (itemType: string) => void;
  avoidObstacle: (obstacleType: string) => void;
  updateCombo: (combo: number) => void;
  updateTime: (time: number) => void;
  
  // Daily challenges
  generateDailyChallenges: () => void;
  checkDailyChallenges: () => void;
  
  // Rewards
  claimReward: (id: string) => void;
  
  // Utility
  getMissionById: (id: string) => Mission | null;
  getActiveMission: () => Mission | null;
  getDailyMissions: () => DailyChallenge[];
  getAvailableMissions: () => Mission[];
  getCompletedMissions: () => Mission[];
  
  // Reset
  resetMissions: () => void;
}

// Mission library - predefined mission templates
const missionLibrary: Partial<Mission>[] = [
  // Distance missions
  {
    type: MissionType.DISTANCE,
    difficulty: MissionDifficulty.EASY,
    title: 'Short Swim',
    description: 'Swim a distance of {target} meters',
    targetValue: 500,
    reward: { coins: 50, experience: 20 }
  },
  {
    type: MissionType.DISTANCE,
    difficulty: MissionDifficulty.MEDIUM,
    title: 'Extended Journey',
    description: 'Swim a distance of {target} meters',
    targetValue: 1000,
    reward: { coins: 100, experience: 40 }
  },
  {
    type: MissionType.DISTANCE,
    difficulty: MissionDifficulty.HARD,
    title: 'Marathon Swimmer',
    description: 'Swim a distance of {target} meters',
    targetValue: 2000,
    reward: { coins: 200, experience: 80 }
  },
  
  // Collection missions
  {
    type: MissionType.COLLECT,
    difficulty: MissionDifficulty.EASY,
    title: 'Bubble Collector',
    description: 'Collect {target} bubbles in a single run',
    targetValue: 50,
    reward: { coins: 60, experience: 25 },
    additionalParams: { itemType: 'bubble' }
  },
  {
    type: MissionType.COLLECT,
    difficulty: MissionDifficulty.MEDIUM,
    title: 'Golden Hunter',
    description: 'Collect {target} golden bubbles',
    targetValue: 10,
    reward: { coins: 120, experience: 50 },
    additionalParams: { itemType: 'goldenBubble' }
  },
  
  // Avoid missions
  {
    type: MissionType.AVOID,
    difficulty: MissionDifficulty.MEDIUM,
    title: 'Shark Dodger',
    description: 'Avoid {target} sharks in a single run',
    targetValue: 5,
    reward: { coins: 80, experience: 40 },
    additionalParams: { obstacleType: 'shark' }
  },
  
  // Combo missions
  {
    type: MissionType.COMBO,
    difficulty: MissionDifficulty.MEDIUM,
    title: 'Combo Master',
    description: 'Achieve a {target}x combo',
    targetValue: 10,
    reward: { coins: 100, experience: 45 }
  },
  
  // Time missions
  {
    type: MissionType.TIME,
    difficulty: MissionDifficulty.HARD,
    title: 'Endurance Test',
    description: 'Survive for {target} seconds',
    targetValue: 120,
    reward: { coins: 150, experience: 60 }
  },
  
  // Perfect run missions
  {
    type: MissionType.PERFECT,
    difficulty: MissionDifficulty.EXPERT,
    title: 'Perfect Swim',
    description: 'Complete a run without hitting any obstacles for {target} meters',
    targetValue: 1000,
    reward: { coins: 250, experience: 100 }
  }
];

// Helper function to generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Create the mission store
export const useMissionStore = create<MissionStore>((set, get) => ({
  // Initial state
  missions: [],
  dailyChallenges: [],
  activeMissionId: null,
  completedMissions: [],
  totalCoins: 0,
  totalExperience: 0,
  playerLevel: 1,
  
  // Mission management
  addMission: (mission: Mission) => {
    set((state) => ({
      missions: [...state.missions, { ...mission, id: mission.id || generateId() }]
    }));
  },
  
  updateMission: (id: string, updates: Partial<Mission>) => {
    set((state) => ({
      missions: state.missions.map((mission) => 
        mission.id === id ? { ...mission, ...updates } : mission
      ),
      dailyChallenges: state.dailyChallenges.map((challenge) => 
        challenge.id === id ? { ...challenge, ...updates } : challenge
      )
    }));
  },
  
  completeMission: (id: string) => {
    set((state) => ({
      missions: state.missions.map((mission) => 
        mission.id === id ? { ...mission, status: MissionStatus.COMPLETED } : mission
      ),
      dailyChallenges: state.dailyChallenges.map((challenge) => 
        challenge.id === id ? { ...challenge, status: MissionStatus.COMPLETED } : challenge
      ),
      completedMissions: [...state.completedMissions, id]
    }));
  },
  
  failMission: (id: string) => {
    set((state) => ({
      missions: state.missions.map((mission) => 
        mission.id === id ? { ...mission, status: MissionStatus.FAILED } : mission
      ),
      dailyChallenges: state.dailyChallenges.map((challenge) => 
        challenge.id === id ? { ...challenge, status: MissionStatus.FAILED } : challenge
      )
    }));
  },
  
  setActiveMission: (id: string) => {
    set(() => ({ activeMissionId: id }));
  },
  
  // Mission progress tracking
  updateDistance: (distance: number) => {
    const state = get();
    
    // Update distance missions
    [...state.missions, ...state.dailyChallenges].forEach((mission) => {
      if (mission.type === MissionType.DISTANCE && mission.status === MissionStatus.ACTIVE) {
        const newValue = distance;
        
        // Update mission progress
        if (newValue > mission.currentValue) {
          state.updateMission(mission.id, { currentValue: newValue });
        }
        
        // Check if mission completed
        if (newValue >= mission.targetValue) {
          state.completeMission(mission.id);
        }
      }
      
      // Also check perfect run missions
      if (mission.type === MissionType.PERFECT && mission.status === MissionStatus.ACTIVE) {
        const newValue = distance;
        
        // Update mission progress
        if (newValue > mission.currentValue) {
          state.updateMission(mission.id, { currentValue: newValue });
        }
        
        // Check if mission completed
        if (newValue >= mission.targetValue) {
          state.completeMission(mission.id);
        }
      }
    });
  },
  
  collectItem: (itemType: string) => {
    const state = get();
    
    // Update collection missions
    [...state.missions, ...state.dailyChallenges].forEach((mission) => {
      if (
        mission.type === MissionType.COLLECT && 
        mission.status === MissionStatus.ACTIVE &&
        mission.additionalParams?.itemType === itemType
      ) {
        const newValue = mission.currentValue + 1;
        
        // Update mission progress
        state.updateMission(mission.id, { currentValue: newValue });
        
        // Check if mission completed
        if (newValue >= mission.targetValue) {
          state.completeMission(mission.id);
        }
      }
    });
  },
  
  avoidObstacle: (obstacleType: string) => {
    const state = get();
    
    // Update avoidance missions
    [...state.missions, ...state.dailyChallenges].forEach((mission) => {
      if (
        mission.type === MissionType.AVOID && 
        mission.status === MissionStatus.ACTIVE &&
        mission.additionalParams?.obstacleType === obstacleType
      ) {
        const newValue = mission.currentValue + 1;
        
        // Update mission progress
        state.updateMission(mission.id, { currentValue: newValue });
        
        // Check if mission completed
        if (newValue >= mission.targetValue) {
          state.completeMission(mission.id);
        }
      }
    });
  },
  
  updateCombo: (combo: number) => {
    const state = get();
    
    // Update combo missions
    [...state.missions, ...state.dailyChallenges].forEach((mission) => {
      if (mission.type === MissionType.COMBO && mission.status === MissionStatus.ACTIVE) {
        // Update mission progress if this is a new highest combo
        if (combo > mission.currentValue) {
          state.updateMission(mission.id, { currentValue: combo });
        }
        
        // Check if mission completed
        if (combo >= mission.targetValue) {
          state.completeMission(mission.id);
        }
      }
    });
  },
  
  updateTime: (time: number) => {
    const state = get();
    
    // Update time missions
    [...state.missions, ...state.dailyChallenges].forEach((mission) => {
      if (mission.type === MissionType.TIME && mission.status === MissionStatus.ACTIVE) {
        // Update mission progress
        if (time > mission.currentValue) {
          state.updateMission(mission.id, { currentValue: time });
        }
        
        // Check if mission completed
        if (time >= mission.targetValue) {
          state.completeMission(mission.id);
        }
      }
    });
  },
  
  // Daily challenges
  generateDailyChallenges: () => {
    // Remove expired daily challenges
    set((state) => {
      const now = Date.now();
      const validChallenges = state.dailyChallenges.filter(
        (challenge) => challenge.expiresAt > now
      );
      
      // Generate new daily challenges if needed
      if (validChallenges.length < 3) {
        const numToGenerate = 3 - validChallenges.length;
        const newChallenges: DailyChallenge[] = [];
        
        // Get random mission templates from the library
        const usedIndexes = new Set<number>();
        
        for (let i = 0; i < numToGenerate; i++) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * missionLibrary.length);
          } while (usedIndexes.has(randomIndex));
          
          usedIndexes.add(randomIndex);
          
          const template = missionLibrary[randomIndex];
          
          // Create daily challenge from template
          const challenge: DailyChallenge = {
            id: generateId(),
            type: template.type!,
            difficulty: template.difficulty!,
            status: MissionStatus.ACTIVE,
            title: template.title!,
            description: template.description!.replace('{target}', template.targetValue!.toString()),
            targetValue: template.targetValue!,
            currentValue: 0,
            reward: { ...template.reward! },
            additionalParams: template.additionalParams,
            expiresAt: now + 24 * 60 * 60 * 1000 // 24 hours from now
          };
          
          newChallenges.push(challenge);
        }
        
        return { dailyChallenges: [...validChallenges, ...newChallenges] };
      }
      
      return { dailyChallenges: validChallenges };
    });
  },
  
  checkDailyChallenges: () => {
    set((state) => {
      const now = Date.now();
      const updatedChallenges = state.dailyChallenges.map((challenge) => {
        if (challenge.expiresAt < now && challenge.status === MissionStatus.ACTIVE) {
          return { ...challenge, status: MissionStatus.FAILED };
        }
        return challenge;
      });
      
      return { dailyChallenges: updatedChallenges };
    });
  },
  
  // Rewards
  claimReward: (id: string) => {
    const state = get();
    const mission = state.getMissionById(id);
    
    if (mission && mission.status === MissionStatus.COMPLETED) {
      set((state) => ({
        totalCoins: state.totalCoins + mission.reward.coins,
        totalExperience: state.totalExperience + mission.reward.experience,
        // Update player level based on experience
        playerLevel: Math.floor(1 + Math.sqrt(state.totalExperience / 100))
      }));
      
      // Remove mission from active list
      set((state) => ({
        missions: state.missions.filter((m) => m.id !== id),
        dailyChallenges: state.dailyChallenges.filter((m) => m.id !== id)
      }));
    }
  },
  
  // Utility
  getMissionById: (id: string) => {
    const state = get();
    
    // Search in both missions and daily challenges
    const mission = state.missions.find((m) => m.id === id);
    if (mission) return mission;
    
    const challenge = state.dailyChallenges.find((c) => c.id === id);
    return challenge || null;
  },
  
  getActiveMission: () => {
    const state = get();
    if (!state.activeMissionId) return null;
    
    return state.getMissionById(state.activeMissionId);
  },
  
  getDailyMissions: () => {
    return get().dailyChallenges;
  },
  
  getAvailableMissions: () => {
    return get().missions.filter((mission) => mission.status === MissionStatus.ACTIVE);
  },
  
  getCompletedMissions: () => {
    const state = get();
    return [...state.missions, ...state.dailyChallenges].filter(
      (mission) => mission.status === MissionStatus.COMPLETED
    );
  },
  
  // Reset
  resetMissions: () => {
    set(() => ({
      missions: [],
      activeMissionId: null,
      completedMissions: []
    }));
  }
}));