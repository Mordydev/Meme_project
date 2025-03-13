'use client';

import React, { useState } from 'react';
import { useBlockUser } from '@/hooks/queries/useCommunity';

interface BlockUserControlProps {
  userId: string;
  username: string;
  onComplete?: () => void;
}

/**
 * Component for blocking a user
 */
export function BlockUserControl({ 
  userId, 
  username,
  onComplete 
}: BlockUserControlProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const { mutate: blockUser, isLoading } = useBlockUser();
  
  // Handle opening the confirmation modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    if (isLoading) return;
    setIsModalOpen(false);
    setIsConfirming(false);
  };
  
  // Handle block confirmation
  const handleConfirmBlock = () => {
    setIsConfirming(true);
  };
  
  // Handle block execution
  const handleBlockUser = () => {
    blockUser(userId, {
      onSuccess: () => {
        setIsBlocked(true);
        setTimeout(() => {
          setIsModalOpen(false);
          if (onComplete) onComplete();
        }, 2000);
      },
      onError: () => {
        setIsConfirming(false);
      }
    });
  };
  
  return (
    <>
      {/* Block user button/link */}
      <button 
        onClick={handleOpenModal}
        className="text-alert hover:text-alert/80"
      >
        Block User
      </button>
      
      {/* Confirmation modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">
                {isBlocked ? 'User Blocked' : 'Block User'}
              </h2>
              
              <button 
                type="button" 
                className="text-muted-foreground hover:text-foreground"
                onClick={handleCloseModal}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {isBlocked ? (
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-medium text-foreground mb-2">User Blocked Successfully</h3>
                  <p className="text-sm text-muted-foreground">
                    You will no longer see content from this user.
                  </p>
                </div>
              ) : isConfirming ? (
                <div className="space-y-4">
                  <p className="text-center text-alert font-medium">
                    Are you absolutely sure?
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    This will hide all content from <span className="font-medium">{username}</span> and prevent them from interacting with you on the platform.
                  </p>
                  
                  <div className="flex justify-center space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsConfirming(false)}
                      disabled={isLoading}
                      className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleBlockUser}
                      disabled={isLoading}
                      className="px-4 py-2 bg-alert text-white rounded-md disabled:opacity-50"
                    >
                      {isLoading ? 'Blocking...' : 'Yes, Block User'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>
                    You're about to block <span className="font-medium">{username}</span>.
                  </p>
                  
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>When you block someone:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You won't see their posts or comments</li>
                      <li>They won't be able to follow you or view your content</li>
                      <li>They won't be notified that you've blocked them</li>
                      <li>You can unblock them at any time from your settings</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleConfirmBlock}
                      className="px-4 py-2 bg-alert text-white rounded-md"
                    >
                      Block User
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BlockUserControl;
