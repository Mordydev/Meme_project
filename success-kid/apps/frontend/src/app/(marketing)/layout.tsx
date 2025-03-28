import { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { baseMetadata } from '@/app/meta';
import { generateOrganizationStructuredData } from '@/lib/structuredData';

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
    <div className="min-h-screen flex flex-col">
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
