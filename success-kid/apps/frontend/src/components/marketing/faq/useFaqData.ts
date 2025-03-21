import { useState, useEffect, useCallback, useMemo } from 'react';

// FAQ data types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  viewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

// Mock data for initial implementation
// In a real application, this would come from an API
const MOCK_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: "What is the Success Kid Community Platform?",
    answer: "The Success Kid Community Platform is a digital ecosystem built around the Success Kid meme and token. It combines a vibrant community with tangible rewards, allowing members to earn Success Points through engagement that can be redeemed for SKC tokens.",
    category: 'general',
    tags: ['platform', 'overview', 'basics'],
    viewCount: 156
  },
  {
    id: 'faq-2',
    question: "How do I earn Success Points (SP)?",
    answer: "You can earn Success Points through various forms of participation including creating content, commenting on posts, receiving upvotes, daily logins, completing challenges, and referring new users. Each activity has a specific point value and daily earning caps.",
    category: 'points',
    tags: ['earn', 'points', 'rewards'],
    viewCount: 243
  },
  {
    id: 'faq-3',
    question: "What is the conversion rate from SP to SKC tokens?",
    answer: "The conversion rate is fixed at 100 SP = 1 SKC token. This fixed rate provides predictability and transparency for users. There is a daily redemption cap of 10,000 SP (100 SKC) per user to manage token supply.",
    category: 'tokens',
    tags: ['conversion', 'tokens', 'points'],
    viewCount: 312
  },
  {
    id: 'faq-4',
    question: "Do I need a crypto wallet to use the platform?",
    answer: "No, you can participate in the community and earn Success Points without a crypto wallet. However, to redeem your SP for SKC tokens or access holder-specific features, you will need to connect a compatible wallet (like Phantom).",
    category: 'wallet',
    tags: ['wallet', 'crypto', 'tokens'],
    viewCount: 189
  },
  {
    id: 'faq-5',
    question: "Is there a mobile app available?",
    answer: "We've designed the platform as a Progressive Web App (PWA) which provides an app-like experience on all devices. This means you can access all features through your mobile browser and even install it to your home screen without needing to download from an app store.",
    category: 'general',
    tags: ['mobile', 'app', 'pwa'],
    viewCount: 97
  },
  {
    id: 'faq-6',
    question: "How is Success Kid different from other meme tokens?",
    answer: "Unlike typical meme coins that rely solely on speculation, Success Kid provides actual utility through our community platform. We focus on sustainable engagement, fair token distribution (50% to the community), and transparent development. Our dual-token economy ensures there's real value behind the meme.",
    category: 'tokens',
    tags: ['comparison', 'utility', 'value'],
    viewCount: 276
  },
  {
    id: 'faq-7',
    question: "What happens to my Success Points if I don't redeem them?",
    answer: "Your Success Points will remain in your account indefinitely. There is no expiration date for SP. However, keep in mind that the redemption rate is fixed, so there's no advantage to holding SP versus converting to tokens, other than managing your redemption timing.",
    category: 'points',
    tags: ['expiration', 'redemption', 'points'],
    viewCount: 154
  },
  {
    id: 'faq-8',
    question: "How can I contact the team with additional questions?",
    answer: "You can reach us through our Discord community, Telegram group, or by sending an email to support@successkid.io. The team is highly active in our community channels and responds to questions promptly.",
    category: 'support',
    tags: ['help', 'contact', 'support'],
    viewCount: 89
  },
  {
    id: 'faq-9',
    question: "Are there any fees for converting Success Points to tokens?",
    answer: "There are no platform fees for converting your Success Points to SKC tokens. However, when transferring tokens from your wallet, standard blockchain network fees will apply. These fees vary based on network congestion and are not controlled by the Success Kid platform.",
    category: 'tokens',
    tags: ['fees', 'conversion', 'tokens'],
    viewCount: 203
  },
  {
    id: 'faq-10',
    question: "How do I get started on the Success Kid platform?",
    answer: "Getting started is easy! Simply create an account, complete your profile, and start engaging with the community. You'll immediately begin earning Success Points for your activities. Check out our getting started guide for a detailed walkthrough of all platform features.",
    category: 'getting-started',
    tags: ['onboarding', 'beginner', 'start'],
    viewCount: 327
  },
  {
    id: 'faq-11',
    question: "What blockchain does Success Kid use?",
    answer: "The Success Kid Community Platform uses the Solana blockchain for its SKC tokens due to Solana's high speed, low transaction costs, and energy efficiency. This ensures a seamless experience when redeeming tokens and participating in token-based activities.",
    category: 'tokens',
    tags: ['blockchain', 'solana', 'technical'],
    viewCount: 142
  },
  {
    id: 'faq-12',
    question: "How do I connect my wallet to the platform?",
    answer: "To connect your wallet, click on the 'Connect Wallet' button in the top-right corner of the navigation menu. We currently support Phantom, Solflare, and other Solana-compatible wallets. Once connected, you'll be able to redeem points for tokens and access holder-only features.",
    category: 'wallet',
    tags: ['connect', 'wallet', 'tokens'],
    viewCount: 231
  },
  {
    id: 'faq-13',
    question: "Is there a limit to how many Success Points I can earn?",
    answer: "While there's no overall cap on how many Success Points you can accumulate, there are daily limits for different activities to ensure fair distribution. For example, you can earn up to 100 SP from comments per day, 500 SP from posts, and 50 SP from daily logins.",
    category: 'points',
    tags: ['limits', 'earn', 'points'],
    viewCount: 186
  },
  {
    id: 'faq-14',
    question: "What happens if I lose access to my connected wallet?",
    answer: "If you lose access to your connected wallet, your Success Points will remain safe in your account. However, any SKC tokens in that wallet would need to be recovered using your wallet's recovery methods (typically a seed phrase). We recommend keeping secure backups of your wallet recovery information.",
    category: 'wallet',
    tags: ['security', 'recovery', 'access'],
    viewCount: 113
  },
  {
    id: 'faq-15',
    question: "Can I earn Success Points from other users' actions?",
    answer: "Yes, you can earn Success Points when others interact with your content. For example, when your posts or comments receive upvotes, you earn additional SP. This encourages creating valuable content that resonates with the community.",
    category: 'points',
    tags: ['earn', 'interaction', 'community'],
    viewCount: 167
  },
  {
    id: 'faq-16',
    question: "Are there any special benefits for token holders?",
    answer: "Yes, SKC token holders receive several benefits including governance voting rights, access to exclusive platform features, boosted point earning rates, special profile badges, and priority for new feature access. The more tokens you hold, the greater your benefits.",
    category: 'tokens',
    tags: ['benefits', 'holders', 'advantages'],
    viewCount: 296
  }
];

const CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'All Topics',
    icon: '🔍',
    count: MOCK_FAQS.length
  },
  {
    id: 'general',
    name: 'General',
    icon: 'ℹ️',
    count: MOCK_FAQS.filter(faq => faq.category === 'general').length
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: '🚀',
    count: MOCK_FAQS.filter(faq => faq.category === 'getting-started').length
  },
  {
    id: 'points',
    name: 'Success Points',
    icon: '⭐',
    count: MOCK_FAQS.filter(faq => faq.category === 'points').length
  },
  {
    id: 'tokens',
    name: 'SKC Tokens',
    icon: '🪙',
    count: MOCK_FAQS.filter(faq => faq.category === 'tokens').length
  },
  {
    id: 'wallet',
    name: 'Wallet',
    icon: '💳',
    count: MOCK_FAQS.filter(faq => faq.category === 'wallet').length
  },
  {
    id: 'support',
    name: 'Support',
    icon: '🆘',
    count: MOCK_FAQS.filter(faq => faq.category === 'support').length
  }
];

// Simulate an API fetch delay
const fetchFaqData = () => {
  return new Promise<{ items: FAQ[], categories: Category[] }>((resolve) => {
    setTimeout(() => {
      resolve({
        items: MOCK_FAQS,
        categories: CATEGORIES
      });
    }, 500);
  });
};

// Custom hook for accessing FAQ data
export const useFaqData = () => {
  const [faqData, setFaqData] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Track question view for analytics
  const trackQuestionView = useCallback(async (questionId: string) => {
    try {
      // In a real implementation, this would call an analytics API
      console.log('Tracking question view:', questionId);
      
      // Optimistically update local view count
      setFaqData(current => 
        current.map(item => 
          item.id === questionId 
            ? { ...item, viewCount: (item.viewCount || 0) + 1 } 
            : item
        )
      );
    } catch (err) {
      console.error('Error tracking question view:', err);
    }
  }, []);

  // Add to search history
  const addToSearchHistory = useCallback((query: string) => {
    if (!query.trim() || searchHistory.includes(query.trim())) return;
    
    setSearchHistory(prev => {
      const newHistory = [query.trim(), ...prev];
      // Keep only the last 5 searches
      return newHistory.slice(0, 5);
    });
  }, [searchHistory]);
  
  // Load FAQ data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchFaqData();
        setFaqData(response.items);
        setCategories(response.categories);
        setLoading(false);
      } catch (err) {
        setError('Failed to load FAQ data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Get popular questions based on view count
  const getPopularQuestions = useCallback((limit = 5) => {
    return [...faqData]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, limit);
  }, [faqData]);
  
  // Search FAQ data
  const searchFaqs = useCallback((query: string) => {
    if (!query?.trim()) return faqData;
    
    const searchTerms = query.toLowerCase().split(' ');
    return faqData.filter(item => {
      const questionText = item.question.toLowerCase();
      const answerText = item.answer.toLowerCase();
      const tags = item.tags?.join(' ').toLowerCase() || '';
      const combinedText = `${questionText} ${answerText} ${tags}`;
      
      return searchTerms.some(term => combinedText.includes(term));
    });
  }, [faqData]);
  
  return {
    faqData,
    categories,
    loading,
    error,
    searchHistory,
    trackQuestionView,
    getPopularQuestions,
    searchFaqs,
    addToSearchHistory
  };
};
