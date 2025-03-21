'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { GradientBorder } from '@/components/ui/gradient-border';

const SuccessAmplificationDemo = () => {
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);
  const nodeControls = useAnimation();
  const flowControls = useAnimation();
  
  // The four stages of the success amplification cycle
  const stages = [
    { id: 0, title: "Individual Effort", description: "Members contribute content and engage", icon: "🚀", color: "from-blue-500 to-cyan-400" },
    { id: 1, title: "Community Amplification", description: "The community upvotes and improves content", icon: "👥", color: "from-indigo-500 to-purple-400" },
    { id: 2, title: "Rewards Distribution", description: "Value flows back as Success Points", icon: "🏆", color: "from-amber-500 to-yellow-400" },
    { id: 3, title: "Growth & Reinvestment", description: "Success Points convert to tokens, fueling further growth", icon: "📈", color: "from-green-500 to-emerald-400" }
  ];
  
  // Auto-play through stages
  useEffect(() => {
    let interval;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setStage(prevStage => (prevStage + 1) % stages.length);
      }, 3000);
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
        transition: { duration: 0.3 }
      });
      
      // Animate current stage node
      await nodeControls.start(node => {
        if (node.id === stage) {
          return {
            scale: 1.2,
            boxShadow: "0 0 0 10px rgba(30, 136, 229, 0.2)",
            transition: { 
              type: "spring", 
              stiffness: 300, 
              damping: 15 
            }
          };
        }
        return {};
      });
      
      // Animate flows between nodes
      await flowControls.start(flow => {
        if (flow.from === stage && flow.to === (stage + 1) % stages.length) {
          return {
            opacity: 1,
            pathLength: 1,
            transition: { duration: 1, ease: "easeInOut" }
          };
        } else {
          return {
            opacity: 0.3,
            pathLength: 1,
            transition: { duration: 0.5 }
          };
        }
      });
    };
    
    animateStage();
  }, [stage, nodeControls, flowControls]);
  
  // Generate position for each node in a circle
  const getNodePosition = (index, total) => {
    const radius = 120; // Adjust based on container size
    const angle = (index / total) * 2 * Math.PI - Math.PI/2; // Start from top
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return { x, y };
  };
  
  // Generate connection paths between nodes
  const generatePath = (fromIndex, toIndex, total) => {
    const fromPos = getNodePosition(fromIndex, total);
    const toPos = getNodePosition(toIndex, total);
    
    // Calculate control points for curved path
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    const centerPull = 60; // Pull towards center for curve
    
    return `M ${fromPos.x} ${fromPos.y} Q ${midX + centerPull} ${midY + centerPull} ${toPos.x} ${toPos.y}`;
  };
  
  return (
    <div className="py-16 px-4 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute -inset-[10%] bg-gradient-radial from-primary-50/30 to-transparent opacity-70"></div>
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
      </div>
      
      <div className="max-w-4xl mx-auto text-center mb-12 relative">
        <motion.div
          className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-gradient-to-br from-primary-500/30 to-blue-500/30 blur-lg"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
        <motion.div
          className="absolute -bottom-6 -right-6 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 blur-lg"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop",
            delay: 1
          }}
        />
        
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-600"
        >
          The Success Amplification Cycle
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl text-gray-700"
        >
          See how the Success Kid platform creates a virtuous cycle of engagement, rewards, and growth.
        </motion.p>
      </div>
      
      <div className="relative">
        <GradientBorder 
          borderWidth={1} 
          gradientFrom="from-primary-300" 
          gradientTo="to-blue-500"
          animate={true}
          className="mb-8 rounded-xl overflow-hidden"
          borderRadius="rounded-xl"
        >
          <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8">
            <div 
              className="relative mx-auto mb-8 w-full max-w-xl aspect-square"
              ref={containerRef}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Central icon */}
              <GlowingEffect color="primary" size="lg" pulseEffect={true} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <motion.div
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center"
                  animate={{
                    rotate: [0, 3, 0, -3, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                >
                  <div className="text-6xl">👊</div>
                </motion.div>
              </GlowingEffect>
              
              {/* Connectivity graph */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
                <svg width="100%" height="100%" viewBox="-150 -150 300 300">
                  {/* Connection Paths */}
                  {stages.map((_, i) => (
                    <motion.path
                      key={`path-${i}`}
                      d={generatePath(i, (i + 1) % stages.length, stages.length)}
                      stroke="url(#gradientPath)"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="0 1"
                      custom={{ from: i, to: (i + 1) % stages.length }}
                      animate={flowControls}
                      initial={{ opacity: 0.3, pathLength: 1 }}
                      filter="drop-shadow(0 1px 2px rgba(30, 136, 229, 0.3))"
                    />
                  ))}
                  
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="gradientPath" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1E88E5" />
                      <stop offset="100%" stopColor="#64B5F6" />
                    </linearGradient>
                  </defs>
                  
                  {/* Flow particles on paths */}
                  {stages.map((_, i) => (
                    <motion.circle
                      key={`particle-${i}`}
                      r="4"
                      fill="#64B5F6"
                      opacity={0.8}
                      filter="drop-shadow(0 0 2px #1E88E5)"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ 
                        offsetDistance: ["0%", "100%"],
                        opacity: i === stage ? [0.8, 0.8] : [0.3, 0.3]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.5
                      }}
                      style={{
                        offsetPath: `path("${generatePath(i, (i + 1) % stages.length, stages.length)}")`,
                        offsetRotate: "0deg"
                      }}
                    />
                  ))}
                </svg>
              </div>
              
              {/* Stage Nodes */}
              {stages.map((stageData, index) => {
                const { x, y } = getNodePosition(index, stages.length);
                const isActive = index === stage;
                
                return (
                  <motion.div
                    key={stageData.id}
                    className="absolute flex flex-col items-center cursor-pointer z-20"
                    style={{ 
                      left: `calc(50% + ${x}px)`, 
                      top: `calc(50% + ${y}px)`, 
                      transform: 'translate(-50%, -50%)' 
                    }}
                    custom={{ id: stageData.id }}
                    animate={nodeControls}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => {
                      setStage(index);
                      setIsPlaying(false);
                    }}
                  >
                    {/* Node */}
                    <div 
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-md relative overflow-hidden`}
                      style={{
                        background: isActive 
                          ? `linear-gradient(to bottom right, ${stageData.color.replace('from-', '').replace(' to-', ', ')})`
                          : 'white',
                        color: isActive ? 'white' : '#1E88E5',
                        border: isActive ? 'none' : '1px solid rgba(30, 136, 229, 0.3)'
                      }}
                    >
                      {/* Add subtle animation inside node */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br opacity-80"
                          style={{
                            background: `linear-gradient(to bottom right, ${stageData.color.replace('from-', '').replace(' to-', ', ')})`
                          }}
                          animate={{
                            opacity: [0.7, 0.9, 0.7],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "loop"
                          }}
                        />
                      )}
                      
                      <motion.span
                        animate={isActive ? {
                          scale: [1, 1.15, 1],
                          rotate: [0, 5, 0, -5, 0],
                        } : {}}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "loop"
                        }}
                        className="relative z-10"
                      >
                        {stageData.icon}
                      </motion.span>
                      
                      {/* Animated glow for active node */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: [
                              '0 0 0 0 rgba(30, 136, 229, 0.4)',
                              '0 0 0 10px rgba(30, 136, 229, 0)',
                              '0 0 0 0 rgba(30, 136, 229, 0.4)'
                            ]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop"
                          }}
                        />
                      )}
                    </div>
                    
                    {/* Label - only visible for active node or on hover */}
                    <AnimatePresence>
                      {(isActive || isHovering) && (
                        <motion.div 
                          className="absolute mt-20 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-center w-40"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            boxShadow: isActive ? '0 8px 20px rgba(30, 136, 229, 0.15)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div className="font-medium text-gray-900 text-sm">{stageData.title}</div>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-xs text-gray-600 mt-1"
                            >
                              {stageData.description}
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Controls */}
            <div className="flex justify-center space-x-4 mb-8">
              <motion.button
                className={`px-5 py-2.5 rounded-full flex items-center text-sm font-medium shadow-sm ${
                  isPlaying 
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                    : 'bg-gradient-to-r from-primary-500 to-blue-600 text-white hover:shadow-md hover:from-primary-600 hover:to-blue-700'
                }`}
                onClick={() => setIsPlaying(!isPlaying)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {isPlaying ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pause Animation
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Resume Animation
                  </>
                )}
              </motion.button>
              
              <motion.button
                className="px-5 py-2.5 bg-white text-primary-600 border border-primary-200 rounded-full flex items-center text-sm font-medium shadow-sm hover:bg-gray-50 hover:shadow"
                onClick={() => setStage((stage + 1) % stages.length)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Next Stage
              </motion.button>
            </div>
            
            {/* Current Stage Description */}
            <div className="mt-8 max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100 overflow-hidden"
                  style={{
                    background: `linear-gradient(to bottom right, white, ${stages[stage].color.split(' ')[1].replace('to-', '')}05)`
                  }}
                >
                  <div className="flex items-start">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0`}
                      style={{
                        background: `linear-gradient(to bottom right, ${stages[stage].color.replace('from-', '').replace(' to-', ', ')})`,
                        color: 'white'
                      }}
                    >
                      {stages[stage].icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{stages[stage].title}</h3>
                      
                      {stage === 0 && (
                        <div className="text-gray-700">
                          <p className="mb-3">
                            The cycle begins with <strong>individual community members</strong> contributing content, engaging in discussions, and participating in platform activities. Each action represents a contribution to the collective ecosystem.
                          </p>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg text-sm shadow-inner">
                            <span className="font-medium">Activity Examples:</span>
                            <ul className="mt-1 space-y-1">
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Creating original content (+50 SP)
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Commenting on discussions (+15 SP)
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Referring new members (+500 SP)
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {stage === 1 && (
                        <div className="text-gray-700">
                          <p className="mb-3">
                            The <strong>community acts as an amplifier</strong>, providing feedback, engagement, and support that increases the value and impact of individual contributions. This collective reinforcement creates more value than any single person could achieve alone.
                          </p>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg text-sm shadow-inner">
                            <span className="font-medium">Value Multipliers:</span>
                            <ul className="mt-1 space-y-1">
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Upvotes increase content visibility and value
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Comments add depth and perspective
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Collective knowledge improves individual results
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {stage === 2 && (
                        <div className="text-gray-700">
                          <p className="mb-3">
                            The platform's <strong>rewards system distributes value</strong> back to contributors through Success Points, creating a direct link between community contribution and individual benefit. Contributors are rewarded in proportion to the value they add.
                          </p>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg text-sm shadow-inner">
                            <span className="font-medium">Reward Mechanisms:</span>
                            <ul className="mt-1 space-y-1">
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Points awarded for valuable contributions
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Bonus points for exceptional content
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Achievement badges and status recognition
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {stage === 3 && (
                        <div className="text-gray-700">
                          <p className="mb-3">
                            Success Points can be <strong>converted to SKC tokens</strong>, creating real economic value. This growth fuels further platform development and completes the cycle, allowing for reinvestment into the ecosystem and creating sustainable growth.
                          </p>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg text-sm shadow-inner">
                            <span className="font-medium">Growth Drivers:</span>
                            <ul className="mt-1 space-y-1">
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                100 SP = 1 SKC token conversion
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Token value increases with community growth
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Sustainable ecosystem development
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </GradientBorder>
      </div>
    </div>
  );
};

export default SuccessAmplificationDemo;
