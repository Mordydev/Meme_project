import { ClerkProvider } from '@/components/providers/ClerkProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navigation } from '@/components/layout/Navigation';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Success Kid Community Platform',
  description: 'A community platform for Success Kid token holders and enthusiasts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 