'use client';

import { Button } from '@/components/ui/button';
import { UserProfile } from '@/types/profile';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileEditorProps {
  profile: UserProfile;
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio || '',
    preferences: {
      notifications: profile.preferences?.notifications || true,
      privacy: profile.preferences?.privacy || 'public',
      theme: profile.preferences?.theme || 'default',
    },
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle preference changes
  const handlePreferenceChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const actualValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: actualValue,
      },
    }));
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update profile');
      }
      
      // Show success message
      setSuccessMessage('Profile updated successfully!');
      
      // Refresh the page data
      router.refresh();
      
      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors(prev => ({
        ...prev,
        form: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display text-hype-white mb-6">Edit Profile</h1>
      
      {errors.form && (
        <div className="bg-roast-red/10 border border-roast-red rounded-md p-4 mb-6 text-roast-red">
          {errors.form}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-victory-green/10 border border-victory-green rounded-md p-4 mb-6 text-victory-green">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image (future implementation) */}
        <div className="bg-zinc-800 rounded-lg p-6 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-zinc-700 relative overflow-hidden">
            {profile.imageUrl ? (
              <img
                src={profile.imageUrl}
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-flow-blue text-4xl text-hype-white font-bold">
                {profile.displayName.charAt(0)}
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-xs text-hype-white">
                Change
              </span>
            </div>
          </div>
        </div>
        
        {/* Basic Information */}
        <div className="bg-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-display text-hype-white mb-4">Basic Information</h2>
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-zinc-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-zinc-700 border ${
                errors.displayName ? 'border-roast-red' : 'border-zinc-600'
              } rounded-md text-hype-white focus:outline-none focus:ring-1 focus:ring-battle-yellow`}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-roast-red">{errors.displayName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-zinc-400">@</span>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full pl-8 pr-3 py-2 bg-zinc-700 border ${
                  errors.username ? 'border-roast-red' : 'border-zinc-600'
                } rounded-md text-hype-white focus:outline-none focus:ring-1 focus:ring-battle-yellow`}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-roast-red">{errors.username}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-zinc-300 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className={`w-full px-3 py-2 bg-zinc-700 border ${
                errors.bio ? 'border-roast-red' : 'border-zinc-600'
              } rounded-md text-hype-white focus:outline-none focus:ring-1 focus:ring-battle-yellow resize-none`}
              maxLength={500}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-zinc-400">
                {formData.bio.length}/500 characters
              </span>
            </div>
            {errors.bio && (
              <p className="mt-1 text-sm text-roast-red">{errors.bio}</p>
            )}
          </div>
        </div>
        
        {/* Preferences */}
        <div className="bg-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-display text-hype-white mb-4">Preferences</h2>
          
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                name="notifications"
                checked={formData.preferences.notifications}
                onChange={handlePreferenceChange}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-battle-yellow focus:ring-battle-yellow"
              />
              <label htmlFor="notifications" className="ml-2 block text-sm text-zinc-300">
                Enable notifications
              </label>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Receive notifications about battles, comments, and achievements
            </p>
          </div>
          
          <div>
            <label htmlFor="privacy" className="block text-sm font-medium text-zinc-300 mb-1">
              Profile Privacy
            </label>
            <select
              id="privacy"
              name="privacy"
              value={formData.preferences.privacy}
              onChange={handlePreferenceChange}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-hype-white focus:outline-none focus:ring-1 focus:ring-battle-yellow"
            >
              <option value="public">Public - Anyone can view</option>
              <option value="followers">Followers Only - Only followers can view</option>
              <option value="private">Private - Only you can view</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-zinc-300 mb-1">
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              value={formData.preferences.theme}
              onChange={handlePreferenceChange}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-hype-white focus:outline-none focus:ring-1 focus:ring-battle-yellow"
            >
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/profile')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
