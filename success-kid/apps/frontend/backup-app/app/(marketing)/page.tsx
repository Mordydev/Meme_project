import { Metadata } from 'next';
import HeroSection from '@/components/marketing/HeroSection';
import BenefitsSection from '@/components/marketing/BenefitsSection';
import TokenomicsSection from '@/components/marketing/TokenomicsSection';
import HowItWorksSection from '@/components/marketing/HowItWorksSection';
import CtaSection from '@/components/marketing/CtaSection';

export const metadata: Metadata = {
  title: 'Success Kid Community Platform',
  description: 'Join the Success Kid community platform where crypto enthusiasts and meme lovers connect, engage, and create value together.',
  openGraph: {
    images: ['/images/og-image.jpg'],
  },
};

export default function MarketingPage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Benefits Section */}
      <BenefitsSection />
      
      {/* Tokenomics & Community Section */}
      <TokenomicsSection />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* Call to Action Section */}
      <CtaSection />
    </>
  );
}
