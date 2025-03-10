import { Metadata } from 'next'
import { FeatureSection } from '@/components/marketing/feature-section'
import { RegistrationCTA } from '@/components/marketing/registration-cta'

export const metadata: Metadata = {
  title: 'Platform Features | Wild 'n Out Meme Coin',
  description: 'Explore the key features of the Wild 'n Out Meme Coin platform - Battle Arena, Community Zone, Creator Studio, and Token Hub',
}

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-zinc-900 to-wild-black">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-display text-battle-yellow mb-6">
            Platform Features
          </h1>
          <p className="text-xl text-hype-white mb-8 max-w-3xl mx-auto">
            Built by the community for the community. Discover how Wild 'n Out Meme Coin brings the energy of the show to the digital world.
          </p>
        </div>
      </section>
      
      {/* Feature Sections */}
      <FeatureSection
        title="Battle Arena"
        description="Compete in Wild 'n Out inspired battles, showcase your skills, and earn recognition from the community. Our battle system brings the show's competitive energy to the digital world."
        image=""
        orientation="left"
        features={[
          "Wild Style Battles - Freestyle content creation challenges",
          "Pick Up & Kill It - Take prompts and make them your own",
          "R&Beef - Create humorous roasts and comebacks",
          "Tournament System - Compete for higher stakes and rewards",
          "Community Voting - Get real feedback from other users"
        ]}
      />
      
      <FeatureSection
        title="Community Zone"
        description="Connect with fellow fans and creators, share content, and engage in discussions. Our community features create a vibrant social experience centered around creativity and entertainment."
        image=""
        orientation="right"
        features={[
          "Content Feed - Discover the best content from creators",
          "Discussion Forums - Engage in conversations about battles and topics",
          "Creator Spotlights - Featured content from top community members",
          "Direct Messaging - Connect with other users privately",
          "Comment & Reaction System - Provide feedback and support"
        ]}
      />
      
      <FeatureSection
        title="Creator Studio"
        description="Express yourself with powerful yet intuitive creation tools. Whether you're making memes, writing freestyle bars, or crafting comebacks, our Creator Studio gives you everything you need."
        image=""
        orientation="left"
        features={[
          "Multi-format Creation - Text, image, audio, and mixed content",
          "Template Library - Starting points for quick creation",
          "Draft Management - Save works in progress",
          "Publishing Options - Share to battles, community, or profile",
          "Performance Analytics - Track how your content performs"
        ]}
      />
      
      <FeatureSection
        title="Token Hub & Wallet"
        description="Connect your wallet, track token performance, and access holder benefits. Our token integration provides real utility and value beyond simple speculation."
        image=""
        orientation="right"
        features={[
          "Secure Wallet Connection - Safe and simple integration",
          "Token Performance Tracking - Real-time price and market data",
          "Milestone Visualization - Track progress toward platform goals",
          "Holder Benefits - Exclusive features based on holdings",
          "Transaction History - Monitor your token activity"
        ]}
      />
      
      <FeatureSection
        title="Profile & Achievement System"
        description="Build your reputation, showcase your achievements, and track your progress. Our profile system celebrates your contributions and accomplishments."
        image=""
        orientation="left"
        features={[
          "Customizable Profiles - Express your identity",
          "Achievement Badges - Earn recognition for activities",
          "Content Showcase - Display your best creations",
          "Level Progression - Gain status as you contribute",
          "Battle Statistics - Track your competitive performance"
        ]}
      />
      
      {/* CTA */}
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <RegistrationCTA />
        </div>
      </div>
    </div>
  )
}
