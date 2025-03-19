'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, ClientMotion, AnimateOnMount, GlowingEffect, ParticleEffect, GradientBorder } from '@/components/ui';
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
              
              {/* Typewriter Title Animation */}
              <div className="mb-8">
                <StaggeredTitle
                  text="Clench Your Fist,"
                  highlightedText="Claim Your Success!"
                  className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl"
                  delay={0.2}
                  useTypewriter={true}
                />
              </div>
              
              {/* Subheading with Animation */}
              <ClientMotion
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mb-8 text-lg text-gray-600 max-w-lg"
                type="p"
              >
                Join 5,000+ members in the Success Kid community. Create content, engage with others, and turn your community contributions into real tokens—no technical knowledge required.
              </ClientMotion>
              
              {/* CTA Buttons with Animation */}
              <ClientMotion
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
              >
                {/* Primary Button with GlowingEffect */}
                <div className="w-full sm:w-auto">
                  <GlowingEffect 
                    color="primary" 
                    size="lg" 
                    intensity="medium" 
                    pulseEffect={true}
                  >
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto group relative overflow-hidden"
                      as={Link}
                      href="/sign-up"
                    >
                      {/* Subtle glow effect on hover */}
                      <span className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
                      <span className="relative flex items-center">
                        <span>Start Earning Now</span>
                        <ParticleEffect 
                          count={10} 
                          color="white" 
                          size={4} 
                          spread={30} 
                          duration={1.5} 
                          trigger="hover" 
                          className="ml-2"
                        />
                      </span>
                    </Button>
                  </GlowingEffect>
                </div>
                
                {/* Secondary Button with Gradient Border */}
                <GradientBorder 
                  animate={true} 
                  borderWidth={1} 
                  gradientFrom="from-secondary" 
                  gradientTo="to-primary-300" 
                  borderRadius="rounded-md"
                  className="w-full sm:w-auto"
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto group border-0"
                    as={Link}
                    href="/tokenomics"
                  >
                    <span>See How It Works</span>
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </GradientBorder>
              </ClientMotion>
              
              {/* Social Proof with Enhanced Hover Effects */}
              <ClientMotion
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="mt-8 flex items-center text-sm text-gray-500"
              >
                <div className="flex -space-x-2 mr-2">
                  {[1, 2, 3, 4].map(i => (
                    <AnimateOnMount key={i}>
                      <ClientMotion 
                        className="w-8 h-8 rounded-full bg-primary/10 border border-white flex items-center justify-center text-xs relative"
                        whileHover={{ 
                          scale: 1.2, 
                          zIndex: 10,
                          boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.3)'
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        👤
                        <ClientMotion
                          className="absolute -inset-1 bg-primary/5 rounded-full z-[-1]"
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-full h-full" />
                        </ClientMotion>
                      </ClientMotion>
                    </AnimateOnMount>
                  ))}
                </div>
                <div className="flex flex-col">
                  <span>
                    <ClientMotion 
                      className="text-primary font-bold"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      type="span"
                    >
                      5,000+
                    </ClientMotion> community members
                  </span>
                  <span className="text-xs text-gray-400">already earning rewards daily</span>
                </div>
              </ClientMotion>
            </div>
            
            {/* Right Column: Visual Elements */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                {/* Animated Logo with Enhanced Effects */}
                <AnimateOnMount>
                  <ClientMotion
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="mb-6 relative"
                    whileHover={{
                      scale: 1.05,
                      rotate: [0, -3, 3, -2, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    <ClientMotion
                      className="absolute inset-0 bg-gradient-to-r from-primary-300/40 to-secondary-300/40 rounded-full blur-xl"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.7, 0.5]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                    >
                      <div className="w-full h-full" />
                    </ClientMotion>
                    <div className="relative">
                      <SuccessKidLogo size={200} />
                      
                      {/* Sparkle effects */}
                      <ClientMotion
                        className="absolute top-0 right-0 h-4 w-4 rounded-full bg-white shadow-lg shadow-primary/20"
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 1,
                          repeatDelay: 3
                        }}
                      >
                        <div className="w-full h-full" />
                      </ClientMotion>
                      <ClientMotion
                        className="absolute bottom-1/4 left-0 h-3 w-3 rounded-full bg-white shadow-lg shadow-secondary/20"
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 2.5,
                          repeatDelay: 4
                        }}
                      >
                        <div className="w-full h-full" />
                      </ClientMotion>
                    </div>
                  </ClientMotion>
                </AnimateOnMount>
                
                {/* Interactive Demo Component */}
                <AnimateOnMount>
                  <ClientMotion
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="w-full max-w-md"
                  >
                    <PointsSystemDemo className="z-10" />
                  </ClientMotion>
                </AnimateOnMount>
                
                {/* Decorative elements */}
                <AnimateOnMount>
                  {!prefersReducedMotion && (
                    <>
                      <ClientMotion 
                        type="span"
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
                      </ClientMotion>
                      <ClientMotion 
                        type="span"
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
                      </ClientMotion>
                    </>
                  )}
                </AnimateOnMount>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Simple Process</h2>
            <h3 className="mt-2 text-3xl font-bold text-gray-900">How Success Kid Works</h3>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Earn, convert, and grow with our simple three-step process
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connected steps with progress line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-primary/20 z-0"></div>
            
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-10"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md h-full">
                <div className="flex items-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-white font-bold">
                    1
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">Participate & Earn</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Create content, comment on posts, and engage with the community to earn Success Points (SP).
                </p>
                <div className="text-center mt-4">
                  <span className="text-4xl">🏆</span>
                </div>
              </div>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative z-10"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md h-full">
                <div className="flex items-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-white font-bold">
                    2
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">Convert to Tokens</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Redeem your Success Points for SKC tokens at a rate of 100 SP = 1 SKC.
                </p>
                <div className="text-center mt-4">
                  <span className="text-4xl">💱</span>
                </div>
              </div>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative z-10"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md h-full">
                <div className="flex items-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-white font-bold">
                    3
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">Grow Your Holdings</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Hold tokens as they grow in value with our expanding community.
                </p>
                <div className="text-center mt-4">
                  <span className="text-4xl">📈</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Persona Sections */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Crypto Enthusiast (Charlie) Section */}
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">For Crypto Enthusiasts</h2>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">Early Access to a Token with Real Utility</h3>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h4 className="text-2xl font-bold text-gray-900 mb-4">70% Locked, 50% Reserved for YOU</h4>
                <p className="text-lg text-gray-600 mb-6">
                  Join a meme coin movement that puts the community first with transparent and fair token distribution.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-primary flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Complete transparency with verifiable smart contracts</span>
                  </li>
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-primary flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Real utility through community engagement rewards</span>
                  </li>
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-primary flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Clear market cap milestones with community celebrations</span>
                  </li>
                </ul>
                
                <div className="mt-8">
                  <Link href="/sign-up?persona=crypto">
                    <Button size="lg">
                      Connect Your Wallet
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-100 to-primary-50 rounded-bl-full z-0 opacity-50"></div>
                <h4 className="text-xl font-bold mb-6 relative z-10">Token Distribution</h4>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between">
                    <span className="font-medium">Community Rewards</span>
                    <span className="font-bold text-primary">50%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div className="bg-primary h-4 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="font-medium">Development</span>
                    <span className="font-bold text-primary">20%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div className="bg-primary h-4 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="font-medium">Public Sale</span>
                    <span className="font-bold text-primary">30%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div className="bg-primary h-4 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg relative z-10">
                  <h5 className="font-semibold mb-2">Market Cap Milestones</h5>
                  <div className="flex items-center">
                    <div className="h-8 flex-grow bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary-600 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <span className="ml-4 font-semibold">$400K / $1M</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Content Creator (Mia) Section */}
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">For Content Creators</h2>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">Turn Your Creative Skills Into Crypto Rewards</h3>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="order-2 lg:order-1 bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-xl">
                    👩
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Mia's Creator Journey</h4>
                    <p className="text-sm text-gray-500">Content Creator, 3 months on platform</p>
                  </div>
                </div>
                
                <blockquote className="text-gray-600 italic mb-6">
                  "I've earned over 20,000 Success Points from my content in just three months. The community engagement is incredible, and converting points to tokens has added a new revenue stream to my creative work."
                </blockquote>
                
                <div className="border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <span className="text-gray-500">Content Created:</span>
                      <span className="ml-2 font-medium">47 posts</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tokens Earned:</span>
                      <span className="ml-2 font-medium">200+ SKC</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="order-1 lg:order-2"
              >
                <h4 className="text-2xl font-bold text-gray-900 mb-4">Get Rewarded for Your Creativity</h4>
                <p className="text-lg text-gray-600 mb-6">
                  As a content creator, you're always looking for ways to monetize your creativity. Success Kid rewards your content directly with convertible tokens.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-secondary flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Earn Success Points for every post, meme, or story you share</span>
                  </li>
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-secondary flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Connect with an engaged community that values quality content</span>
                  </li>
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-secondary flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Convert your earned points to SKC tokens with real market value</span>
                  </li>
                </ul>
                
                <div className="mt-8">
                  <Link href="/sign-up?persona=creator">
                    <Button size="lg" className="bg-secondary hover:bg-secondary-600 text-black">
                      Start Creating & Earning
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Casual Participant (Chris) Section */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">For Crypto Newcomers</h2>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">No Technical Knowledge Required</h3>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h4 className="text-2xl font-bold text-gray-900 mb-4">Start Your Crypto Journey the Easy Way</h4>
                <p className="text-lg text-gray-600 mb-6">
                  New to crypto? No problem. Success Kid makes it easy to participate in a blockchain project without the technical complexity.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-accent flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Simple signup with email - no wallet required to start earning</span>
                  </li>
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-accent flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Learn crypto concepts gradually as you participate</span>
                  </li>
                  <li className="flex">
                    <div className="mr-4 h-6 w-6 text-accent flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Connect a wallet at your own pace when you're ready</span>
                  </li>
                </ul>
                
                <div className="mt-8">
                  <Link href="/sign-up?persona=casual">
                    <Button size="lg" className="bg-accent hover:bg-accent-600">
                      Join Without a Wallet
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl from-accent-100 to-accent-50 rounded-tl-full z-0 opacity-50"></div>
                
                <h4 className="text-xl font-bold mb-6 relative z-10">Get Started in 3 Easy Steps</h4>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex">
                    <div className="mr-4 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h5 className="font-semibold">Create Your Account</h5>
                      <p className="text-sm text-gray-600">Sign up with your email in less than a minute</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h5 className="font-semibold">Join the Community</h5>
                      <p className="text-sm text-gray-600">Create content and engage with other members</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h5 className="font-semibold">Earn Success Points</h5>
                      <p className="text-sm text-gray-600">Watch your points grow with every contribution</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg relative z-10">
                  <p className="font-medium text-center text-gray-700">
                    Optional: Connect a wallet anytime to unlock token redemption
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Community Showcase Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Vibrant Community</h2>
            <h3 className="mt-2 text-3xl font-bold text-gray-900">Join Our Growing Success Kid Family</h3>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Be part of a community that creates, collaborates, and celebrates success together
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Community Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <h4 className="text-xl font-semibold mb-6">Community Activity</h4>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl mr-4">
                    👥
                  </div>
                  <div>
                    <div className="text-2xl font-bold">5,000+</div>
                    <div className="text-gray-600">Active Members</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl mr-4">
                    📝
                  </div>
                  <div>
                    <div className="text-2xl font-bold">250+</div>
                    <div className="text-gray-600">Daily Posts</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl mr-4">
                    🏆
                  </div>
                  <div>
                    <div className="text-2xl font-bold">125,000+</div>
                    <div className="text-gray-600">SP Earned Today</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl mr-4">
                    💰
                  </div>
                  <div>
                    <div className="text-2xl font-bold">3,200+</div>
                    <div className="text-gray-600">Token Holders</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Testimonials */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 h-full">
                <h4 className="text-xl font-semibold mb-6">What Our Members Say</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-start space-x-4 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        👨
                      </div>
                      <div>
                        <div className="font-semibold">Alex K.</div>
                        <div className="text-sm text-gray-500">Crypto Enthusiast</div>
                      </div>
                    </div>
                    <p className="text-gray-600 italic">
                      "I've earned over 10,000 SP in just my first month. The community is incredibly supportive and the token fundamentals are solid!"
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-start space-x-4 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        👩
                      </div>
                      <div>
                        <div className="font-semibold">Sarah M.</div>
                        <div className="text-sm text-gray-500">New Member</div>
                      </div>
                    </div>
                    <p className="text-gray-600 italic">
                      "As someone new to crypto, Success Kid made it easy for me to get started and earn real rewards. The step-by-step guidance was fantastic."
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-start space-x-4 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        👨
                      </div>
                      <div>
                        <div className="font-semibold">Ryan T.</div>
                        <div className="text-sm text-gray-500">Content Creator</div>
                      </div>
                    </div>
                    <p className="text-gray-600 italic">
                      "My memes and posts get way more engagement here than on traditional social media, plus I get rewarded with tokens. Win-win!"
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-start space-x-4 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        👩
                      </div>
                      <div>
                        <div className="font-semibold">Jamie L.</div>
                        <div className="text-sm text-gray-500">Moderator</div>
                      </div>
                    </div>
                    <p className="text-gray-600 italic">
                      "What makes this community special is how we all contribute to each other's success. It's not just about the token - it's about the people."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 py-20 relative overflow-hidden">
        {/* Enhanced background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white"></div>
          
          {/* All animations handled client-side only */}
          <AnimateOnMount>
            {/* Animated rays */}
            <ClientMotion 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/30 to-transparent"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <div className="w-full h-full" />
            </ClientMotion>
              
            {/* Small floating particles - client side only with consistent keys */}
            {Array.from({ length: 15 }).map((_, i) => {
              // Use seeded random values to avoid hydration mismatches
              const width = 8;
              const height = 8;
              const left = `${10 + (i * 5) % 80}%`;
              const top = `${5 + (i * 7) % 90}%`;
              
              return (
                <ClientMotion
                  key={`particle-${i}`}
                  className="absolute rounded-full bg-white/30"
                  style={{
                    width,
                    height,
                    left,
                    top,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    x: [0, 10, 0],
                    opacity: [0, 0.6, 0],
                  }}
                  transition={{
                    duration: 5 + (i % 5),
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                >
                  <div className="w-full h-full" />
                </ClientMotion>
              );
            })}
          </AnimateOnMount>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6 text-3xl font-bold text-white">
              Clench Your Fist, Claim Your Success Today!
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
              Join over 5,000 members already earning Success Points and converting them to valuable SKC tokens. Takes less than 2 minutes to get started.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-full sm:w-auto">
                <GlowingEffect 
                  color="white" 
                  size="lg" 
                  intensity="light" 
                  pulseEffect={true}
                >
                  <Link href="/sign-up" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="bg-white text-primary-700 hover:bg-white/90 w-full sm:w-auto group relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white to-white/70 opacity-0 group-hover:opacity-100 transition-opacity blur-md"></span>
                      <span className="relative flex items-center">
                        Create Free Account
                        <ParticleEffect 
                          count={8} 
                          color="primary" 
                          size={4} 
                          spread={20} 
                          duration={1.2} 
                          trigger="hover" 
                          className="ml-2"
                        />
                      </span>
                    </Button>
                  </Link>
                </GlowingEffect>
              </div>
              
              <GradientBorder 
                animate={true} 
                borderWidth={1} 
                gradientFrom="from-white" 
                gradientTo="to-white/70" 
                borderRadius="rounded-md"
                className="w-full sm:w-auto"
                padding="p-[1px]"
              >
                <Link href="/about" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-transparent text-white hover:bg-white/10 w-full sm:w-auto"
                  >
                    <span>Learn More First</span>
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </Link>
              </GradientBorder>
            </div>
            
            <motion.p 
              className="mt-6 text-sm text-white/80"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              No credit card required. No technical knowledge needed.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
