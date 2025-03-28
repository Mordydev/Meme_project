'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@clerk/nextjs';

const CtaSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  
  const { isSignedIn } = useAuth();

  return (
    <section 
      ref={sectionRef}
      className="py-16 relative overflow-hidden bg-gradient-to-br from-primary-800 to-primary-900 text-white"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 rounded-full bg-secondary opacity-10 blur-3xl"
          animate={{
            x: [50, 150, 50],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent opacity-10 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Ready to Join the Success Kid Community?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of members already earning rewards, building connections, and creating value together.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
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
            </div>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="text-secondary text-4xl font-bold mb-2">5K+</div>
              <p className="text-white/70">Active community members</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="text-secondary text-4xl font-bold mb-2">500K</div>
              <p className="text-white/70">Success Points earned daily</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="text-secondary text-4xl font-bold mb-2">45%</div>
              <p className="text-white/70">To first market cap milestone</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-white/60 text-sm">
              Have questions? Check out our <Link href="/faq" className="underline hover:text-white">FAQ</Link> or join our <Link href="#" className="underline hover:text-white">Discord community</Link>.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
