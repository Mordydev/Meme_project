'use client';

import React, { useState } from 'react';
import { useBlockUser } from '@/hooks/queries/useCommunity';

interface BlockUserControlProps {
  userId: string;
  username: string;
  onSuccess?: () => void;
}

/**
 * Component for blocking users
 */
export function BlockUserControl({ userId, username, onSuccess }: BlockUserControlProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const { mutate: blockUser, isLoading } = useBlockUser();
  
  // Handle blocking the user
  const handleBlockUser = () => {
    blockUser(userId, {
      onSuccess: () => {
        setIsBlocked(true);
        
        // Close dialog after showing success message
        setTimeout(() => {
          setIsDialogOpen(false);
          if (onSuccess) onSuccess();
        }, 2000);
      }
    });
  };
  
  return (
    <>
      {/* Block user button */}
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="text-muted-foreground hover:text-alert flex items-center text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        Block User
      </button>
      
      {/* Confirmation dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            {isBlocked ? (
              // Success state
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w