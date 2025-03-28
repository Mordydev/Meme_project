'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface EditProfileButtonProps {
  className?: string;
}

export function EditProfileButton({ className }: EditProfileButtonProps) {
  const router = useRouter();
  
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleEditProfile}
      className={className}
    >
      Edit Profile
    </Button>
  );
}
