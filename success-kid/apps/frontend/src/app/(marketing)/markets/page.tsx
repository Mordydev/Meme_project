'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GlassCard, 
  UniversalGlow, 
  AnimatedBackground, 
  PremiumButton,
  ClientSideParticles 
} from '@/components/ui/optimized';
import { StaggeredTitle } from '@/components/marketing/shared/StaggeredTitle';
import { 
  TokenomicsVisualization, 
  MilestoneTracker, 
  TransactionFeed, 
  TokenUtilitySection
} from '@/components/marketing/market';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for development - will be replaced with API calls
const generateMockPriceData = () => {
  const data = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate some realistic looking price movements
    const basePrice = 0.0015;
    const randomFactor = Math.sin(i * 0.5) * 0.0005 + (Math.random() * 0.0002);
    const price = basePrice + randomFactor;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: price,
    });
  }
  return data;
};

export default function MarketsPage() {
  // Page section state
  const [activeSection, setActiveSection] = useState('overview');
  
  // Market data state
  const [marketData, setMarketData] = useState({
    currentPrice: 0.0018,
    priceChange24h: 5.26,
    marketCap: 420000,
    volume24h: 78500,
    holders: 3200,
    chartData: generateMockPriceData(),
    currentMilestone: 2, // 0-indexed, milestone 3 (representing $500K)
  });
  
  // Mock function to simulate data updates - replace with real API call
  useEffect(() => {
    const interval = setInterval(() => {
      const priceChange = (Math.random() - 0.45) * 0.5; // Slightly biased toward positive
      const newPrice = marketData.currentPrice * (1 + priceChange/100);
      
      setMarketData(prev => ({
        ...prev,
        currentPrice: newPrice,
        priceChange24h: prev.priceChange24h + (Math.random() - 0.45),
        volume24h: prev.volume24h + (Math.random() - 0.5) * 1000,
        marketCap: prev.marketCap + (Math.random() - 0.4) * 2000,
      }));
    }, 15000);
    
    return () => clearInterval(interval);
  }, [marketData]);
  
  // Format currency with appropriate precision
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 0.01 ? 6 : value < 1 ? 4 : 2,
      maximumFractionDigits: value < 0.01 ? 6 : value < 1 ? 4 : 2,
    }).format(value);
  };
  
  // Format large numbers with K, M, B suffixes
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-primary font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-50/40 via-gray-50 to-secondary-50/40">
      {/* Enhanced background particles and glows */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatedBackground 
          type="particles" 
          primaryColor="from-primary/20" 
          secondaryColor="to-secondary/20" 
          intensity="light"
          className="z-0" 
        />
        
        {/* Multiple strategically placed glows */}
        <div className="absolute top-40 left-1/4 -translate-x-1/2 z-0">
          <UniversalGlow
            color="primary"
            size="xl"
            intensity="light"
            animation="pulse"
          />
        </div>
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 z-0">
          <UniversalGlow
            color="secondary"
            size="lg"
            intensity="light"
            animation="breathe"
          />
        </div>
        <div className="absolute bottom-1/4 left-1/3 z-0">
          <UniversalGlow
            color="accent"
            size="lg"
            intensity="light"
            animation="pulse"
          />
        </div>
        <div className="absolute bottom-60 right-1/3 z-0">
          <UniversalGlow
            color="primary"
            size="xl"
            intensity="light"
            animation="breathe"
          />
        </div>
        
        {/* Animated gradient overlay for extra depth */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary-50/10 via-transparent to-secondary-50/10 z-0"
          animate={{
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Enhanced Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <div className="inline-block px-4 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium mb-4 shadow-sm">
              SKC Token
            </div>
            
            <StaggeredTitle
              text="Real-Time Market"
              highlightedText="Data & Insights"
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              gradient={true}
              gradientFrom="from-primary-600"
              gradientTo="to-secondary-600"
            />
            
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Transparent metrics, milestone tracking, and tokenomics for the Success Kid Community token.
            </p>
          </motion.div>
          
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-10">
            <div className="bg-white/80 backdrop-blur-md rounded-full p-1.5 shadow-lg border border-gray-200/50">
              {[
                { id: 'overview', label: 'Market Overview', icon: '📊' },
                { id: 'tokenomics', label: 'Tokenomics', icon: '💰' },
                { id: 'milestones', label: 'Milestones', icon: '🏆' },
                { id: 'transactions', label: 'Transactions', icon: '📝' }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300"
                >
                  {activeSection === section.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-primary-50 to-white rounded-full shadow-md z-0 border border-primary-200/30"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      initial={{ opacity: 0.8 }}
                      animate={{ 
                        opacity: 1,
                        boxShadow: ['0 4px 6px -1px rgba(0, 0, 0, 0.1)', '0 4px 12px -1px rgba(0, 0, 0, 0.15)', '0 4px 6px -1px rgba(0, 0, 0, 0.1)'],
                      }}
                      transition={{ 
                        opacity: { duration: 0.3 },
                        boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                      }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center ${activeSection === section.id ? 'text-primary-700' : 'text-gray-600 hover:text-gray-900'}`}>
                    <span className="mr-1.5">{section.icon}</span>
                    {section.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Market Overview Section */}
          <AnimatePresence mode="wait">
            {activeSection === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Market Stats Cards */}
                  <div className="lg:col-span-1">
                    <div className="grid grid-cols-1 gap-5">
                      {/* Current Price Card */}
                      <GlassCard
                        hoverEffect={true}
                        glassBlur="md"
                        border={true}
                        borderGlow={true}
                        gradientBackground={true}
                        gradientColors="from-primary/10 via-white/90 to-secondary/10"
                        className="p-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Price</h3>
                        <div className="flex items-end">
                          <AnimatePresence mode="popLayout">
                            <motion.div
                              key={marketData.currentPrice.toString()}
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              transition={{ duration: 0.3 }}
                              className="text-3xl font-bold text-gray-900"
                            >
                              {formatCurrency(marketData.currentPrice)}
                            </motion.div>
                          </AnimatePresence>
                          
                          <AnimatePresence mode="popLayout">
                            <motion.div
                              key={marketData.priceChange24h.toString()}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.3 }}
                              className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                                marketData.priceChange24h >= 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {marketData.priceChange24h >= 0 ? '+' : ''}
                              {marketData.priceChange24h.toFixed(2)}%
                            </motion.div>
                          </AnimatePresence>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">24h Change</p>
                      </GlassCard>
                      
                      {/* Market Cap Card */}
                      <GlassCard
                        hoverEffect={true}
                        glassBlur="md"
                        border={true}
                        borderGlow={true}
                        gradientBackground={true}
                        gradientColors="from-secondary/10 via-white/90 to-primary/10"
                        className="p-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Market Cap</h3>
                        <div className="flex items-end">
                          <AnimatePresence mode="popLayout">
                            <motion.div
                              key={marketData.marketCap.toString()}
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              transition={{ duration: 0.3 }}
                              className="text-3xl font-bold text-gray-900"
                            >
                              ${formatLargeNumber(marketData.marketCap)}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Next milestone: $500K</p>
                      </GlassCard>
                      
                      {/* Volume & Holders Card */}
                      <GlassCard
                        hoverEffect={true}
                        glassBlur="md"
                        border={true}
                        borderGlow={true}
                        gradientBackground={true}
                        gradientColors="from-accent/10 via-white/90 to-secondary/10"
                        className="p-6"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-base font-semibold text-gray-700 mb-1">24h Volume</h3>
                            <AnimatePresence mode="popLayout">
                              <motion.div
                                key={marketData.volume24h.toString()}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.3 }}
                                className="text-xl font-bold text-gray-900"
                              >
                                ${formatLargeNumber(marketData.volume24h)}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-700 mb-1">Holders</h3>
                            <div className="text-xl font-bold text-gray-900">
                              {formatLargeNumber(marketData.holders)}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                      
                      {/* Buy Button */}
                      <div className="mt-2">
                        <PremiumButton
                          variant="gradient"
                          size="lg"
                          gradientColors="from-primary via-primary-600 to-primary-700"
                          effects={{
                            shine: true,
                            glow: true,
                            pulse: false,
                            particles: true
                          }}
                          className="w-full shadow-lg"
                          href="https://raydium.io/swap/"
                        >
                          Buy SKC
                        </PremiumButton>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Chart */}
                  <div className="lg:col-span-2">
                    <GlassCard
                      hoverEffect={true}
                      glassBlur="md"
                      border={true}
                      borderGlow={true}
                      gradientBackground={true}
                      gradientColors="from-primary/10 via-white/90 to-secondary/10"
                      className="p-6 h-full"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Price History</h3>
                        
                        <div className="flex space-x-2">
                          {['1D', '1W', '1M', 'All'].map((period) => (
                            <button
                              key={period}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                period === '1M' 
                                  ? 'bg-primary text-white shadow-sm' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {period}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={marketData.chartData}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#1E88E5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }} 
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                              }}
                            />
                            <YAxis 
                              domain={['dataMin', 'dataMax']} 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => formatCurrency(value)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="price" 
                              stroke="#1E88E5" 
                              fillOpacity={1}
                              fill="url(#colorPrice)" 
                              animationDuration={1000}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </div>
                </div>
                
                {/* Token Utility Overview */}
                <div className="mt-16">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Token Utility</h2>
                    <p className="text-gray-700 max-w-2xl mx-auto">
                      The Success Kid token (SKC) provides real utility beyond simple speculation, creating lasting value for holders and community members.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      {
                        title: 'Community Rewards',
                        icon: '🏆',
                        description: 'Earn tokens for quality content and meaningful engagement within the platform.',
                        color: 'bg-primary-50 border-primary-200'
                      },
                      {
                        title: 'Holder Status',
                        icon: '⭐',
                        description: 'Unlock exclusive features and enhanced visibility with token holdings.',
                        color: 'bg-secondary-50 border-secondary-200'
                      },
                      {
                        title: 'Future Governance',
                        icon: '🏛️',
                        description: 'Participate in platform decisions with community governance rights.',
                        color: 'bg-accent-50 border-accent-200'
                      },
                      {
                        title: 'Growing Ecosystem',
                        icon: '🌐',
                        description: 'Benefit from expanding use cases and platform integrations.',
                        color: 'bg-primary-50 border-primary-200'
                      }
                    ].map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={`rounded-xl p-6 border ${item.color} shadow-sm`}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <div className="text-3xl mb-3">{item.icon}</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-700">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 text-center"
                >
                  <GlassCard
                    className="inline-block p-6 text-center max-w-2xl mx-auto"
                    border={true}
                    borderGlow={true}
                    hoverEffect={true}
                    gradientBackground={true}
                    gradientColors="from-primary/10 via-white/90 to-secondary/10"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Learn More About Tokenomics</h3>
                    <p className="text-gray-700 mb-6">
                      Discover the transparent token distribution, Success Points system, and community-focused economics behind SKC.
                    </p>
                    <motion.button
                      className="px-6 py-3 bg-gradient-to-r from-primary to-primary-600 text-white font-semibold rounded-md shadow-md"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSection('tokenomics')}
                    >
                      Explore Tokenomics
                    </motion.button>
                  </GlassCard>
                </motion.div>
              </motion.div>
            )}
            
            {/* Tokenomics Section */}
            {activeSection === 'tokenomics' && (
              <motion.div
                key="tokenomics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mb-16"
              >
                <div className="max-w-5xl mx-auto">
                  <TokenomicsVisualization className="mb-10 shadow-xl" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <GlassCard
                      className="p-6"
                      border={true}
                      borderGlow={true}
                      hoverEffect={true}
                      gradientBackground={true}
                      gradientColors="from-primary/10 via-white/90 to-secondary/10"
                    >
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Success Points (SP) System</h2>
                      <p className="text-gray-700 mb-4">
                        Platform activity is rewarded with Success Points (SP), which can be redeemed for SKC tokens:
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">Earning SP:</span> Users earn points for creating content, engaging with posts, referring new users, and completing challenges
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">Point Tiers:</span> Activities are weighted based on value contribution (e.g., original content earns more than likes)
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">Redemption Rate:</span> 100 SP = 1 SKC, with a daily cap (10,000 SP/user) to manage supply flow
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">Dashboard:</span> Clear UI showing SP balance, redemption history, and leaderboard rank
                          </span>
                        </li>
                      </ul>
                    </GlassCard>
                    
                    <GlassCard
                      className="p-6"
                      border={true}
                      borderGlow={true}
                      hoverEffect={true}
                      gradientBackground={true}
                      gradientColors="from-secondary/10 via-white/90 to-primary/10"
                    >
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Anti-Inflation Mechanisms</h2>
                      <p className="text-gray-700 mb-4">
                        To maintain token economy sustainability, we've implemented multiple protection mechanisms:
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">Daily Redemption Caps:</span> Maximum 10,000 SP (100 SKC) per user per day to prevent mass token generation
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">Activity Verification:</span> Automated and manual verification of legitimate engagement to prevent gaming the system
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">Quality Filters:</span> Points weighted by content quality and engagement patterns to reward genuine value creation
                          </span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">
                            <span className="font-semibold">Gradual Release:</span> Controlled token distribution over 12-month schedule to prevent market flooding
                          </span>
                        </li>
                      </ul>
                    </GlassCard>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        title: 'Limited Supply',
                        icon: '📊',
                        description: '7 billion total SKC tokens with no inflation, ensuring long-term value preservation.',
                        color: 'border-primary-200 bg-primary-50'
                      },
                      {
                        title: 'Transparent Distribution',
                        icon: '🔍',
                        description: 'Fully verifiable on-chain distribution with detailed allocation schedules.',
                        color: 'border-secondary-200 bg-secondary-50'
                      },
                      {
                        title: 'Community Value',
                        icon: '🌱',
                        description: 'Token utility grows with community engagement through the dual-token economy.',
                        color: 'border-accent-200 bg-accent-50'
                      }
                    ].map((item, i) => (
                      <motion.div 
                        key={item.title}
                        className={`rounded-lg p-6 border shadow-sm ${item.color}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="text-3xl mb-3">{item.icon}</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-700">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Tokenomics CTA Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                  >
                    <TokenUtilitySection className="mt-12" />
                  </motion.div>
                </div>
              </motion.div>
            )}
            
            {/* Milestones Section */}
            {activeSection === 'milestones' && (
              <motion.div
                key="milestones"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Milestone Tracker
                      </h2>
                      
                      <p className="text-lg text-gray-700">
                        We've established clear market cap milestones to track our growth journey. Each milestone unlocks new features, benefits, and opportunities for our community.
                      </p>
                    </div>
                    
                    <MilestoneTracker />
                  </div>
                  
                  <div>
                    <GlassCard
                      hoverEffect={true}
                      border={true}
                      borderGlow={true}
                      className="p-6 h-full"
                      gradientBackground={true}
                      gradientColors="from-primary/10 via-white/90 to-secondary/10"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Milestone Benefits</h3>
                      
                      <div className="space-y-6">
                        {[
                          {
                            milestone: "$100K",
                            status: "Achieved",
                            benefits: [
                              "Initial liquidity establishment",
                              "Core community features launch",
                              "Community rewards activation"
                            ],
                            icon: "🚀"
                          },
                          {
                            milestone: "$500K",
                            status: "In Progress",
                            benefits: [
                              "Enhanced content creation tools",
                              "Expanded reward system",
                              "Partnerships with creators and influencers"
                            ],
                            icon: "🌱"
                          },
                          {
                            milestone: "$1M",
                            status: "Upcoming",
                            benefits: [
                              "Advanced analytics dashboard",
                              "NFT integration exploration",
                              "Community governance introduction"
                            ],
                            icon: "📈"
                          },
                          {
                            milestone: "$10M",
                            status: "Future",
                            benefits: [
                              "Major exchange listings",
                              "Cross-chain functionality",
                              "Expanded ecosystem integrations"
                            ],
                            icon: "🌍"
                          }
                        ].map((item) => (
                          <div key={item.milestone} className="flex">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 mr-4">
                              {item.icon}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <h4 className="text-lg font-semibold text-gray-900">{item.milestone}</h4>
                                {item.status === "Achieved" && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                    Achieved
                                  </span>
                                )}
                                {item.status === "In Progress" && (
                                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-800 rounded text-xs font-medium">
                                    In Progress
                                  </span>
                                )}
                              </div>
                              <ul className="mt-2 space-y-1">
                                {item.benefits.map((benefit, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="text-primary mr-2">•</span>
                                    <span className="text-gray-700">{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <motion.div
                        className="mt-8 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <p className="text-gray-700">
                          <span className="font-semibold">Community Impact:</span> Each milestone we achieve unlocks new opportunities for the entire Success Kid community and increases the utility of your SKC tokens.
                        </p>
                      </motion.div>
                    </GlassCard>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Transactions Section */}
            {activeSection === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Real-Time Transaction Feed
                  </h2>
                  
                  <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                    Watch SKC token transactions as they happen on the blockchain. Complete transparency is a core value of our platform.
                  </p>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  <TransactionFeed className="shadow-xl" />
                  
                  <GlassCard
                    className="mt-10 p-6 border border-gray-100"
                    hoverEffect={true}
                    gradientBackground={true}
                    gradientColors="from-primary/10 via-white/90 to-secondary/10"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Why Transparency Matters</h3>
                    <p className="text-gray-700">
                      The Success Kid Community Platform is built on complete transparency. From token distribution to market activity, we believe in giving our community members full visibility into all aspects of the ecosystem. This builds trust and allows everyone to make informed decisions.
                    </p>
                  </GlassCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-primary-700 relative overflow-hidden">
        {/* Enhanced background effects */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 opacity-80"
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
        
        {/* Particle effects */}
        <ClientSideParticles 
          count={20} 
          colorClass="bg-white/10" 
          animationDuration={10} 
        />
        
        {/* Border glow effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Join the Success Kid Journey
              </h2>
              
              <p className="text-xl text-white/90 mb-8">
                Be part of a community-driven token ecosystem that rewards engagement, builds real utility, and creates lasting value for all members.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <motion.a
                  href="/sign-up"
                  className="inline-block py-3 px-8 bg-white text-primary-700 font-semibold rounded-md shadow-md"
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3)'
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Join Our Community
                </motion.a>
                
                <motion.a
                  href="https://raydium.io/swap/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-3 px-8 bg-transparent text-white font-semibold rounded-md border border-white/40"
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    borderColor: 'rgba(255, 255, 255, 0.8)'
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Buy SKC Tokens
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
