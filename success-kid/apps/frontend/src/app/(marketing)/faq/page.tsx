'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

// FAQ data
const faqs = [
  {
    question: "What is the Success Kid Community Platform?",
    answer: "The Success Kid Community Platform is a digital ecosystem built around the Success Kid meme and token. It combines a vibrant community with tangible rewards, allowing members to earn Success Points through engagement that can be redeemed for SKC tokens."
  },
  {
    question: "How do I earn Success Points (SP)?",
    answer: "You can earn Success Points through various forms of participation including creating content, commenting on posts, receiving upvotes, daily logins, completing challenges, and referring new users. Each activity has a specific point value and daily earning caps."
  },
  {
    question: "What is the conversion rate from SP to SKC tokens?",
    answer: "The conversion rate is fixed at 100 SP = 1 SKC token. This fixed rate provides predictability and transparency for users. There is a daily redemption cap of 10,000 SP (100 SKC) per user to manage token supply."
  },
  {
    question: "Do I need a crypto wallet to use the platform?",
    answer: "No, you can participate in the community and earn Success Points without a crypto wallet. However, to redeem your SP for SKC tokens or access holder-specific features, you will need to connect a compatible wallet (like Phantom)."
  },
  {
    question: "Is there a mobile app available?",
    answer: "We've designed the platform as a Progressive Web App (PWA) which provides an app-like experience on all devices. This means you can access all features through your mobile browser and even install it to your home screen without needing to download from an app store."
  },
  {
    question: "How is Success Kid different from other meme tokens?",
    answer: "Unlike typical meme coins that rely solely on speculation, Success Kid provides actual utility through our community platform. We focus on sustainable engagement, fair token distribution (50% to the community), and transparent development. Our dual-token economy ensures there's real value behind the meme."
  },
  {
    question: "What happens to my Success Points if I don't redeem them?",
    answer: "Your Success Points will remain in your account indefinitely. There is no expiration date for SP. However, keep in mind that the redemption rate is fixed, so there's no advantage to holding SP versus converting to tokens, other than managing your redemption timing."
  },
  {
    question: "How can I contact the team with additional questions?",
    answer: "You can reach us through our Discord community, Telegram group, or by sending an email to support@successkid.io. The team is highly active in our community channels and responds to questions promptly."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
          <p className="text-gray-700 mb-8">
            Find answers to common questions about the Success Kid Community Platform.
          </p>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                <button
                  className="flex justify-between items-center w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === index ? 'transform rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 pb-4 pt-0"
                  >
                    <p className="text-gray-600">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-6 bg-primary/5 rounded-lg border border-primary/10">
            <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
            <p className="mb-4">
              Can't find the answer you're looking for? Please reach out to our community support team.
            </p>
            <a 
              href="https://discord.gg/successkid" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:text-primary-700"
            >
              Join our Discord
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
