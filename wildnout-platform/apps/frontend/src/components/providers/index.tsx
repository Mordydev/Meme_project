'use client'

import { ThemeProvider } from './theme-provider'
import { AuthProvider } from './auth-provider'
import { ToastProvider } from './toast-provider'
import { ResponsiveProvider } from '@/components/layout/ResponsiveContext'
import { PerformanceProvider } from './performance-provider'

export interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PerformanceProvider>
      <AuthProvider>
        <ThemeProvider>
          <ResponsiveProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ResponsiveProvider>
        </ThemeProvider>
      </AuthProvider>
    </PerformanceProvider>
  )
}
