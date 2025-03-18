'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  RegistrationForm, 
  SocialProof, 
  SecondaryCTA 
} from '@/components/marketing';

export default function RegisterPage() {
  return (
    <div className="bg-gray-50">
      {/* Registration Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-10">
            {/* Left Column: Registration Form */}
            <div className="w-full max-w-md mx-auto md:mx-0 mb-12 md:mb-0">
              <RegistrationForm />
            </div>
            
            {/* Right Column: Benefits */}
            <div className="w-full md:flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Join the Success Kid Community</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Create your account today and start earning rewards for all your contributions. Connect, engage, and build value together with our vibrant community.
                </p>
                
                <div className="space-y-6">
                  {/* Feature 1 */}
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600">
                        🏆
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Earn Success Points</h3>
                      <p className="text-gray-600">Every contribution earns points that convert to real tokens.</p>
                    </div>
                  </div>
                  
                  {/* Feature 2 */}
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600">
                        👥
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Connect with Community</h3>
                      <p className="text-gray-600">Join 50,000+ members building a vibrant ecosystem.</p>
                    </div>
                  </div>
                  
                  {/* Feature 3 */}
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600">
                        🚀
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Unlock Your Potential</h3>
                      <p className="text-gray-600">Build your reputation, earn achievements, and gain recognition.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Proof Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <SocialProof />
        </div>
      </section>
      
      {/* Secondary CTAs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 space-y-6">
          <SecondaryCTA 
            title="Learn About Tokenomics" 
            description="Understand how our dual-token economy works, with 50% of tokens reserved for community rewards."
            icon="💰"
            ctaText="Explore Tokenomics"
            ctaLink="/tokenomics"
          />
          
          <SecondaryCTA 
            title="Connect Your Wallet" 
            description="Link your Phantom wallet to track tokens, enable redemptions, and access exclusive features."
            icon="🔗"
            ctaText="Wallet Guide"
            ctaLink="/features"
            variant="bordered"
          />
          
          <SecondaryCTA 
            title="Join Our Discord Community" 
            description="Connect with other members, get help, and stay updated on the latest news and events."
            icon="💬"
            ctaText="Join Discord"
            ctaLink="https://discord.gg/successkid"
            variant="dark"
          />
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-16 bg-primary-50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create your account today and start earning rewards while connecting with our community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#top">Create Account Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/features">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
