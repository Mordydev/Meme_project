'use client';

import { UserProfile } from '@/store/auth/authStore';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ProfilePreviewStepProps {
  profile: UserProfile | null;
  onUpdate: (data: Partial<UserProfile>) => void;
  onPrevious: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

export function ProfilePreviewStep({ 
  profile, 
  onPrevious, 
  onComplete,
  isSubmitting
}: ProfilePreviewStepProps) {
  if (!profile) {
    return <div>No profile data available</div>;
  }
  
  // Find interest labels by ID
  const INTEREST_CATEGORIES = [
    { id: 'crypto', label: 'Cryptocurrency' },
    { id: 'defi', label: 'DeFi' },
    { id: 'nfts', label: 'NFTs' },
    { id: 'trading', label: 'Trading' },
    { id: 'blockchain', label: 'Blockchain Technology' },
    { id: 'memes', label: 'Memes & Culture' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'art', label: 'Digital Art' },
    { id: 'investing', label: 'Investing' },
    { id: 'community', label: 'Community Building' },
    { id: 'development', label: 'Software Development' },
    { id: 'education', label: 'Education' },
  ];
  
  const interestLabels = profile.interests
    .map(id => INTEREST_CATEGORIES.find(cat => cat.id === id)?.label)
    .filter(Boolean);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="mb-6 text-xl font-bold text-gray-800">Review Your Profile</h2>
        
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          {/* Profile Header */}
          <div className="bg-primary/10 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {profile.displayName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{profile.displayName}</h3>
                <p className="text-gray-600">@{profile.username}</p>
              </div>
            </div>
          </div>
          
          {/* Profile Details */}
          <div className="p-6">
            {profile.bio && (
              <div className="mb-6">
                <h4 className="mb-2 text-sm font-medium text-gray-500">Bio</h4>
                <p className="text-gray-800">{profile.bio}</p>
              </div>
            )}
            
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-medium text-gray-500">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {interestLabels.map((label) => (
                  <span 
                    key={label} 
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-medium text-gray-500">Notification Preferences</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center">
                  <span className={profile.notificationPreferences.email 
                    ? 'text-green-500' 
                    : 'text-red-500'
                  }>
                    {profile.notificationPreferences.email ? '✓' : '✗'}
                  </span>
                  <span className="ml-2">Email Notifications</span>
                </li>
                <li className="flex items-center">
                  <span className={profile.notificationPreferences.push 
                    ? 'text-green-500' 
                    : 'text-red-500'
                  }>
                    {profile.notificationPreferences.push ? '✓' : '✗'}
                  </span>
                  <span className="ml-2">Push Notifications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-sm text-gray-500">
          You can always update your profile information later from your profile settings.
        </p>
      </div>
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          onClick={onPrevious}
          variant="outline"
        >
          Back
        </Button>
        <Button 
          onClick={onComplete}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Profile...' : 'Complete Profile'}
        </Button>
      </div>
    </motion.div>
  );
}
