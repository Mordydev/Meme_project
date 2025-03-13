'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UserProfile } from '@/store/useUserStore';
import { Spinner } from '@/components/ui/Spinner';
import Image from 'next/image';

export interface ProfileEditProps {
  initialData: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

interface FormErrors {
  displayName?: string;
  username?: string;
  bio?: string;
}

/**
 * ProfileEdit - Form for editing user profile information
 * 
 * @component
 * @param initialData - Current profile data
 * @param onSave - Save handler for updated profile
 * @param onCancel - Cancel handler
 * @param className - Additional CSS classes
 */
export function ProfileEdit({
  initialData,
  onSave,
  onCancel,
  className
}: ProfileEditProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    displayName: initialData.displayName || '',
    username: initialData.username || '',
    bio: initialData.bio || '',
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar || null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.displayName?.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (formData.bio && formData.bio.length > 250) {
      newErrors.bio = 'Bio must be less than 250 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // In a real implementation, avatarFile would be uploaded to a storage service
      // and the URL would be added to formData
      
      // For now, we'll simulate the upload delay and pass the current avatar
      if (avatarFile) {
        await new Promise(resolve => setTimeout(resolve, 800));
        // In a real implementation:
        // const avatarUrl = await uploadAvatarFile(avatarFile);
        // formData.avatar = avatarUrl;
      }
      
      // Save profile data
      await onSave({
        ...formData,
        avatar: avatarPreview // In a real implementation, this would be the uploaded URL
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className={cn("max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar uploader */}
          <div className="flex flex-col items-center">
            <div 
              className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold cursor-pointer overflow-hidden relative"
              onClick={handleAvatarClick}
            >
              {avatarPreview ? (
                <Image 
                  src={avatarPreview} 
                  alt="Profile avatar preview"
                  fill
                  className="object-cover"
                />
              ) : (
                getInitials(formData.displayName || '')
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">Change</span>
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
            />
            
            <p className="text-sm text-muted-foreground mt-2">
              Click to upload a new profile image
            </p>
          </div>
          
          {/* Profile information fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                Display Name*
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleInputChange}
                className={cn(
                  "w-full px-3 py-2 border rounded-md",
                  errors.displayName ? "border-red-500" : "border-neutral-300"
                )}
                placeholder="Your display name"
              />
              {errors.displayName && (
                <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Username*
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className={cn(
                  "w-full px-3 py-2 border rounded-md",
                  errors.username ? "border-red-500" : "border-neutral-300"
                )}
                placeholder="username"
              />
              {errors.username ? (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              ) : (
                <p className="text-muted-foreground text-sm mt-1">
                  Only letters, numbers, and underscores. No spaces.
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                Bio <span className="text-muted-foreground">(Optional)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className={cn(
                  "w-full px-3 py-2 border rounded-md",
                  errors.bio ? "border-red-500" : "border-neutral-300"
                )}
                placeholder="Tell the community about yourself..."
              />
              <div className="flex justify-between mt-1">
                {errors.bio ? (
                  <p className="text-red-500 text-sm">{errors.bio}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Brief description for your profile.
                  </p>
                )}
                <p className="text-muted-foreground text-sm">
                  {(formData.bio?.length || 0)}/250
                </p>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper function to generate initials from display name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
