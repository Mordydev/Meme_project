'use client';

import { useState } from 'react';
import { UserProfile } from '@/store/auth/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

interface BasicInfoStepProps {
  profile: UserProfile | null;
  onUpdate: (data: Partial<UserProfile>) => void;
  onNext: () => void;
}

export function BasicInfoStep({ profile, onUpdate, onNext }: BasicInfoStepProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    const newErrors: Record<string, string> = {};
    
    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (bio && bio.length > 160) {
      newErrors.bio = 'Bio must be less than 160 characters';
    }
    
    // If there are errors, don't proceed
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Update profile data
    onUpdate({
      displayName,
      username,
      bio: bio || undefined
    });
    
    // Move to next step
    onNext();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="displayName" className="mb-2 block font-medium text-gray-700">
            Display Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name as shown to others"
            className={errors.displayName ? 'border-red-500' : ''}
          />
          {errors.displayName && (
            <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="username" className="mb-2 block font-medium text-gray-700">
            Username <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
              @
            </span>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className={`pl-8 ${errors.username ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This will be your unique identifier on the platform
          </p>
        </div>
        
        <div className="mb-8">
          <label htmlFor="bio" className="mb-2 block font-medium text-gray-700">
            Bio <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the community a bit about yourself..."
            className={`w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
              errors.bio ? 'border-red-500' : ''
            }`}
            rows={3}
          />
          <div className="mt-1 flex justify-between">
            <p className={`text-sm ${bio.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
              {bio.length}/160 characters
            </p>
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit">
            Continue
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
