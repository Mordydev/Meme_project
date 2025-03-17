'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface OnboardingFormData {
  username: string;
  bio: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    username: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Partial<OnboardingFormData>>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const router = useRouter();
  const { isAuthenticated, isOnboarded, profile } = useAuth();
  const { toast } = useToast();
  
  // If already onboarded, redirect to dashboard
  useEffect(() => {
    if (isOnboarded) {
      const redirectPath = sessionStorage.getItem('authRedirectPath') || '/(platform)/dashboard';
      sessionStorage.removeItem('authRedirectPath');
      router.push(redirectPath);
    }
  }, [isOnboarded, router]);
  
  // Populate form with existing data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        username: profile.username || '',
        bio: profile.bio || '',
      }));
    }
  }, [profile]);
  
  // Check username availability
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (formData.username && formData.username.length >= 3) {
      setCheckingUsername(true);
      timeout = setTimeout(async () => {
        try {
          const response = await fetch(`/api/v1/users/check-username/${encodeURIComponent(formData.username)}`);
          const data = await response.json();
          setUsernameAvailable(data.data.available);
        } catch (error) {
          console.error('Error checking username:', error);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);
    } else {
      setUsernameAvailable(null);
    }
    
    return () => clearTimeout(timeout);
  }, [formData.username]);
  
  // Validate the current step
  const validateStep = () => {
    const newErrors: Partial<OnboardingFormData> = {};
    
    if (step === 1) {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!usernameAvailable) {
        newErrors.username = 'Username is already taken';
      }
    } else if (step === 2) {
      if (!formData.bio) {
        newErrors.bio = 'Bio is required';
      } else if (formData.bio.length < 10) {
        newErrors.bio = 'Bio must be at least 10 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };
  
  // Handle previous step
  const handlePreviousStep = () => {
    setStep(step - 1);
  };
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof OnboardingFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/users/me/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Failed to complete onboarding');
      }
      
      toast({
        title: 'Onboarding completed!',
        description: 'Your profile has been set up successfully.',
        variant: 'success',
      });
      
      // Redirect to dashboard or redirected path
      const redirectPath = sessionStorage.getItem('authRedirectPath') || '/(platform)/dashboard';
      sessionStorage.removeItem('authRedirectPath');
      router.push(redirectPath);
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Onboarding failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render step 1: Username
  const renderUsernameStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Username</h2>
        <p className="text-muted-foreground mt-2">
          This will be your unique identifier in the community
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <div className="relative">
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="e.g., crypto_kid"
            className={errors.username ? 'border-destructive' : ''}
            disabled={isLoading}
          />
          {checkingUsername && (
            <div className="absolute right-3 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {usernameAvailable === true && !checkingUsername && (
            <div className="absolute right-3 top-3 text-xs text-success">
              Available!
            </div>
          )}
        </div>
        {errors.username && (
          <p className="text-destructive text-sm">{errors.username}</p>
        )}
      </div>
      
      <Button
        onClick={handleNextStep}
        className="w-full"
        disabled={isLoading || checkingUsername || !usernameAvailable}
      >
        Next
      </Button>
    </div>
  );
  
  // Render step 2: Bio
  const renderBioStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Tell Us About Yourself</h2>
        <p className="text-muted-foreground mt-2">
          Share a bit about yourself with the community
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <Textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell us about your interests, crypto experience, etc."
          rows={5}
          className={errors.bio ? 'border-destructive' : ''}
          disabled={isLoading}
        />
        {errors.bio && (
          <p className="text-destructive text-sm">{errors.bio}</p>
        )}
      </div>
      
      <div className="flex justify-between space-x-4">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting Up...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>
    </div>
  );
  
  // Render progress indicator
  const renderProgress = () => (
    <div className="mb-8">
      <div className="relative flex justify-between">
        {[1, 2].map((stepNumber) => (
          <div
            key={stepNumber}
            className={`h-10 w-10 rounded-full flex items-center justify-center border-2 bg-background z-10 ${
              stepNumber <= step
                ? 'border-primary text-primary'
                : 'border-muted-foreground text-muted-foreground'
            }`}
          >
            {stepNumber}
          </div>
        ))}
        <div
          className="absolute top-5 left-0 h-0.5 bg-muted-foreground -z-10"
          style={{ width: '100%' }}
        />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary -z-10 transition-all duration-300"
          style={{ width: `${(step - 1) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <div className="text-xs">Choose Username</div>
        <div className="text-xs">Your Bio</div>
      </div>
    </div>
  );
  
  return (
    <div className="flex min-h-screen bg-muted/50">
      <div className="m-auto w-full max-w-md rounded-lg border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Set up your account to join the Success Kid community
          </p>
        </div>
        
        {renderProgress()}
        
        <form onSubmit={handleSubmit}>
          {step === 1 && renderUsernameStep()}
          {step === 2 && renderBioStep()}
        </form>
      </div>
    </div>
  );
}
