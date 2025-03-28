import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Montserrat } from 'next/font/google';
// import { Analytics } from '@/components/layout/Analytics'; // Removed - Component doesn't exist yet
import { Toast } from '@/components/ui/toast'; // Corrected component name to Toast
// import { ThemeProvider } from '@/components/providers/ThemeProvider'; // Removed - Component doesn't exist yet
import '@/styles/globals.css'; // Assuming path

// Font definitions
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap'
});

// Metadata (can be further customized)
export const metadata = {
  title: {
    default: 'Success Kid Community Platform',
    template: '%s | Success Kid Community'
  },
  description: 'A vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and create value together.',
  keywords: ['success kid', 'crypto', 'community', 'meme coin', 'web3', 'engagement', 'rewards'],
  authors: [{ name: 'Success Kid Team', url: 'https://successkid.io' }], // Add URL if available
  creator: 'Success Kid Team',
  // Add Open Graph and Twitter metadata for better sharing previews
  openGraph: {
    title: 'Success Kid Community Platform',
    description: 'Where memes meet crypto value.',
    // url: 'https://successkid.io', // Add actual URL
    siteName: 'Success Kid Community',
    // images: [ { url: 'og-image.jpg', width: 1200, height: 630 } ], // Add OG image
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Success Kid Community Platform',
    description: 'Join the community where engagement earns real crypto rewards!',
    // siteId: 'YourTwitterSiteID', // Add Twitter ID if available
    // creator: '@YourTwitterHandle', // Add Twitter handle
    // images: ['twitter-image.jpg'], // Add Twitter image
  },
  // Add icons and manifest for PWA capabilities
  icons: {
    icon: '/favicon.ico', // Example path
    shortcut: '/favicon-16x16.png', // Example path
    apple: '/apple-touch-icon.png', // Example path
  },
  manifest: '/manifest.json' // Example path
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      {/* Added suppressHydrationWarning for theme provider compatibility */}
      <html lang="en" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans antialiased">
          {/* ThemeProvider would wrap children if it existed */}
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > */}
            {/* Main content */}
            {children}

            {/* Global components */}
            {/* <Analytics /> */}
            {/* Toast rendering is likely handled elsewhere via useUIStore */}
            {/* <Toast /> */}
          {/* </ThemeProvider> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
