'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, ClientMotion, AnimateOnMount, GlowingEffect, ParticleEffect, GradientBorder } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { 
  AnimatedSuccessElement, 
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
                      <AnimatedPointsBadge 
                        label="Referral Bonus" 
                        points={500} 
                        icon="🔄" 
                        delay={0.6}
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
                      <motion.span 
                        className="absolute inset-0" 
                        style={{ 
                          background: 'linear-gradient(90deg, rgba(30,136,229,0) 0%, rgba(30,136,229,0.5) 50%, rgba(30,136,229,0) 100%)' 
                        }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                      />
                      <motion.span 
                        className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 blur-md" 
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="relative flex items-center">
                        <span>Start Earning Now</span>
                        <ParticleEffect 
                          count={15} 
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
                  borderWidth={2} 
                  gradientFrom="from-secondary" 
                  gradientTo="to-primary-300" 
                  borderRadius="rounded-md"
                  className="w-full sm:w-auto"
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto group border-0 relative overflow-hidden"
                    as={Link}
                    href="/#how-it-works"
                  >
                    <motion.span 
                      className="absolute inset-0" 
                      style={{ 
                        background: 'linear-gradient(90deg, rgba(255,193,7,0) 0%, rgba(255,193,7,0.2) 50%, rgba(255,193,7,0) 100%)' 
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    />
                    <span>See How It Works</span>
                    <motion.span 
                      className="ml-2 inline-block"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      →
                    </motion.span>
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
                    scale: 1.1,
                    rotate: 5,
                    transition: { duration: 0.5 }
                    }}
                  >
                    <ClientMotion
                      className="absolute inset-0 bg-gradient-to-r from-primary-300/50 to-secondary-300/50 rounded-full blur-xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                        rotate: [0, 10, 0, -10, 0]
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                    >
                      <div className="w-full h-full" />
                    </ClientMotion>
                    <div className="relative">
                      <AnimatedSuccessElement 
                        size={200} 
                        variant="starburst" 
                        intensity="high" 
                        color="primary" 
                      />
                      
                      {/* Enhanced sparkle effects */}
                      {Array.from({ length: 5 }).map((_, i) => (
                        <ClientMotion
                          key={`sparkle-${i}`}
                          className="absolute rounded-full bg-white shadow-lg shadow-primary/30"
                          style={{
                            width: 3 + Math.random() * 5,
                            height: 3 + Math.random() * 5,
                            left: `${10 + Math.random() * 80}%`,
                            top: `${10 + Math.random() * 80}%`,
                          }}
                          animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                            x: [0, (Math.random() * 10) - 5],
                            y: [0, (Math.random() * 10) - 5]
                          }}
                          transition={{
                            duration: 1.5 + Math.random(),
                            repeat: Infinity,
                            delay: i * 0.7,
                            repeatDelay: 1 + Math.random() * 3
                          }}
                        >
                          <div className="w-full h-full" />
                        </ClientMotion>
                      ))}
                    </div>
                  </ClientMotion>
                </AnimateOnMount>
                
                {/* Interactive Demo Component */}
                <AnimateOnMount>
                  <ClientMotion
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="w-full flex justify-center"
                  >
                    <div className="w-full h-[500px]">
                      <PointsSystemDemo 
                        className="z-10 w-full h-full" 
                        pointsInterval={3000} 
                        pointsIncrement={10} 
                        redemptionThreshold={100} 
                      />
                    </div>
                  </ClientMotion>
                </AnimateOnMount>
                
                {/* Decorative elements */}
                <AnimateOnMount>
                  {!prefersReducedMotion && (
                    <>
                      <ClientMotion 
                        type="div"
                        animate={{ 
                          y: [0, -15, 0],
                          rotate: [0, 5, 0, -3, 0],
                        }}
                        transition={{ 
                          duration: 8, 
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                        className="absolute -top-20 -right-16 text-4xl"
                      >
                        <div className="relative">
                          <span>🚀</span>
                          {/* Enhanced glow effect */}
                          <ClientMotion
                            className="absolute -inset-5 rounded-full bg-gradient-radial from-primary-300/40 to-transparent blur-md"
                            animate={{
                              scale: [0.8, 1.3, 0.8],
                              opacity: [0.2, 0.5, 0.2],
                              rotate: [0, 90, 180, 270, 360]
                            }}
                            transition={{
                              scale: { duration: 3, repeat: Infinity, repeatType: 'reverse' },
                              opacity: { duration: 3, repeat: Infinity, repeatType: 'reverse' },
                              rotate: { duration: 20, repeat: Infinity, ease: 'linear' }
                            }}
                          />
                          {/* Animated particles */}
                          {[...Array(6)].map((_, i) => (
                            <ClientMotion
                              key={`rocket-particle-${i}`}
                              className="absolute w-1 h-1 rounded-full bg-secondary/80"
                              style={{
                                left: '50%',
                                top: '100%',
                              }}
                              animate={{
                                x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40],
                                y: [0, 30 + Math.random() * 20],
                                opacity: [0.8, 0],
                                scale: [1, 0]
                              }}
                              transition={{
                                duration: 1 + Math.random(),
                                repeat: Infinity,
                                delay: i * 0.2,
                                repeatDelay: Math.random() * 2
                              }}
                            />
                          ))}
                        </div>
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
      <section id="how-it-works" className="py-20 bg-white relative overflow-hidden">
        {/* Enhanced background effect for the section */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          style={{ backgroundSize: '200% 200%' }}
        />
        
        {/* Animated blobs in background */}
        <motion.div
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary-100/10 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        <motion.div
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-secondary-100/10 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: 2
          }}
        />
        
        {/* Add a subtle grid pattern to the background */}
        <div className="absolute inset-0 opacity-[0.01]" 
          style={{
            backgroundImage: 'linear-gradient(to right, #1E88E5 1px, transparent 1px), linear-gradient(to bottom, #1E88E5 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 relative"
          >
            
            {/* Add subtle animated particles inside the section */}
            {[...Array(12)].map((_, i) => (
              <ClientMotion
                key={`how-it-works-particle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
                style={{
                  left: `${10 + (i * 7)}%`,
                  top: `${20 + (i * 6) % 60}%`,
                }}
                animate={{
                  y: [0, -15, 0],
                  x: [0, 10, 0, -10, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 5 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
            
            <h3 className="text-3xl font-bold text-gray-900 relative z-10 drop-shadow-sm">How the Success Kid Community Works</h3>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto font-normal text-lg">
              A simple three-step process to start earning and growing with our community
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Add connecting lines between steps - only visible on desktop */}
            <div className="hidden md:block absolute top-1/3 left-1/4 w-1/2 h-0.5 bg-gradient-to-r from-primary-200 to-primary-300 z-0"></div>
            <div className="hidden md:block absolute top-1/3 left-1/2 w-1/4 h-0.5 bg-gradient-to-r from-primary-300 to-primary-200 z-0"></div>
            
            {/* Arrow indicators */}
            <div className="hidden md:flex absolute top-1/3 left-[calc(50%-10px)] transform -translate-y-1/2 text-primary-300 z-0">
              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl"
              >
                →
              </motion.div>
            </div>
            
            <div className="hidden md:flex absolute top-1/3 left-[calc(75%-10px)] transform -translate-y-1/2 text-primary-300 z-0">
              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="text-2xl"
              >
                →
              </motion.div>
            </div>
            
            {/* Step 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative z-10"
              >
                <div className="bg-white rounded-xl border border-gray-200 p-7 shadow-md h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary-200 hover:translate-y-[-2px]">
                  {/* Card background with enhanced gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary-50/10 opacity-30" />
                  
                  {/* Improved animated icon */}
                  <div className="flex flex-col mb-5 items-center">
                    <div 
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xl text-white font-bold shadow-lg mb-4 relative"
                    >
                      1
                      <div className="absolute inset-0 rounded-full bg-primary-400/20 blur-sm" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center drop-shadow-sm">Participate & Earn</h3>
                  </div>
                  <p className="text-gray-700 mb-6 text-center font-normal leading-relaxed text-sm">
                    Create content, comment on posts, and engage with the community to earn Success Points (SP).
                  </p>
                  <motion.div 
                    className="text-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <span className="text-5xl inline-block drop-shadow-md">🏆</span>
                  </motion.div>
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
                <div className="bg-white rounded-xl border border-gray-200 p-7 shadow-md h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary-200 hover:translate-y-[-2px]">
                  {/* Card background with enhanced gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary-50/10 opacity-30" />
                  
                  {/* Improved animated icon */}
                  <div className="flex flex-col mb-5 items-center">
                    <div 
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xl text-white font-bold shadow-lg mb-4 relative"
                    >
                      2
                      <div className="absolute inset-0 rounded-full bg-primary-400/20 blur-sm" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center drop-shadow-sm">Convert to Tokens</h3>
                  </div>
                  <p className="text-gray-700 mb-6 text-center font-normal leading-relaxed text-sm">
                    Redeem your Success Points for SKC tokens at a rate of 100 SP = 1 SKC.
                  </p>
                  <motion.div 
                    className="text-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <motion.span 
                      className="text-5xl inline-block drop-shadow-md"
                      animate={{ rotateY: [0, 360] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5 }}
                    >
                      💱
                    </motion.span>
                  </motion.div>
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
                <div className="bg-white rounded-xl border border-gray-200 p-7 shadow-md h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary-200 hover:translate-y-[-2px]">
                  {/* Card background with enhanced gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary-50/10 opacity-30" />
                  
                  {/* Improved animated icon */}
                  <div className="flex flex-col mb-5 items-center">
                    <div 
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xl text-white font-bold shadow-lg mb-4 relative"
                    >
                      3
                      <div className="absolute inset-0 rounded-full bg-primary-400/20 blur-sm" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center drop-shadow-sm">Grow Your Holdings</h3>
                  </div>
                  <p className="text-gray-700 mb-6 text-center font-normal leading-relaxed text-sm">
                    Hold tokens as they grow in value with our expanding community.
                  </p>
                  <motion.div 
                    className="text-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <motion.span 
                      className="text-5xl inline-block drop-shadow-md"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      📈
                    </motion.span>
                  </motion.div>
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
              className="text-center mb-12 relative"
            >
              {/* Add subtle animated gradient background */}
              <motion.div 
                className="absolute inset-0 rounded-xl -z-10 opacity-10"
                style={{
                  background: 'radial-gradient(circle, rgba(30,136,229,0.4) 0%, rgba(255,255,255,0) 70%)',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
              />
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
                    <motion.div
                      whileHover={{ 
                        scale: 1.03, 
                        y: -1
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25,
                        mass: 0.8,
                        duration: 0.3
                      }}
                    >
                      <Button 
                        size="lg"
                        className="transition-shadow hover:shadow-[0_0_8px_rgba(30,136,229,0.6)]" 
                      >
                        Connect Your Wallet
                      </Button>
                    </motion.div>
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
                  <motion.div 
                  initial={{
                    width: '0%',
                    opacity: 0
                  }}
                  whileInView={{
                    width: '50%',
                    opacity: 1
                  }}
                  transition={{
                    delay: 0.5, 
                    duration: 0.8, 
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                  className="bg-primary h-4 rounded-full relative overflow-hidden"
                >
                  <motion.div 
                    className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-primary-500/0 via-white/40 to-primary-500/0"
                    animate={{
                      x: ["-100%", "200%"]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      repeatDelay: 3
                    }}
                  />
                </motion.div>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="font-medium">Development</span>
                    <span className="font-bold text-primary">20%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                  <motion.div 
                  initial={{
                    width: '0%',
                    opacity: 0
                  }}
                  whileInView={{
                    width: '20%',
                    opacity: 1
                  }}
                  transition={{
                    delay: 0.7, 
                    duration: 0.8, 
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                  className="bg-primary h-4 rounded-full relative overflow-hidden"
                >
                  <motion.div 
                    className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-primary-500/0 via-white/40 to-primary-500/0"
                    animate={{
                      x: ["-100%", "200%"]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      repeatDelay: 3,
                      delay: 0.3
                    }}
                  />
                </motion.div>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="font-medium">Public Sale</span>
                    <span className="font-bold text-primary">30%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                  <motion.div 
                  initial={{
                    width: '0%',
                    opacity: 0
                  }}
                  whileInView={{
                    width: '30%',
                    opacity: 1
                  }}
                  transition={{
                    delay: 0.9, 
                    duration: 0.8, 
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                  className="bg-primary h-4 rounded-full relative overflow-hidden"
                >
                  <motion.div 
                    className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-primary-500/0 via-white/40 to-primary-500/0"
                    animate={{
                      x: ["-100%", "200%"]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      repeatDelay: 3,
                      delay: 0.6
                    }}
                  />
                </motion.div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg relative z-10">
                  <h5 className="font-semibold mb-2">Market Cap Milestones</h5>
                  <div className="flex items-center">
                    <div className="h-8 flex-grow bg-gray-200 rounded-full overflow-hidden relative">
                      <motion.div 
                        className="h-full rounded-full"
                        style={{ 
                          background: 'linear-gradient(to right, #1E88E5, #42A5F5)'
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: '40%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                        viewport={{ once: true }}
                      >
                        {/* Animated shine effect */}
                        <motion.div 
                          className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            repeatDelay: 4 
                          }}
                        />
                      </motion.div>
                      
                      {/* Milestone dots */}
                      {[20, 40, 60, 80].map((position) => (
                        <motion.div 
                          key={`milestone-${position}`}
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white bg-gray-400"
                          style={{ left: `${position}%` }}
                          animate={{ 
                            scale: position <= 40 ? [1, 1.5, 1] : 1,
                            backgroundColor: position <= 40 ? ['#4CAF50', '#81C784', '#4CAF50'] : undefined
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: position <= 40 ? Infinity : 0, 
                            repeatDelay: 4 
                          }}
                        />
                      ))}
                    </div>
                    <motion.span 
                      className="ml-4 font-semibold"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1 }}
                      viewport={{ once: true }}
                    >
                      $400K / $1M
                    </motion.span>
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
              className="text-center mb-12 relative"
            >
              {/* Add subtle animated gradient background */}
              <motion.div 
                className="absolute inset-0 rounded-xl -z-10 opacity-10"
                style={{
                  background: 'radial-gradient(circle, rgba(255,193,7,0.4) 0%, rgba(255,255,255,0) 70%)',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
              />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">For Content Creators</h2>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">Turn Your Creative Skills Into Crypto Rewards</h3>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="order-2 lg:order-1 bg-white rounded-xl p-6 shadow-lg border border-gray-100 relative overflow-hidden"
              >
                {/* Animated gradient overlay */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-secondary-50/30 to-transparent opacity-50 -z-10" 
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    repeatType: 'loop'
                  }}
                  style={{
                    backgroundSize: '200% 200%'
                  }}
                />
                <div className="flex items-start space-x-4 mb-6 relative">
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-xl relative"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    👩
                    <motion.div 
                      className="absolute -inset-1.5 rounded-full bg-secondary/10"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </motion.div>
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
                    <motion.div
                      whileHover={{ 
                        scale: 1.03, 
                        y: -1
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25,
                        mass: 0.8,
                        duration: 0.3
                      }}
                    >
                      <Button 
                        size="lg" 
                        className="bg-secondary hover:bg-secondary-600 text-black transition-shadow hover:shadow-[0_0_8px_rgba(255,193,7,0.6)]"
                      >
                        Start Creating & Earning
                      </Button>
                    </motion.div>
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
              className="text-center mb-12 relative"
            >
              {/* Add subtle animated gradient background */}
              <motion.div 
                className="absolute inset-0 rounded-xl -z-10 opacity-10"
                style={{
                  background: 'radial-gradient(circle, rgba(76,175,80,0.4) 0%, rgba(255,255,255,0) 70%)',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
              />
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
                    <motion.div
                      whileHover={{ 
                        scale: 1.03, 
                        y: -1
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25,
                        mass: 0.8,
                        duration: 0.3
                      }}
                    >
                      <Button 
                        size="lg" 
                        className="bg-accent hover:bg-accent-600 transition-shadow hover:shadow-[0_0_8px_rgba(76,175,80,0.6)]"
                      >
                        Join Without a Wallet
                      </Button>
                    </motion.div>
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
                {/* Animated subtle corner graphic */}
                <motion.div 
                  className="absolute -bottom-10 -right-10 w-48 h-48 bg-gradient-to-tl from-accent-100/50 to-transparent rounded-tl-full -z-10"
                  animate={{
                    rotate: [0, 10, 0, -5, 0],
                    scale: [1, 1.05, 1, 0.98, 1],
                    opacity: [0.4, 0.6, 0.4]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                  }}
                />
                
                <h4 className="text-xl font-bold mb-6 relative z-10 flex items-center">
                  <motion.span
                    className="inline-block mr-2"
                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, repeatType: 'loop' }}
                  >
                    🌟
                  </motion.span>
                  Get Started in 3 Easy Steps
                </h4>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex">
                    <motion.div 
                      whileHover={{ scale: 1.1, backgroundColor: '#43A047' }}
                      className="mr-4 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                      1
                    </motion.div>
                    <div>
                      <h5 className="font-semibold">Create Your Account</h5>
                      <p className="text-sm text-gray-600">Sign up with your email in less than a minute</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <motion.div 
                      whileHover={{ scale: 1.1, backgroundColor: '#43A047' }}
                      className="mr-4 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                      2
                    </motion.div>
                    <div>
                      <h5 className="font-semibold">Join the Community</h5>
                      <p className="text-sm text-gray-600">Create content and engage with other members</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <motion.div 
                      whileHover={{ scale: 1.1, backgroundColor: '#43A047' }}
                      className="mr-4 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                      3
                    </motion.div>
                    <div>
                      <h5 className="font-semibold">Earn Success Points</h5>
                      <p className="text-sm text-gray-600">Watch your points grow with every contribution</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg relative z-10 group">
                  <motion.p 
                    className="font-medium text-center text-gray-700"
                    whileHover={{
                      color: '#2E7D32',
                    }}
                  >
                    <motion.span 
                      className="inline-block mr-2"
                      initial={{ opacity: 0.5, y: 3 }}
                      animate={{ opacity: 1, y: [3, -3, 3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      💰
                    </motion.span>
                    Optional: Connect a wallet anytime to unlock token redemption
                  </motion.p>
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
      
      {/* CTA Section - Enhanced background and animations */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 py-20 relative overflow-hidden">
        {/* Enhanced background patterns with improved visual effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white blur-xl"></div>
          
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
            
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 sm:justify-center">
                <div className="w-full sm:w-auto">
                  <GlowingEffect 
                    color="white" 
                    size="lg" 
                    intensity="medium" 
                    pulseEffect={true}
                  >
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto group relative overflow-hidden bg-white text-primary-700 hover:bg-white/90"
                      as={Link}
                      href="/sign-up"
                    >
                      <motion.span 
                        className="absolute inset-0" 
                        style={{ 
                          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)' 
                        }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                      />
                      <motion.span 
                        className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/40 opacity-0 group-hover:opacity-100 blur-md" 
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="relative flex items-center">
                        <span>Start Earning Now</span>
                        <ParticleEffect 
                          count={15} 
                          color="primary" 
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
                
                <GradientBorder 
                  animate={true} 
                  borderWidth={2} 
                  gradientFrom="from-white" 
                  gradientTo="to-white/70" 
                  borderRadius="rounded-md"
                  className="w-full sm:w-auto"
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto group border-0 relative overflow-hidden text-white hover:bg-white/10"
                    as={Link}
                    href="/#how-it-works"
                  >
                    <motion.span 
                      className="absolute inset-0" 
                      style={{ 
                        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)' 
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    />
                    <span>See How It Works</span>
                    <motion.span 
                      className="ml-2 inline-block"
                      animate={{ x: [0, 10, 0], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      →
                    </motion.span>
                  </Button>
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
