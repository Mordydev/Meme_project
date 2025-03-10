import { Metadata } from 'next'
import { PublicTokenTracker } from '@/components/marketing/public-token-tracker'
import { RegistrationCTA } from '@/components/marketing/registration-cta'

export const metadata: Metadata = {
  title: '$WILDNOUT Token Tracker | Wild 'n Out Meme Coin',
  description: 'Track $WILDNOUT token price, market cap milestones, and transaction activity',
  openGraph: {
    title: '$WILDNOUT Token Tracker | Wild 'n Out Meme Coin',
    description: 'Track $WILDNOUT token price, market cap milestones, and transaction activity',
    type: 'website',
    locale: 'en_US',
    url: 'https://wildnout.io/token',
  },
}

export default function PublicTokenPage() {
  return (
    <div className="py-12 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display text-hype-white mb-4">
            $WILDNOUT Token Tracker
          </h1>
          <p className="text-zinc-300 text-lg mb-8">
            Community first. Entertainment always. Innovation constantly. Track all $WILDNOUT token activities here.
          </p>
          
          <PublicTokenTracker />
          
          <div className="mt-16">
            <RegistrationCTA
              title="Ready to Connect Your Wallet?"
              subtitle="Sign up for a full-featured token experience with wallet integration and holder benefits."
              buttonText="Get Started"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
