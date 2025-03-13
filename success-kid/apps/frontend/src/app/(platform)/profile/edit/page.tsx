'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { ProfileEdit, ProfileFormData } from '@/components/features/profile/profile-edit';
import { useProfileEdit } from '@/hooks/profile/use-profile-edit';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { updateProfile, isLoading } = useProfileEdit();
  
  // Handle cancel - return to profile page
  const handleCancel = () => {
    router.push('/profile');
  };
  
  // Handle save profile
  const handleSave = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      router.push('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error would be handled by the hook
    }
  };
  
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Edit Profile"
        description="Update your profile information"
      />
      
      <div className="max-w-2xl mx-auto bg-card rounded-lg border shadow-sm p-6">
        <ProfileEdit
          user={user}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
