import { Metadata } from 'next';
import { Montserrat, Inter, Roboto_Mono } from 'next/font/google';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { baseMetadata } from '@/app/meta';
import { generateOrganizationStructuredData } from '@/lib/structuredData';

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
  preload: false, // Load only when needed
  weight: ['400', '500'],
});

// Export metadata for marketing pages
export const metadata: Metadata = {
  ...baseMetadata,
  // Additional marketing-specific metadata could be added here
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${montserrat.variable} ${inter.variable} ${robotoMono.variable} min-h-screen flex flex-col`}>
      <MarketingHeader />
      
      <main className="flex-1">{children}</main>
      
      <MarketingFooter />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateOrganizationStructuredData(),
        }}
      />
    </div>
  );
}
