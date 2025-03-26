import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Metadata, Viewport } from 'next';
import { Inter, Montserrat, Roboto_Mono, Rubik } from 'next/font/google';

// Define fonts
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-accent',
  display: 'swap',
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
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${robotoMono.variable} ${rubik.variable}`}>
      <body className="min-h-screen bg-background font-body text-foreground">
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
