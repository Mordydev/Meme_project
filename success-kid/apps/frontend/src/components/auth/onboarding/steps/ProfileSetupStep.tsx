'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';

interface ProfileSetupStepProps {
  onComplete: (data: any) => void;
  isSubmitting: boolean;
}

export function ProfileSetupStep({ onComplete, isSubmitting }: ProfileSetupStepProps) {
  const { user } = useAuth();
  const { profile, updateProfile } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || user?.imageUrl || '');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  
  // Load initial data from user
  useEffect(() => {
    if (user) {
      if (!displayName && user.fullName) {
        setDisplayName(user.fullName);
      }
      
      if (!username && user.username) {
        setUsername(user.username);
      }
      
      if (!avatarUrl && user.imageUrl) {
        setAvatarUrl(user.imageUrl);
      }
    }
  }, [user, displayName, username, avatarUrl]);
  
  // Check username availability with debounce
  useEffect(() => {
    // Skip if username is empty or too short
    if (!username || username.length < 3) {
      setUsernameError('');
      setUsernameAvailable(false);
      return;
    }
    
    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setUsernameAvailable(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        setIsChecking(true);
        
        // Make API call to check username availability
        const response = await fetch(`/api/v1/users/check-username?username=${username}`);
        const data = await response.json();
        
        setUsernameAvailable(data.data.available);
        setUsernameError(data.data.available ? '' : 'Username is already taken');
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameError('');
      } finally {
        setIsChecking(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!displayName) {
      return;
    }
    
    if (!username || !usernameAvailable) {
      return;
    }
    
    // Update profile in store
    updateProfile({
      displayName,
      username,
      bio,
      avatarUrl
    });
    
    // Update Clerk user if needed
    try {
      if (user && user.username !== username) {
        await user.update({
          username
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
    
    // Complete the step
    onComplete({ displayName, username, bio, avatarUrl });
  };
  
  // Handle uploading a new avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // In a real implementation, this would upload to your storage service
      // For now, we'll create a temporary URL
      const imageUrl = URL.createObjectURL(file);
      setAvatarUrl(imageUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Create Your Profile</h2>
        <p className="text-gray-600">Tell us a bit about yourself so others can get to know you</p>
      </div>
      
      {/* Avatar upload */}
      <div className="flex flex-col items-center">
        <Avatar
          src={avatarUrl}
          alt={displayName || 'User'}
          size="xl"
          fallback={(displayName?.charAt(0) || 'U').toUpperCase()}
        />
        <label className="mt-3 cursor-pointer">
          <span className="text-primary hover:underline text-sm font-medium">Upload Photo</span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarUpload}
          />
        </label>
      </div>
      
      {/* Display name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
          Display Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
          required
          className="w-full"
        />
      </div>
      
      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a unique username"
            required
            className={`w-full pr-10 ${
              usernameError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : usernameAvailable && username.length >= 3
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                  : ''
            }`}
          />
          {isChecking && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
          {usernameAvailable && username.length >= 3 && !isChecking && (
            <div className="absolute right-3 top-3 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {usernameError && (
          <p className="mt-1 text-sm text-red-600">{usernameError}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Username can only contain letters, numbers, and underscores
        </p>
      </div>
      
      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Bio <span className="text-gray-400">(optional)</span>
        </label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us a bit about yourself"
          rows={3}
          className="w-full"
        />
        <p className="mt-1 text-xs text-gray-500">
          {bio ? `${bio.length}/160 characters` : '0/160 characters'}
        </p>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={
          isSubmitting ||
          !displayName ||
          !username ||
          username.length < 3 ||
          !!usernameError ||
          !usernameAvailable ||
          isChecking
        }
      >
        Save Profile
      </Button>
    </form>
  );
}
