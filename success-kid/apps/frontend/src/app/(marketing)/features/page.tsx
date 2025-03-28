'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  FeatureSection,
  PointsSystemFeature,
  CommunityFeature,
  WalletFeature
} from '@/components/marketing';

export default function FeaturesPage() {
  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Platform Features</h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover how the Success Kid platform combines community engagement with real token rewards to create a vibrant ecosystem.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">Join Community</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/tokenomics">Explore Tokenomics</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Points System Feature */}
      <FeatureSection
        category="Rewards System"
        title="Earn Success Points for Every Contribution"
        description="Our dual-token economy rewards community members for all forms of participation. Earn Success Points (SP) through creating content, engaging with others, and daily activities."
        imageSide="right"
        bgColor="bg-white"
        imageSrc={<PointsSystemFeature />}
        features={[
          "Create content, comment, and engage to earn points",
          "Convert points to SKC tokens at a 100:1 ratio",
          "Daily caps ensure fair distribution and healthy economics",
          "Track your earnings with real-time balance updates"
        ]}
        ctaText="Start Earning Points"
        ctaLink="/sign-up"
      />

      {/* Community Feature */}
      <FeatureSection
        category="Community"
        title="Join a Vibrant Community of Enthusiasts"
        description="Connect with thousands of Success Kid community members, participate in discussions, share knowledge, and build relationships with like-minded enthusiasts."
        imageSide="left"
        bgColor="bg-gray-50"
        imageSrc={<CommunityFeature />}
        features={[
          "Participate in weekly challenges and events",
          "Earn reputation and recognition through achievements",
          "Connect with community leaders and mentors",
          "Collaborate with members from around the world"
        ]}
        ctaText="Explore Community"
        ctaLink="/community"
      />

      {/* Wallet Feature */}
      <FeatureSection
        category="Wallet Integration"
        title="Seamless Wallet Connection in Seconds"
        description="Connect your crypto wallet to unlock the full potential of the platform. Track your tokens, enable redemptions, and access exclusive holder benefits with a simple setup process."
        imageSide="right"
        bgColor="bg-white"
        imageSrc={<WalletFeature />}
        features={[
          "Connect Phantom wallet in just 30 seconds",
          "View your token balance and transaction history",
          "Redeem Success Points for SKC tokens",
          "Access exclusive content and features for holders"
        ]}
        ctaText="Learn About Wallet Integration"
        ctaLink="/tokenomics"
      />

      {/* Call to Action */}
      <section className="bg-primary-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Experience Success Kid?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of community members already earning rewards and building connections.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">Create Your Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
