'use client';

import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';
import NotificationCenter from '@/components/features/notifications/NotificationCenter';
import NotificationSettings from '@/components/features/notifications/NotificationSettings';

export function ModalProvider() {
  const activeModal = useUIStore(state => state.activeModal);
  const modalData = useUIStore(state => state.modalData);
  const closeModal = useUIStore(state => state.closeModal);
  
  const [mounted, setMounted] = useState(false);
  
  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  // Render the appropriate modal based on activeModal
  switch (activeModal) {
    case 'notification-center':
      return (
        <NotificationCenter
          isOpen={true}
          onClose={closeModal}
          initialFilter={modalData?.initialFilter as any}
        />
      );
      
    case 'notification-settings':
      return (
        <NotificationSettings
          isOpen={true}
          onClose={closeModal}
        />
      );
      
    default:
      return null;
  }
}

export default ModalProvider;
