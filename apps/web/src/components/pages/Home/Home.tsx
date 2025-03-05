import React, { useState, useEffect, useRef } from 'react';
import { Typography } from '../../atoms/Typography';
import { Button } from '../../atoms/Button';

// Define types for our data
interface MarketData {
  marketCap: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  avgVolume: number;
}

interface CommunityStats {
  totalUsers: number;
  totalPosts: number;
  activeUsers: number;
}

interface FeatureBenefit {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  imageUrl: string;
}

interface ActionButton {
  label: string;
  onClick: () => void;
}

// Mock data (to be replaced with real API calls)
const marketData: MarketData = {
  marketCap: 28500000,
  price: 0.000235,
  priceChange24h: 5.6,
  volume24h: 1250000,
  holders: 12500,
  avgVolume: 980000
};

const communityStats: CommunityStats = {
  totalUsers: 25000,
  totalPosts: 85000,
  activeUsers: 5200
};

const platformFeatures: FeatureBenefit[] = [
  {
    id: 'community',
    name: 'Community Building',
    description: 'Connect with other Success Kid enthusiasts in our vibrant, supportive community.',
    benefits: [
      'Create and share content with fellow enthusiasts',
      'Join discussions on token growth and opportunities',
      'Participate in community governance decisions'
    ],
    imageUrl: '/images/features/community.png'
  },
  {
    id: 'token',
    name: 'Token Utilities',
    description: 'Experience the full potential of the Success Kid token with our integrated wallet and trading features.',
    benefits: [
      'Track your token performance in real-time',
      'Access exclusive platform features with token holdings',
      'Participate in token staking and rewards'
    ],
    imageUrl: '/images/features/token.png'
  },
  {
    id: 'rewards',
    name: 'Achievement Rewards',
    description: 'Earn rewards for your contributions and achievements within the Success Kid ecosystem.',
    benefits: [
      'Earn tokens for creating quality content',
      'Unlock badges and status for community contributions',
      'Access exclusive events and opportunities'
    ],
    imageUrl: '/images/features/rewards.png'
  }
];

// Format number with commas
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format currency with appropriate notation
const formatCurrency = (amount: number): string => {
  if (amount < 0.01) {
    return '$' + amount.toFixed(6);
  } else if (amount < 1) {
    return '$' + amount.toFixed(4);
  } else if (amount < 1000) {
    return '$' + amount.toFixed(2);
  } else if (amount < 1000000) {
    return '$' + (amount / 1000).toFixed(1) + 'K';
  } else {
    return '$' + (amount / 1000000).toFixed(1) + 'M';
  }
};

// Hero Section Component
interface HeroSectionProps {
  marketCap: number;
  tokenPrice: number;
  priceChangePercent: number;
  onGetStartedClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  marketCap, 
  tokenPrice, 
  priceChangePercent, 
  onGetStartedClick 
}) => {
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <Typography variant="h1" weight="bold" className="mb-6 text-5xl md:text-6xl">
            Success Kid: From Meme to Thriving Community
          </Typography>
          <Typography variant="body" color="muted" className="max-w-2xl mx-auto mb-8 text-lg">
            Join the community that's transforming a viral meme into a sustainable digital ecosystem with real utility and engagement.
          </Typography>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button size="lg" onClick={onGetStartedClick}>Join Community</Button>
            <Button size="lg" variant="secondary">Learn More</Button>
          </div>
          
          {/* Market Snapshot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
            <div className="text-center p-2">
              <Typography variant="body-sm" color="muted" className="mb-1">Token Price</Typography>
              <Typography variant="body" weight="bold">{formatCurrency(tokenPrice)}</Typography>
              <Typography 
                variant="caption" 
                color={priceChangePercent >= 0 ? "success" : "error"}
              >
                {priceChangePercent >= 0 ? '↑' : '↓'} {Math.abs(priceChangePercent)}%
              </Typography>
            </div>
            <div className="text-center p-2">
              <Typography variant="body-sm" color="muted" className="mb-1">Market Cap</Typography>
              <Typography variant="body" weight="bold">{formatCurrency(marketCap)}</Typography>
            </div>
            <div className="text-center p-2">
              <Typography variant="body-sm" color="muted" className="mb-1">Holders</Typography>
              <Typography variant="body" weight="bold">{formatNumber(marketData.holders)}</Typography>
            </div>
            <div className="text-center p-2">
              <Typography variant="body-sm" color="muted" className="mb-1">24h Volume</Typography>
              <Typography variant="body" weight="bold">{formatCurrency(marketData.volume24h)}</Typography>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Feature Showcase Component
interface FeatureShowcaseProps {
  features: FeatureBenefit[];
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ features }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <Typography variant="h2" weight="bold" className="text-center mb-8">
          More Than Just Another Meme Token
        </Typography>
        <Typography variant="body" color="muted" className="text-center max-w-2xl mx-auto mb-12">
          Success Kid combines community engagement with real utility, offering a complete ecosystem for members.
        </Typography>
        
        {/* Feature tabs */}
        <div className="flex flex-wrap justify-center mb-12">
          {features.map((feature, index) => (
            <button
              key={feature.id}
              className={`px-5 py-2 mx-2 mb-2 rounded-full text-sm font-medium transition
                ${activeFeature === index 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
              onClick={() => setActiveFeature(index)}
            >
              {feature.name}
            </button>
          ))}
        </div>
        
        {/* Active feature display */}
        <div className="md:flex items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <Typography variant="h3" weight="bold" className="mb-4">
              {features[activeFeature].name}
            </Typography>
            <Typography variant="body" color="muted" className="mb-6">
              {features[activeFeature].description}
            </Typography>
            <ul className="space-y-3">
              {features[activeFeature].benefits.map((benefit: string) => (
                <li key={benefit} className="flex items-start">
                  <svg className="h-6 w-6 text-primary flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <Typography variant="body">{benefit}</Typography>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-1/2 md:pl-12">
            <div className="bg-gray-200 rounded-lg shadow-xl aspect-video flex items-center justify-center">
              <Typography variant="body" color="muted">Feature Image Placeholder</Typography>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Animated Counter Component
interface AnimatedCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  label, 
  prefix = '', 
  suffix = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const counterRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = 0;
          const increment = value / 50;
          const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
              setDisplayValue(value);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(start));
            }
          }, 20);
          
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (counterRef.current) {
      observer.observe(counterRef.current);
    }
    
    return () => observer.disconnect();
  }, [value]);
  
  return (
    <div className="text-center p-6">
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2" ref={counterRef}>
        {prefix}{formatNumber(displayValue)}{suffix}
      </div>
      <Typography variant="body-sm" color="muted" className="uppercase tracking-wide">{label}</Typography>
    </div>
  );
};

// Statistics Section Component
interface StatisticsSectionProps {
  userCount: number;
  postCount: number;
  tokenHolders: number;
  avgDailyVolume: number;
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ 
  userCount, 
  postCount, 
  tokenHolders, 
  avgDailyVolume 
}) => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <Typography variant="h2" weight="bold" className="text-center mb-8">
          Our Growing Ecosystem
        </Typography>
        <Typography variant="body" color="muted" className="text-center max-w-2xl mx-auto mb-12">
          Success Kid is quickly establishing itself as a leading community-driven platform
        </Typography>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedCounter value={userCount} label="Community Members" />
          <AnimatedCounter value={postCount} label="Total Posts" />
          <AnimatedCounter value={tokenHolders} label="Token Holders" />
          <AnimatedCounter value={avgDailyVolume} label="Avg. Daily Volume" prefix="$" />
        </div>
        
        <div className="mt-16 bg-white p-6 rounded-lg shadow-md">
          <Typography variant="h3" weight="bold" className="mb-6 text-center">
            Token Performance Milestones
          </Typography>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <Typography variant="body-sm" weight="semibold" className="inline-block">
                  Road to $50M Market Cap
                </Typography>
              </div>
              <div className="text-right">
                <Typography variant="body-sm" weight="semibold" className="inline-block text-primary">
                  {Math.round((marketData.marketCap / 50000000) * 100)}%
                </Typography>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
              <div style={{ width: `${(marketData.marketCap / 50000000) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Token Info Section Component
interface TokenInfoSectionProps {
  price: number;
  marketCap: number;
  volume: number;
  holders: number;
}

const TokenInfoSection: React.FC<TokenInfoSectionProps> = ({ 
  price, 
  marketCap, 
  volume, 
  holders 
}) => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 to-primary-900 text-white">
      <div className="container mx-auto px-4">
        <Typography variant="h2" weight="bold" className="text-center mb-8">
          Success Kid Token
        </Typography>
        <Typography variant="body" className="text-center max-w-2xl mx-auto mb-12 text-white/80">
          Our native token powers the entire Success Kid ecosystem, providing utility and governance rights
        </Typography>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <Typography variant="body-sm" className="text-white/70 mb-2">Current Price</Typography>
            <Typography variant="h3" weight="bold">{formatCurrency(price)}</Typography>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <Typography variant="body-sm" className="text-white/70 mb-2">Market Cap</Typography>
            <Typography variant="h3" weight="bold">{formatCurrency(marketCap)}</Typography>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <Typography variant="body-sm" className="text-white/70 mb-2">24h Volume</Typography>
            <Typography variant="h3" weight="bold">{formatCurrency(volume)}</Typography>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <Typography variant="body-sm" className="text-white/70 mb-2">Holders</Typography>
            <Typography variant="h3" weight="bold">{formatNumber(holders)}</Typography>
          </div>
        </div>
        
        <div className="text-center">
          <Button variant="secondary" size="lg" className="mr-4">View on Etherscan</Button>
          <Button variant="ghost" size="lg" className="border-white text-white hover:bg-white/10">Buy Token</Button>
        </div>
      </div>
    </section>
  );
};

// Call to Action Section Component
interface CallToActionSectionProps {
  heading: string;
  description: string;
  primaryAction: ActionButton;
  secondaryAction?: ActionButton;
  background?: 'gradient' | 'light' | 'dark';
}

const CallToActionSection: React.FC<CallToActionSectionProps> = ({ 
  heading, 
  description, 
  primaryAction, 
  secondaryAction, 
  background = 'gradient' 
}) => {
  const backgroundClass = {
    gradient: 'bg-gradient-to-r from-primary to-primary-600 text-white',
    light: 'bg-gray-50 text-gray-900',
    dark: 'bg-gray-900 text-white'
  }[background];
  
  return (
    <section className={`py-16 ${backgroundClass}`}>
      <div className="container mx-auto px-4 text-center">
        <Typography variant="h2" weight="bold" className="mb-4 max-w-3xl mx-auto">
          {heading}
        </Typography>
        <Typography variant="body" className="mb-8 max-w-2xl mx-auto opacity-90">
          {description}
        </Typography>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            variant="primary"
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
          
          {secondaryAction && (
            <Button 
              size="lg" 
              variant="secondary"
              className={background !== 'light' ? 'border-white text-white hover:bg-white/10' : ''}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

// Main Landing Page Component
const Home: React.FC = () => {
  const handleGetStarted = () => {
    // Navigate to registration page
    window.location.href = '/sign-up';
  };
  
  const handleLearnMore = () => {
    // Scroll to features section
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div className="landing-page space-y-0">
      {/* Hero Section */}
      <HeroSection 
        marketCap={marketData.marketCap}
        tokenPrice={marketData.price}
        priceChangePercent={marketData.priceChange24h}
        onGetStartedClick={handleGetStarted}
      />
      
      {/* Feature Showcase */}
      <div id="features">
        <FeatureShowcase features={platformFeatures} />
      </div>
      
      {/* Statistics Section */}
      <StatisticsSection 
        userCount={communityStats.totalUsers}
        postCount={communityStats.totalPosts}
        tokenHolders={marketData.holders}
        avgDailyVolume={marketData.avgVolume}
      />
      
      {/* Mid-page CTA */}
      <CallToActionSection
        heading="Join the Success Kid Community Today"
        description="Be part of a growing community of enthusiasts building the future together."
        primaryAction={{
          label: "Create Account",
          onClick: handleGetStarted
        }}
        secondaryAction={{
          label: "Learn More",
          onClick: handleLearnMore
        }}
        background="gradient"
      />
      
      {/* Token Information */}
      <TokenInfoSection 
        price={marketData.price}
        marketCap={marketData.marketCap}
        volume={marketData.volume24h}
        holders={marketData.holders}
      />
      
      {/* Final CTA */}
      <CallToActionSection
        heading="Ready to Experience Success?"
        description="It takes just 60 seconds to create your account and join our community."
        primaryAction={{
          label: "Sign Up Now",
          onClick: handleGetStarted
        }}
        secondaryAction={{
          label: "Connect Wallet",
          onClick: () => window.location.href = '/connect-wallet'
        }}
        background="light"
      />
    </div>
  );
};

export default Home; 