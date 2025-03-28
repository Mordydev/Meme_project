import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ButtonProps {
  theme: 'primary' | 'secondary' | 'outline';
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}

// Button component for CTAs
const Button = ({ theme, href, onClick, children }: ButtonProps) => {
  const baseClasses = "px-6 py-3 rounded-lg font-medium transition";
  
  const themeClasses = {
    primary: "bg-primary text-white hover:bg-primary-600",
    secondary: "bg-secondary text-white hover:bg-secondary-600",
    outline: "bg-white text-primary border border-primary hover:bg-primary-50"
  };
  
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick();
        if (href.startsWith('#')) {
          e.preventDefault();
        }
      }}
      className={`${baseClasses} ${themeClasses[theme]}`}
    >
      {children}
    </a>
  );
};

interface SmartCTAProps {
  viewedCategories: string[];
  searchQuery: string;
  trackCtaClick: (ctaType: string) => void;
}

export const SmartCTA = ({ viewedCategories, searchQuery, trackCtaClick }: SmartCTAProps) => {
  const [primaryCta, setPrimaryCta] = useState('general');
  const [secondaryCta, setSecondaryCta] = useState('community');
  
  // Determine most relevant CTAs based on user behavior
  useEffect(() => {
    let primary = 'general';
    let secondary = 'community';
    
    // Set primary CTA based on viewed categories
    if (viewedCategories.includes('tokens')) {
      primary = 'wallet';
    } else if (viewedCategories.includes('getting-started')) {
      primary = 'signup';
    } else if (viewedCategories.includes('wallet')) {
      primary = 'wallet';
    } else if (viewedCategories.includes('points')) {
      primary = 'points';
    }
    
    // Search query based suggestions
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (query.includes('token') || query.includes('reward')) {
        primary = 'token';
      } else if (query.includes('wallet') || query.includes('connect')) {
        primary = 'wallet';
      } else if (query.includes('help') || query.includes('issue')) {
        primary = 'support';
      } else if (query.includes('point') || query.includes('earn')) {
        primary = 'points';
      } else if (query.includes('start') || query.includes('join')) {
        primary = 'signup';
      }
    }
    
    // Define secondary CTA based on primary
    if (primary === 'wallet' || primary === 'token') {
      secondary = 'learn';
    } else if (primary === 'signup') {
      secondary = 'community';
    } else if (primary === 'points') {
      secondary = 'token';
    } else if (primary === 'general') {
      secondary = 'community';
    } else if (primary === 'support') {
      secondary = 'discord';
    } else {
      secondary = 'community';
    }
    
    // Update state only if different
    if (primary !== primaryCta) setPrimaryCta(primary);
    if (secondary !== secondaryCta && secondary !== primary) {
      setSecondaryCta(secondary);
    }
  }, [viewedCategories, searchQuery, primaryCta, secondaryCta]);
  
  // CTA definitions
  const ctaConfig = {
    general: {
      title: "Ready to Join the Success Kid Community?",
      description: "Create your account and start earning rewards today.",
      buttonText: "Get Started Now",
      buttonUrl: "/join",
      icon: "🏆",
      theme: "primary" as const
    },
    wallet: {
      title: "Connect Your Wallet",
      description: "Link your wallet to start redeeming tokens from your earned points.",
      buttonText: "Connect Wallet",
      buttonUrl: "/dashboard?connect=wallet",
      icon: "💳",
      theme: "primary" as const
    },
    token: {
      title: "Redeem Your Success Points",
      description: "Convert your earned points into SKC tokens that you can use throughout the platform.",
      buttonText: "Redeem Points",
      buttonUrl: "/dashboard/redeem",
      icon: "🪙",
      theme: "primary" as const
    },
    points: {
      title: "Start Earning Success Points",
      description: "Participate in the community to earn points that can be redeemed for tokens.",
      buttonText: "Learn How to Earn",
      buttonUrl: "/community/getting-started",
      icon: "⭐",
      theme: "primary" as const
    },
    signup: {
      title: "Join Success Kid Today",
      description: "Create an account and become part of our growing community.",
      buttonText: "Sign Up Now",
      buttonUrl: "/join",
      icon: "🚀",
      theme: "primary" as const
    },
    support: {
      title: "Need More Help?",
      description: "Our support team is ready to assist you with any questions.",
      buttonText: "Contact Support",
      buttonUrl: "/support",
      icon: "🆘",
      theme: "primary" as const
    },
    community: {
      title: "Join Our Community",
      description: "Connect with other members in our Discord server.",
      buttonText: "Join Discord",
      buttonUrl: "https://discord.gg/successkid",
      icon: "👥",
      theme: "secondary" as const
    },
    learn: {
      title: "Learn About Success Kid",
      description: "Discover the story behind the platform and our vision.",
      buttonText: "Learn More",
      buttonUrl: "/about",
      icon: "📚",
      theme: "outline" as const
    },
    discord: {
      title: "Join Our Discord",
      description: "Connect with the community and get real-time support.",
      buttonText: "Join Discord",
      buttonUrl: "https://discord.gg/successkid",
      icon: "💬",
      theme: "secondary" as const
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-xl border border-primary-100 p-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={primaryCta}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="text-4xl mb-4">{ctaConfig[primaryCta].icon}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {ctaConfig[primaryCta].title}
          </h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            {ctaConfig[primaryCta].description}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              theme={ctaConfig[primaryCta].theme}
              href={ctaConfig[primaryCta].buttonUrl}
              onClick={() => trackCtaClick(primaryCta)}
            >
              {ctaConfig[primaryCta].buttonText}
            </Button>
            
            {primaryCta !== secondaryCta && (
              <Button
                theme="outline"
                href={ctaConfig[secondaryCta].buttonUrl}
                onClick={() => trackCtaClick(secondaryCta)}
              >
                {ctaConfig[secondaryCta].buttonText}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
