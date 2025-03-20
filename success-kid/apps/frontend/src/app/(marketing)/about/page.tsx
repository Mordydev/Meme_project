'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { 
  MemeLegacySection, 
  CommunityValueSection 
} from '@/components/marketing/about';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ParticleEffect } from '@/components/ui/particle-effect';
import { ClientMotion, AnimateOnMount } from '@/components/ui';

export default function AboutPage() {
  const [activeStage, setActiveStage] = useState(3); // Default to Growth & Reinvestment
  const [isPlaying, setIsPlaying] = useState(false);
  const nodeControls = useAnimation();
  const flowControls = useAnimation();
  
  // The four stages of the success amplification cycle
  const stages = [
    { 
      id: 0, 
      title: "Individual Effort", 
      description: "Members contribute content and engage", 
      icon: "🚀", 
      emoji: "✊", 
      color: "from-blue-500 to-cyan-400",
      bgColor: "bg-blue-50",
      details: "Creating content (+50 SP) • Comments (+15 SP) • Referrals (+500 SP)"
    },
    { 
      id: 1, 
      title: "Community Amplification", 
      description: "The community upvotes and improves content", 
      icon: "👥",
      emoji: "👥", 
      color: "from-indigo-500 to-purple-400",
      bgColor: "bg-indigo-50",
      details: "Upvotes increase visibility • Comments add depth • Collective knowledge improves outcomes"
    },
    { 
      id: 2, 
      title: "Rewards Distribution", 
      description: "Value flows back as Success Points", 
      icon: "🏆",
      emoji: "🏆", 
      color: "from-amber-500 to-yellow-400",
      bgColor: "bg-amber-50",
      details: "Points for valuable contributions • Bonus for exceptional content • Achievements and recognition"
    },
    { 
      id: 3, 
      title: "Growth & Reinvestment", 
      description: "Success Points convert to tokens, fueling growth", 
      icon: "📈",
      emoji: "📈", 
      color: "from-green-500 to-emerald-400",
      bgColor: "bg-green-50",
      details: "100 SP = 1 SKC token • Token value grows with community • Sustainable ecosystem"
    }
  ];

  // Auto-play through stages
  useEffect(() => {
    let interval;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStage(prevStage => (prevStage + 1) % stages.length);
      }, 4000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, stages.length]);

  // Animate node connections based on current stage
  useEffect(() => {
    // Animate nodes based on current stage
    const animateStage = async () => {
      // Reset all nodes
      await nodeControls.start({
        scale: 1,
        boxShadow: "0 0 0 0 rgba(30, 136, 229, 0)",
        transition: { duration: 0.4, ease: "easeInOut" }
      });
      
      // Animate current stage node
      await nodeControls.start(node => {
        if (node.id === activeStage) {
          return {
            scale: 1.1, // More subtle scale
            boxShadow: "0 0 0 4px rgba(30, 136, 229, 0.15)", // More subtle glow
            transition: { 
              type: "spring", 
              stiffness: 200,
              damping: 20 
            }
          };
        }
        return {};
      });
      
      // Animate flows between nodes
      await flowControls.start(flow => {
        if (flow.from === activeStage && flow.to === (activeStage + 1) % stages.length) {
          return {
            opacity: 1,
            pathLength: 1,
            transition: { duration: 1.2, ease: "easeInOut" }
          };
        } else {
          return {
            opacity: 0.25,
            pathLength: 1,
            transition: { duration: 0.6, ease: "easeOut" }
          };
        }
      });
    };
    
    animateStage();
  }, [activeStage, nodeControls, flowControls]);

  return (
    <div className="relative bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with gradient background and particles */}
      <section className="relative overflow-hidden py-20 md:py-24 lg:py-24 border-b border-gray-200">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
            }}
            style={{ backgroundSize: '200% 200%' }}
          />
          
          {/* Animated background blobs - more subtle */}
          <motion.div
            className="absolute top-0 right-0 w-1/3 h-1/3 rounded-full bg-primary-100/30 blur-3xl"
            animate={{
              x: [0, -15, 0],
              y: [0, 15, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" 
            style={{
              backgroundImage: 'linear-gradient(to right, #1E88E5 1px, transparent 1px), linear-gradient(to bottom, #1E88E5 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* Bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent"></div>
        </div>
        
        {/* Animated particles in background - fewer and more subtle */}
        <AnimateOnMount>
          {Array.from({ length: 10 }).map((_, i) => (
            <ClientMotion
              key={`hero-particle-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary/20"
              style={{
                left: `${10 + (i * 8) % 80}%`,
                top: `${5 + (i * 9) % 90}%`,
              }}
              animate={{
                y: [0, -10, 0],
                x: [0, 5, 0, -5, 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 6 + (i % 4),
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </AnimateOnMount>
        
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row items-start">
            {/* Left side: About text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full lg:w-2/5 mb-12 lg:mb-0 lg:pr-10 lg:pt-4"
            >
              <motion.p 
                className="text-xl text-gray-700 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                Transforming a viral meme into a vibrant community where engagement creates value and success is amplified through collective effort.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="mb-10"
              >
                <p className="text-gray-700">
                  The <span className="font-bold text-primary-700">Success Kid Community Platform</span> harnesses the positive energy of the iconic meme to build an ecosystem where crypto enthusiasts and meme lovers alike can connect, engage, and create value together.
                </p>
              </motion.div>
              
              <motion.div 
                className="flex items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                <div className="mr-4">
                  <div className="bg-primary-50 rounded-full w-16 h-16 flex items-center justify-center text-4xl border border-primary-100">
                    ✊
                  </div>
                </div>
                <div className="flex-1">
                  <motion.p 
                    className="text-gray-700 font-semibold text-lg text-primary-600"
                  >
                    "Clench Your Fist, Claim Your Success!"
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right side: Success amplification cycle visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="w-full lg:w-3/5 lg:pl-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-center mb-8 text-primary-600">
                  The Success Amplification Cycle
                </h2>
                
                <div className="relative mb-4">
                  {/* Center Success Kid fist */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center z-10 border border-primary-100">
                    <div className="text-4xl">👊</div>
                  </div>
                  
                  {/* Stage visualization - more diagrammatic and wider */}
                  <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                    {/* Individual Effort - Top left */}
                    <div 
                      className={`relative ${activeStage === 0 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border border-gray-200'} rounded-lg p-4 cursor-pointer transition-all bg-white`}
                      onClick={() => {
                        setActiveStage(0);
                        setIsPlaying(false);
                      }}
                    >
                      <div className={`flex items-center mb-2`}>
                        <div className={`w-10 h-10 rounded-full ${stages[0].bgColor} flex items-center justify-center text-xl mr-3`}>
                          {stages[0].emoji}
                        </div>
                        <span className="font-medium">Individual Effort</span>
                      </div>
                      
                      {/* Connection line to center */}
                      <div className="absolute top-1/2 right-0 w-12 h-1 bg-blue-400"></div>
                    </div>
                    
                    {/* Community Amplification - Top right */}
                    <div 
                      className={`relative ${activeStage === 1 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border border-gray-200'} rounded-lg p-4 cursor-pointer transition-all bg-white`}
                      onClick={() => {
                        setActiveStage(1);
                        setIsPlaying(false);
                      }}
                    >
                      <div className={`flex items-center mb-2`}>
                        <div className={`w-10 h-10 rounded-full ${stages[1].bgColor} flex items-center justify-center text-xl mr-3`}>
                          {stages[1].emoji}
                        </div>
                        <span className="font-medium">Community Amplification</span>
                      </div>
                      
                      {/* Connection line to center */}
                      <div className="absolute top-1/2 left-0 w-12 h-1 bg-blue-400"></div>
                    </div>
                    
                    {/* Growth & Reinvestment - Bottom left */}
                    <div 
                      className={`relative ${activeStage === 3 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border border-gray-200'} rounded-lg p-4 cursor-pointer transition-all bg-white`}
                      onClick={() => {
                        setActiveStage(3);
                        setIsPlaying(false);
                      }}
                    >
                      <div className={`flex items-center mb-2`}>
                        <div className={`w-10 h-10 rounded-full ${stages[3].bgColor} flex items-center justify-center text-xl mr-3`}>
                          {stages[3].emoji}
                        </div>
                        <span className="font-medium">Growth & Reinvestment</span>
                      </div>
                      
                      {/* Connection line to center */}
                      <div className="absolute top-0 right-0 w-1 h-10 bg-blue-400"></div>
                    </div>
                    
                    {/* Rewards Distribution - Bottom right */}
                    <div 
                      className={`relative ${activeStage === 2 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border border-gray-200'} rounded-lg p-4 cursor-pointer transition-all bg-white`}
                      onClick={() => {
                        setActiveStage(2);
                        setIsPlaying(false);
                      }}
                    >
                      <div className={`flex items-center mb-2`}>
                        <div className={`w-10 h-10 rounded-full ${stages[2].bgColor} flex items-center justify-center text-xl mr-3`}>
                          {stages[2].emoji}
                        </div>
                        <span className="font-medium">Rewards Distribution</span>
                      </div>
                      
                      {/* Connection line to center */}
                      <div className="absolute top-0 left-0 w-1 h-10 bg-blue-400"></div>
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex justify-center space-x-3 mb-4">
                  <button
                    className={`px-4 py-1.5 rounded-full flex items-center text-xs font-medium ${
                      isPlaying 
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Play
                      </>
                    )}
                  </button>
                  
                  <button
                    className="px-4 py-1.5 bg-white text-primary-600 border border-primary-200 rounded-full flex items-center text-xs font-medium shadow-sm hover:bg-gray-50"
                    onClick={() => setActiveStage((activeStage + 1) % stages.length)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Next
                  </button>
                </div>
                
                {/* Current Stage Description */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                  <div className="flex items-start">
                    <div className={`w-10 h-10 rounded-full ${stages[activeStage].bgColor} flex items-center justify-center text-xl mr-3 flex-shrink-0`}>
                      <span>{stages[activeStage].emoji}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{stages[activeStage].title}</h3>
                      
                      {activeStage === 0 && (
                        <div className="text-gray-700 text-sm">
                          <p className="mb-2">
                            The cycle begins with individual community members contributing content and engaging in discussions. Each action represents a contribution to the ecosystem.
                          </p>
                          <div className="text-xs bg-gray-50 p-2 rounded text-gray-600">
                            {stages[activeStage].details}
                          </div>
                        </div>
                      )}
                      
                      {activeStage === 1 && (
                        <div className="text-gray-700 text-sm">
                          <p className="mb-2">
                            The community acts as an amplifier, providing feedback and support that increases the value of individual contributions beyond what any single person could achieve.
                          </p>
                          <div className="text-xs bg-gray-50 p-2 rounded text-gray-600">
                            {stages[activeStage].details}
                          </div>
                        </div>
                      )}
                      
                      {activeStage === 2 && (
                        <div className="text-gray-700 text-sm">
                          <p className="mb-2">
                            The platform's rewards system distributes value back through Success Points, creating a direct link between community contribution and individual benefit.
                          </p>
                          <div className="text-xs bg-gray-50 p-2 rounded text-gray-600">
                            {stages[activeStage].details}
                          </div>
                        </div>
                      )}
                      
                      {activeStage === 3 && (
                        <div className="text-gray-700 text-sm">
                          <p className="mb-2">
                            Success Points convert to SKC tokens, creating real economic value. This fuels further platform development, completing the cycle for sustainable growth.
                          </p>
                          <div className="text-xs bg-gray-50 p-2 rounded text-gray-600">
                            {stages[activeStage].details}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Core Vision Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute -inset-[10%] bg-gradient-radial from-primary-50/30 to-transparent opacity-70"></div>
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent"
            animate={{
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut"
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="prose prose-lg mx-auto p-8"
            >
              <ParticleEffect
                count={12}
                color="primary"
                trigger="hover"
                className="absolute inset-0 pointer-events-none"
              />
              
              <p className="text-gray-700 mb-6 relative">
                The <span className="font-bold text-primary-700">Success Kid Community Platform</span> transforms a viral meme coin into a sustainable digital community with real utility and engagement. While most meme coins rely solely on short-term hype, our vision is to harness the positive energy and recognition of the Success Kid meme to build a vibrant ecosystem where crypto enthusiasts and meme lovers alike can connect, engage, and create value together.
              </p>
              
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center text-5xl border border-primary-100">
                  👊
                </div>
              </div>
              
              <p className="text-gray-800 text-center font-semibold text-xl text-primary-600">
                Our tagline—"Clench Your Fist, Claim Your Success!"—embodies our mission to empower users through a combination of nostalgic connection, fair tokenomics, and rewarding engagement.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Meme History and Legacy */}
      <MemeLegacySection />
      
      {/* Community Value and Purpose */}
      <CommunityValueSection />
      
      {/* Call to Action */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-blue-700">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                'linear-gradient(225deg, #1976d2 0%, #0d47a1 100%)',
                'linear-gradient(315deg, #1e88e5 0%, #1565c0 100%)',
                'linear-gradient(45deg, #1976d2 0%, #0d47a1 100%)',
              ],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
            }}
          />
        </div>
        
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[url('/images/noise.png')] bg-repeat mix-blend-soft-light"></div>
          <div className="h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl font-bold mb-6 text-white"
            >
              Join Our Growing Community Today
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-xl mb-8 text-white/90"
            >
              Be part of a platform that turns engagement into real value. Connect, contribute, and claim your success!
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="relative inline-block"
            >
              <ParticleEffect
                count={15}
                color="white"
                duration={2.5}
                size={5}
                trigger="hover"
                className="absolute inset-0"
              />
              <a
                href="/register"
                className="inline-block bg-white text-primary-600 px-8 py-4 rounded-full font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                Register Now
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
