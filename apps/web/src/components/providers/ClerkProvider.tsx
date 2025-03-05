'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <BaseClerkProvider
      appearance={{
        baseTheme: isDarkMode ? dark : undefined,
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          footerActionLink: 'text-primary hover:text-primary/90',
          card: 'bg-background border border-border shadow-lg',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'border border-border text-foreground',
          formFieldLabel: 'text-foreground',
          formFieldInput: 'bg-input border border-border text-foreground',
          dividerLine: 'bg-border',
          dividerText: 'text-muted-foreground',
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
} 