import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingFlow } from '../onboarding-flow';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useAuthentication } from '@/hooks/useAuthentication';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

// Mock our custom hooks
jest.mock('@/hooks/useAuthentication', () => ({
  useAuthentication: jest.fn(),
}));

// Mock framer-motion to avoid animation complexity in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => true,
}));

// Mock API service
jest.mock('@/lib/api/user-profile', () => ({
  saveUserProfile: jest.fn().mockResolvedValue({ data: { updated: true } }),
}));

describe('OnboardingFlow', () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };
  
  const mockUser = {
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
  };
  
  const mockAuth = {
    getToken: jest.fn().mockResolvedValue('mock-token'),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks default returns
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useUser as jest.Mock).mockReturnValue({ user: mockUser, isLoaded: true });
    (useAuthentication as jest.Mock).mockReturnValue(mockAuth);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });
  
  it('renders the welcome step initially', () => {
    render(<OnboardingFlow />);
    expect(screen.getByText(/welcome to wild 'n out/i)).toBeInTheDocument();
    expect(screen.getByText(/hey test, ready to get wild?/i)).toBeInTheDocument();
  });
  
  it('progresses through steps when clicking next buttons', async () => {
    render(<OnboardingFlow />);
    
    // Start at welcome step
    expect(screen.getByText(/welcome to wild 'n out/i)).toBeInTheDocument();
    
    // Proceed to profile setup
    fireEvent.click(screen.getByText(/let's go!/i));
    expect(screen.getByText(/set up your profile/i)).toBeInTheDocument();
    
    // Fill profile data and proceed
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.click(screen.getByText(/comedy/i)); // Select an interest
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Now at features highlight step
    expect(screen.getByText(/platform features/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Now at battle introduction
    expect(screen.getByText(/battle introduction/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Now at completion 
    expect(screen.getByText(/you're all set!/i)).toBeInTheDocument();
  });
  
  it('skips straight to the end when clicking skip', async () => {
    render(<OnboardingFlow />);
    
    // Click skip on the welcome screen
    fireEvent.click(screen.getByText(/skip intro/i));
    
    // Should save to localStorage
    expect(window.localStorage.setItem).toHaveBeenCalled();
    
    // Should redirect to battle page
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/battle');
    });
  });
  
  it('loads saved state from localStorage', () => {
    // Setup localStorage mock to return saved state
    const savedState = {
      currentStep: 2,
      userData: {
        displayName: 'Saved User',
        interests: ['Comedy'],
      },
    };
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(savedState)
    );
    
    render(<OnboardingFlow />);
    
    // Should start at features highlight step (step 2)
    expect(screen.getByText(/platform features/i)).toBeInTheDocument();
  });
  
  it('redirects if onboarding is already complete', () => {
    // Setup localStorage mock to return completed state
    const completedState = {
      onboardingComplete: true,
    };
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(completedState)
    );
    
    render(<OnboardingFlow />);
    
    // Should redirect to battle page
    expect(mockRouter.replace).toHaveBeenCalledWith('/battle');
  });
  
  it('handles validation errors in profile setup', async () => {
    render(<OnboardingFlow />);
    
    // Go to profile setup
    fireEvent.click(screen.getByText(/let's go!/i));
    
    // Try to submit without a display name
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Should show error message
    expect(screen.getByText(/please enter a display name/i)).toBeInTheDocument();
    
    // Enter a too-short name
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Ab' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Should show length error
    expect(screen.getByText(/must be at least 3 characters/i)).toBeInTheDocument();
  });
  
  it('saves profile data when completing the flow', async () => {
    const saveUserProfile = require('@/lib/api/user-profile').saveUserProfile;
    
    render(<OnboardingFlow />);
    
    // Go through all steps
    fireEvent.click(screen.getByText(/let's go!/i));
    
    // Fill profile data
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Skip through remaining steps
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    // Complete the flow
    fireEvent.click(screen.getByText(/enter wild 'n out/i));
    
    // Should save profile and redirect
    await waitFor(() => {
      expect(saveUserProfile).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/battle');
    });
  });
  
  it('handles API errors gracefully', async () => {
    // Mock API failure
    const saveUserProfile = require('@/lib/api/user-profile').saveUserProfile;
    saveUserProfile.mockRejectedValueOnce(new Error('API Error'));
    
    render(<OnboardingFlow />);
    
    // Skip to end
    fireEvent.click(screen.getByText(/skip intro/i));
    
    // Should attempt to save but not redirect on error
    await waitFor(() => {
      expect(saveUserProfile).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
