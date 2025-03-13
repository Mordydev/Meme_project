import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface UserProfile {
  displayName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  interests: string[];
  notificationPreferences: {
    email: boolean;
    push: boolean;
  };
}

interface OnboardingState {
  isOnboarded: boolean;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
}

export interface AuthState {
  // Authentication
  userId: string | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  
  // Profile
  profile: UserProfile | null;
  isProfileComplete: boolean;
  
  // Onboarding
  onboarding: OnboardingState;
  
  // Actions
  setUserId: (userId: string | null) => void;
  setIsSignedIn: (isSignedIn: boolean) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setOnboardingStep: (step: number) => void;
  completeOnboardingStep: (stepId: string) => void;
  setIsOnboarded: (isOnboarded: boolean) => void;
  resetOnboarding: () => void;
}

const DEFAULT_ONBOARDING: OnboardingState = {
  isOnboarded: false,
  currentStep: 0,
  totalSteps: 4,
  completedSteps: [],
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        userId: null,
        isSignedIn: false,
        isLoaded: false,
        profile: null,
        isProfileComplete: false,
        onboarding: DEFAULT_ONBOARDING,
        
        // Actions
        setUserId: (userId) => set({ userId }),
        setIsSignedIn: (isSignedIn) => set({ isSignedIn }),
        setIsLoaded: (isLoaded) => set({ isLoaded }),
        setProfile: (profile) => set({ 
          profile,
          isProfileComplete: !!profile && !!profile.username && !!profile.displayName
        }),
        updateProfile: (updates) => set((state) => {
          if (!state.profile) return state;
          
          const updatedProfile = {
            ...state.profile,
            ...updates,
          };
          
          return {
            profile: updatedProfile,
            isProfileComplete: !!updatedProfile.username && !!updatedProfile.displayName
          };
        }),
        setOnboardingStep: (step) => set((state) => ({
          onboarding: {
            ...state.onboarding,
            currentStep: step,
          }
        })),
        completeOnboardingStep: (stepId) => set((state) => {
          const completedSteps = new Set(state.onboarding.completedSteps);
          completedSteps.add(stepId);
          
          return {
            onboarding: {
              ...state.onboarding,
              completedSteps: Array.from(completedSteps),
              currentStep: Math.min(state.onboarding.currentStep + 1, state.onboarding.totalSteps - 1),
            }
          };
        }),
        setIsOnboarded: (isOnboarded) => set((state) => ({
          onboarding: {
            ...state.onboarding,
            isOnboarded,
          }
        })),
        resetOnboarding: () => set({
          onboarding: DEFAULT_ONBOARDING
        }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          profile: state.profile,
          onboarding: state.onboarding,
        }),
      }
    )
  )
);
