'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';

const HeroSection = () => {
  const { userId, isSignedIn } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-purple-800 text-white py-16 md:py-24 lg:py-32">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/grid-pattern.svg')] opacity-10"></div>
        
        {/* Animated circles */}
        <motion.div
          className="absolute top-20 right-10 w-64 h-64 rounded-full bg-white opacity-5"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-secondary opacity-10"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column - Text Content */}
          <motion.div 
            className="flex-1 max-w-2xl"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                Clench Your Fist, <br />
                <span className="text-secondary">Claim Your Success!</span>
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
                Join the Success Kid community platform where crypto enthusiasts 
                and meme lovers connect, engage, and create value together.
              </p>
            </motion.div>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {isSignedIn ? (
                <Button asChild size="lg" className="bg-secondary text-black hover:bg-secondary/90">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-secondary text-black hover:bg-secondary/90">
                    <Link href="/register">Join Now</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 flex items-center"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white overflow-hidden">
                    <Image
                      src={`/images/avatar-${i}.jpg`}
                      alt="Community Member"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-bold">
                  +5k
                </div>
              </div>
              <span className="ml-3 text-sm text-white/80">
                Join <span className="font-bold">5,000+</span> community members
              </span>
            </motion.div>
          </motion.div>
          
          {/* Right Column - Image/Animation */}
          <motion.div 
            className="flex-1 flex justify-center lg:justify-end"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            <div className="relative w-full max-w-md">
              {/* Main Success Kid Image */}
              <motion.div
                className="relative z-10"
                animate={{ y: [0, -15, 0] }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <Image
                  src="/images/success-kid-hero.png"
                  alt="Success Kid"
                  width={500}
                  height={600}
                  className="relative z-10"
                  priority
                />
              </motion.div>
              
              {/* Floating Elements */}
              <motion.div 
                className="absolute top-10 right-0 bg-white rounded-lg p-2 shadow-lg z-20"
                animate={{ 
                  y: [0, 15, 0],
                  rotate: [0, 5, 0], 
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <div className="flex items-center gap-2 text-black">
                  <span className="text-xl font-bold text-accent">+500</span>
                  <span className="text-xs">SP Points</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute bottom-10 left-0 bg-white rounded-lg p-2 shadow-lg z-20"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, -3, 0], 
                }}
                transition={{ 
                  duration: 7, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <div className="flex items-center gap-2 text-black">
                  <span className="text-xs">Achievement</span>
                  <span className="text-xl font-bold text-secondary">🏆</span>
                </div>
              </motion.div>
              
              {/* Glow effect */}
              <div className="absolute -bottom-20 -left-20 w-[140%] h-[140%] bg-gradient-radial from-secondary/30 to-transparent rounded-full blur-3xl opacity-30 z-0"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
