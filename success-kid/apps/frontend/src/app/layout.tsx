import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Montserrat, Inter, Roboto_Mono, Rubik } from 'next/font/google';
import { Metadata, Viewport } from 'next';

// Initialize fonts with subsets and display settings
const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false,
  weight: ['400', '500'],
});

const rubik = Rubik({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rubik',
  preload: false,
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Success Kid Platform',
    default: 'Success Kid Platform',
  },
  description: 'A vibrant ecosystem for crypto enthusiasts and meme lovers',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1E88E5', // Primary color
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${montserrat.variable} ${inter.variable} ${robotoMono.variable} ${rubik.variable}`}
    >
      <body className="min-h-screen bg-background flex flex-col">
        <Providers>
          <main className="flex-1">{children}</main>
        </Providers>
        
        {/* Script to handle redirect path persistence across page refreshes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Handle storage across page loads
              try {
                // Re-store redirect path after page refresh if needed
                const storedRedirectPath = sessionStorage.getItem('redirectAfterLogin');
                if (storedRedirectPath) {
                  console.log('Preserved redirect path after refresh:', storedRedirectPath);
                }
              } catch (e) {
                console.error('Storage access error:', e);
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
