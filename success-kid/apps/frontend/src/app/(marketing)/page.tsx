'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { 
  SuccessKidLogo, 
  HeroBackground, 
  PointsSystemDemo,
  StaggeredTitle,
  AnimatedPointsBadge,
  SEO
} from '@/components/marketing';

export default function HomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotionPreference();
  const [showPointsBadges, setShowPointsBadges] = useState(false);
  
  // Redirect to dashboard if signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);
  
  // Show points badges after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPointsBadges(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Success Kid Community Platform",
    "url": "https://successkid.io",
    "description": "A vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and create value together.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://successkid.io/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="bg-gray-50">
      <SEO structuredData={JSON.stringify(structuredData)} />
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        {/* Dynamic Background */}
        <HeroBackground className="z-0" />
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column: Content */}
            <div className="flex flex-col justify-center">
              {/* Animated Points Badges - float in from the top */}
              <div className="mb-6 space-y-2">
                <AnimatePresence>
                  {showPointsBadges && (
                    <>
                      <AnimatedPointsBadge 
                        label="Content Creation" 
                        points={50} 
                        icon="📝" 
                        className="mr-2"
                        delay={0} 
                      />
                      <AnimatedPointsBadge 
                        label="Community Engagement" 
                        points={15} 
                        icon="👥" 
                        delay={0.2}
                      />
                      <AnimatedPointsBadge 
                        label="Token Rewards" 
                        points={100} 
                        icon="💰" 
                        delay={0.4}
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Staggered Title Animation */}
              <div className="mb-8">
                <StaggeredTitle
                  text="Turn Community Engagement Into"
                  highlightedText="Real Crypto Rewards"
                  className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl"
                  delay={0.2}
                />
              </div>
              
              {/* Subheading with Animation */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mb-8 text-lg text-gray-600 max-w-lg"
              >
                Join a vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and create value together. Earn Success Points for every contribution and redeem them for SKC tokens.
              </motion.p>
              
              {/* CTA Buttons with Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
              >
                <Link href="/sign-up">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto group relative overflow-hidden"
                  >
                    {/* Subtle glow effect on hover */}
                    <span className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
                    <span className="relative">Join Community</span>
                  </Button>
                </Link>
                <Link href="/tokenomics">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Explore Tokenomics
                  </Button>
                </Link>
              </motion.div>
              
              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="mt-8 flex items-center text-sm text-gray-500"
              >
                <div className="flex -space-x-2 mr-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border border-white flex items-center justify-center text-xs">
                      👤
                    </div>
                  ))}
                </div>
                <span><strong className="text-primary">3,500+</strong> community members already earning rewards</span>
              </motion.div>
            </div>
            
            {/* Right Column: Visual Elements */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                {/* Animated Logo */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="mb-6"
                >
                  <SuccessKidLogo size={200} />
                </motion.div>
                
                {/* Interactive Demo Component */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="w-full max-w-md"
                >
                  <PointsSystemDemo className="z-10" />
                </motion.div>
                
                {/* Decorative elements */}
                {!prefersReducedMotion && (
                  <>
                    <motion.div
                      animate={{ 
                        y: [0, -15, 0],
                        rotate: [0, 5, 0, -3, 0],
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                      className="absolute -top-10 -right-10 text-4xl"
                    >
                      🚀
                    </motion.div>
                    <motion.div
                      animate={{ 
                        y: [0, 10, 0],
                        x: [0, 5, 0, -5, 0],
                      }}
                      transition={{ 
                        duration: 10, 
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: 1
                      }}
                      className="absolute -bottom-5 -left-5 text-4xl"
                    >
                      💰
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-primary">Platform Benefits</h2>
            <h3 className="mb-12 text-center text-3xl font-bold text-gray-900">How Success Kid Works</h3>
          </motion.div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl text-primary">
                🏆
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Success Points</h3>
              <p className="text-gray-600 mb-4">
                Earn points for every contribution you make - create content, comment on posts, receive upvotes, and more.
              </p>
              <p className="text-sm text-primary font-medium">
                100 SP = 1 SKC Token
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl text-primary">
                👥
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Vibrant Community</h3>
              <p className="text-gray-600 mb-4">
                Connect with fellow members, share ideas, build relationships, and collaborate on creating value together.
              </p>
              <p className="text-sm text-primary font-medium">
                50,000+ active members and growing
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl text-primary">
                💰
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Wallet Integration</h3>
              <p className="text-gray-600 mb-4">
                Connect your wallet to track your tokens, enable redemptions, and access exclusive holder features.
              </p>
              <p className="text-sm text-primary font-medium">
                Simple setup in under 30 seconds
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6 text-3xl font-bold text-gray-900">
              Ready to join the Success Kid community?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Create your account, set up your profile, and start earning rewards today.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md"></span>
                <span className="relative">Get Started Now</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
