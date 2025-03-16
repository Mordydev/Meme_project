/**
 * Onboarding Steps Definition
 * 
 * Defines onboarding steps and progression for new users
 */

/**
 * Onboarding step types
 */
export enum OnboardingStepType {
  PROFILE_CREATION = 'profile_creation',
  WALLET_CONNECTION = 'wallet_connection',
  INTERESTS_SELECTION = 'interests_selection',
  FIRST_POST = 'first_post',
  FIRST_COMMENT = 'first_comment',
  FOLLOW_USERS = 'follow_users',
  EMAIL_VERIFICATION = 'email_verification',
  WELCOME_ACHIEVEMENT = 'welcome_achievement',
  TOUR_COMPLETION = 'tour_completion',
  REFERRAL_CREATION = 'referral_creation'
}

/**
 * Onboarding step interface
 */
export interface OnboardingStep {
  type: OnboardingStepType;
  title: string;
  description: string;
  reward: number; // Success Points awarded for completion
  required: boolean; // Whether this step is required to complete onboarding
  uiRoute: string; // Frontend route for this step
  displayOrder: number; // Order in which steps should be displayed
}

/**
 * Onboarding flow interface
 */
export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
}

/**
 * Default onboarding steps
 */
export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    type: OnboardingStepType.PROFILE_CREATION,
    title: 'Create Your Profile',
    description: 'Set up your profile with a display name and avatar',
    reward: 50,
    required: true,
    uiRoute: '/onboarding/profile',
    displayOrder: 1
  },
  {
    type: OnboardingStepType.EMAIL_VERIFICATION,
    title: 'Verify Your Email',
    description: 'Verify your email address to secure your account',
    reward: 50,
    required: true,
    uiRoute: '/onboarding/verify-email',
    displayOrder: 2
  },
  {
    type: OnboardingStepType.INTERESTS_SELECTION,
    title: 'Select Your Interests',
    description: 'Tell us what you\'re interested in to personalize your experience',
    reward: 25,
    required: true,
    uiRoute: '/onboarding/interests',
    displayOrder: 3
  },
  {
    type: OnboardingStepType.WALLET_CONNECTION,
    title: 'Connect Your Wallet',
    description: 'Connect your wallet to access token features',
    reward: 100,
    required: false,
    uiRoute: '/onboarding/wallet',
    displayOrder: 4
  },
  {
    type: OnboardingStepType.FOLLOW_USERS,
    title: 'Follow Other Members',
    description: 'Follow at least 3 other community members',
    reward: 25,
    required: false,
    uiRoute: '/onboarding/follow',
    displayOrder: 5
  },
  {
    type: OnboardingStepType.FIRST_POST,
    title: 'Create Your First Post',
    description: 'Share something with the community',
    reward: 50,
    required: false,
    uiRoute: '/onboarding/first-post',
    displayOrder: 6
  },
  {
    type: OnboardingStepType.WELCOME_ACHIEVEMENT,
    title: 'Claim Welcome Achievement',
    description: 'Claim your welcome achievement badge',
    reward: 100,
    required: false,
    uiRoute: '/onboarding/welcome',
    displayOrder: 7
  }
];

/**
 * Standard onboarding flow
 */
export const STANDARD_ONBOARDING_FLOW: OnboardingFlow = {
  id: 'standard',
  name: 'Standard Onboarding',
  description: 'Standard onboarding flow for new users',
  steps: DEFAULT_ONBOARDING_STEPS
};

/**
 * Minimum required steps to consider onboarding complete
 */
export const REQUIRED_ONBOARDING_STEPS = DEFAULT_ONBOARDING_STEPS
  .filter(step => step.required)
  .map(step => step.type);

/**
 * Get step by type
 */
export function getStepByType(type: OnboardingStepType): OnboardingStep | undefined {
  return DEFAULT_ONBOARDING_STEPS.find(step => step.type === type);
}

/**
 * Get next step after a given step
 */
export function getNextStep(currentStepType: OnboardingStepType): OnboardingStep | undefined {
  const currentStep = getStepByType(currentStepType);
  if (!currentStep) return undefined;
  
  // Get steps sorted by display order
  const sortedSteps = [...DEFAULT_ONBOARDING_STEPS].sort((a, b) => a.displayOrder - b.displayOrder);
  
  // Find the index of the current step
  const currentIndex = sortedSteps.findIndex(step => step.type === currentStepType);
  
  // Return the next step if it exists
  return currentIndex < sortedSteps.length - 1 ? sortedSteps[currentIndex + 1] : undefined;
}

/**
 * Calculate total available points from onboarding
 */
export function getTotalOnboardingPoints(): number {
  return DEFAULT_ONBOARDING_STEPS.reduce((sum, step) => sum + step.reward, 0);
}

/**
 * Get points earned from completed steps
 */
export function getPointsFromCompletedSteps(completedSteps: OnboardingStepType[]): number {
  return DEFAULT_ONBOARDING_STEPS
    .filter(step => completedSteps.includes(step.type))
    .reduce((sum, step) => sum + step.reward, 0);
}
