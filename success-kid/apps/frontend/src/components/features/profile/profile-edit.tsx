'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UserResource } from '@clerk/types';
import { Button } from '@/components/ui';

// Types
interface ProfileEditFormProps {
  user: UserResource | null;
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
}

export interface ProfileFormData {
  displayName?: string;
  username?: string;
  bio?: string;
  imageUrl?: string;
  imageFile?: File;
}

interface FieldErrorMap {
  displayName?: string;
  username?: string;
  bio?: string;
  image?: string;
}

// Main ProfileEdit component
export function ProfileEdit({ user, onSave, onCancel }: ProfileEditFormProps) {
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : '',
    username: user?.username || '',
    bio: (user?.publicMetadata?.bio as string) || '',
    imageUrl: user?.imageUrl || ''
  });
  
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(user?.imageUrl || null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof FieldErrorMap]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Image upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size and type
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'File must be an image' }));
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Update form data
      setFormData(prev => ({ ...prev, imageFile: file }));
      
      // Clear error
      setErrors(prev => ({ ...prev, image: undefined }));
    }
  };
  
  // Trigger file input click
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: FieldErrorMap = {};
    
    if (!formData.displayName?.trim()) {
      newErrors.displayName = 'Display name is required';
    }
    
    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters and use only letters, numbers, and underscores';
    }
    
    if (formData.bio && formData.bio.length > 160) {
      newErrors.bio = 'Bio must be less than 160 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Cancel handler
  const handleCancel = () => {
    onCancel();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center">
        <div 
          className="relative h-32 w-32 rounded-full overflow-hidden bg-muted cursor-pointer border-4 border-primary/20 hover:opacity-90 transition-opacity"
          onClick={handleImageClick}
        >
          {previewImage ? (
            <Image
              src={previewImage}
              alt="Profile preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-bold">
              {formData.displayName?.[0] || formData.username?.[0] || '?'}
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium">Change Photo</span>
          </div>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />
        
        {errors.image && (
          <p className="text-red-500 text-sm mt-1">{errors.image}</p>
        )}
        
        <p className="text-muted-foreground text-sm mt-2">
          Click to upload a new profile image (max 5MB)
        </p>
      </div>
      
      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="displayName">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          className={`
            w-full px-3 py-2 border rounded-md bg-card
            focus:outline-none focus:ring-2 focus:ring-primary/50
            ${errors.displayName ? 'border-red-500' : 'border-input'}
          `}
        />
        {errors.displayName && (
          <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
        )}
      </div>
      
      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="username">
          Username
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`
              w-full pl-7 pr-3 py-2 border rounded-md bg-card
              focus:outline-none focus:ring-2 focus:ring-primary/50
              ${errors.username ? 'border-red-500' : 'border-input'}
            `}
          />
        </div>
        {errors.username && (
          <p className="text-red-500 text-sm mt-1">{errors.username}</p>
        )}
        <p className="text-muted-foreground text-sm mt-1">
          This will be your public username
        </p>
      </div>
      
      {/* Bio */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={3}
          className={`
            w-full px-3 py-2 border rounded-md bg-card
            focus:outline-none focus:ring-2 focus:ring-primary/50
            ${errors.bio ? 'border-red-500' : 'border-input'}
          `}
          maxLength={160}
        />
        {errors.bio ? (
          <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
        ) : (
          <p className="text-muted-foreground text-sm mt-1">
            {formData.bio?.length || 0}/160 characters
          </p>
        )}
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}
