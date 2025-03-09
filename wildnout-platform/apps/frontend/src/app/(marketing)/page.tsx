import { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/hero-section'
import { FeatureShowcase } from '@/components/marketing/feature-showcase'
import { TokenMetricsPreview } from '@/components/marketing/token-metrics-preview'
import { BattlePreview } from '@/components/marketing/battle-preview'
import { CreatorSpotlight } from '@/components/marketing/creator-spotlight'
import { RegistrationCTA } from '@/components/marketing/registration-cta'

export const metadata: Metadata = {
  title: 'Wild 'n Out Meme Coin - The Battles You Love, The Community You Belong To',
  description: 'Entertainment + Crypto + Community = Something you've never seen before. Join the Wild 'n Out meme coin platform today!',
  openGraph: {
    title: 'Wild 'n Out Meme Coin - The Battles You Love, The Community You Belong To',
    description: 'Entertainment + Crypto + Community = Something you've never seen before. Join the Wild 'n Out meme coin platform today!',
    type: 'website',
    locale: 'en_US',
    url: 'https://wildnout.io',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wild 'n Out Meme Coin - Official Platform',
    description: 'Entertainment + Crypto + Community = Something you've never seen before. Join the Wild 'n Out meme coin platform today!',
  },
}

export default function LandingPage() {
  return (
    <>
      <HeroSection showTokenMetrics={true} />
      <FeatureShowcase />
      <TokenMetricsPreview />
      <BattlePreview />
      <CreatorSpotlight />
      <RegistrationCTA />
    </>
  )
}
