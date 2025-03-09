'use client';

import { Toaster } from 'sonner';

export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f1f1f',
            color: '#ffffff',
            border: '1px solid #333333',
          },
          success: {
            style: {
              border: '1px solid #36E95C',
            },
          },
          error: {
            style: {
              border: '1px solid #E93636',
            },
          },
        }}
      />
      {children}
    </>
  );
}
