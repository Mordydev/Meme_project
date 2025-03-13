'use client';

import { useState } from 'react';
import { User } from '@clerk/nextjs/dist/types/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProfileSetupStepProps {
  data: {
    displayName?: string;
    username?: string;
    bio?: string;
  };
  onComplete: (data: any) => void;
  user: User | null;
}

export default function ProfileSetupStep({ data, onComplete, user }: ProfileSetupStepProps) {
  const [formData, setFormData] = useState({
    displayName: data.displayName || user?.fullName || '',
    username: data.username || '',
    bio: data.bio || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
    }
    
    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = 'Bio must be 160 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check username availability (mock implementation)
    setIsCheckingUsername(true);
    
    try {
      // In a real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock username check (always available in this example)
      const isAvailable = true;
      
      if (!isAvailable) {
        setErrors(prev => ({
          ...prev,
          username: 'This username is already taken'
        }));
        return;
      }
      
      // Username is available, proceed
      onComplete(formData);
    } catch (error) {
      console.error('Error checking username:', error);
      setErrors(prev => ({
        ...prev,
        username: 'Error checking username availability'
      }));
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Create Your Profile</h2>
      <p className="mb-6 text-gray-600">Tell us about yourself so the community can get to know you</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="displayName" className="mb-2 block font-medium">
            Display Name
          </label>
          <Input
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="How you'll appear to others"
            className={errors.displayName ? 'border-red-500' : ''}
          />
          {errors.displayName && (
            <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="username" className="mb-2 block font-medium">
            Username
          </label>
          <Input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Your unique username"
            className={errors.username ? 'border-red-500' : ''}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Letters, numbers, and underscores only. 3-20 characters.
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="bio" className="mb-2 block font-medium">
            Bio (Optional)
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us a bit about yourself"
            className={`w-full rounded-md border ${
              errors.bio ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20`}
            rows={4}
          ></textarea>
          <div className="mt-1 flex justify-between">
            {errors.bio ? (
              <p className="text-sm text-red-500">{errors.bio}</p>
            ) : (
              <p className="text-sm text-gray-500">
                Brief introduction. Maximum 160 characters.
              </p>
            )}
            <p className="text-sm text-gray-500">
              {formData.bio?.length || 0}/160
            </p>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isCheckingUsername}
        >
          {isCheckingUsername ? 'Checking Username...' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}

// Static method to handle next button click from parent
ProfileSetupStep.handleNext = (data: any) => {
  // This will be called when the parent's "Continue" button is clicked
  // We would validate and return true/false to indicate if we can proceed
  return Object.keys(data).length > 0;
};
