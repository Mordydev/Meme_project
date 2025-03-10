import { Metadata } from 'next'
import { FAQAccordion } from '@/components/marketing/faq-accordion'
import { RegistrationCTA } from '@/components/marketing/registration-cta'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Wild 'n Out Meme Coin',
  description: 'Find answers to common questions about the Wild 'n Out Meme Coin platform, token, battles, and more',
}

// FAQ data structure
const faqCategories = [
  {
    title: 'Getting Started',
    faqs: [
      {
        question: 'What is the Wild 'n Out Meme Coin platform?',
        answer: 'The Wild 'n Out Meme Coin platform is a digital ecosystem that brings the energy and competitive fun of the Wild 'n Out TV show to the crypto space. It combines community features, creative battles, content creation, and token utility in one cohesive experience.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Creating an account is easy! Click the "Sign Up" button in the top right corner, fill out the simple registration form, and verify your email address. Once complete, you'll be able to explore all the platform features and join the community.',
      },
      {
        question: 'Is the platform free to use?',
        answer: 'Yes, the core platform features are free for all users. Some advanced features and exclusive experiences may require token holdings to access, but there's plenty to enjoy without any investment.',
      },
      {
        question: 'What devices can I use the platform on?',
        answer: 'The Wild 'n Out Meme Coin platform is fully responsive and works on all modern devices including smartphones, tablets, laptops, and desktop computers. The mobile experience is optimized for on-the-go usage.',
      },
      {
        question: 'Do I need to connect a wallet to use the platform?',
        answer: 'No, you don't need to connect a wallet to use the core features of the platform. However, connecting a wallet allows you to verify token holdings and access holder-exclusive features and benefits.',
      },
    ],
  },
  {
    title: 'Battle System',
    faqs: [
      {
        question: 'What are battles?',
        answer: 'Battles are competitive creative challenges inspired by Wild 'n Out show formats. They allow users to showcase their creativity, humor, and skills in different formats like Wild Style (freestyle), Pick Up & Kill It (prompt-based), and R&Beef (comedy roasts).',
      },
      {
        question: 'How do I join a battle?',
        answer: 'To join a battle, navigate to the Battle Arena section, browse available battles, and click on one that interests you. After reviewing the rules, click "Enter Battle" to begin creating your submission using our Creation Studio.',
      },
      {
        question: 'How are battle winners determined?',
        answer: 'Winners are typically determined through community voting. After the submission period ends, there's a voting phase where other users can vote on entries. Some special battles may include judge panel reviews or different scoring systems.',
      },
      {
        question: 'What can I win from battles?',
        answer: 'Battle victories earn you recognition, platform points, achievement badges, and improved visibility in the community. Some special battles may offer additional prizes like token rewards or exclusive features.',
      },
      {
        question: 'Are there rules for battle submissions?',
        answer: 'Yes, each battle has specific rules regarding format, content guidelines, and time limits. Additionally, all submissions must adhere to the platform-wide content policy, which prohibits harmful, offensive, or inappropriate content.',
      },
    ],
  },
  {
    title: 'Token & Wallet',
    faqs: [
      {
        question: 'What is the $WILDNOUT token?',
        answer: 'The $WILDNOUT token is the native cryptocurrency of the Wild 'n Out Meme Coin platform. It provides holders with exclusive features, enhanced platform capabilities, and a stake in the growing ecosystem.',
      },
      {
        question: 'How do I get $WILDNOUT tokens?',
        answer: 'You can acquire $WILDNOUT tokens through popular cryptocurrency exchanges. We recommend using established exchanges and always doing your own research before making any investment decisions.',
      },
      {
        question: 'Which wallets are supported?',
        answer: 'The platform currently supports Phantom wallet for Solana-based connections. We plan to add support for additional wallet providers in future updates.',
      },
      {
        question: 'What are the benefits of holding tokens?',
        answer: 'Token holders gain access to exclusive platform features, special battles, premium creation tools, enhanced visibility options, and other benefits that scale with holding amounts. The exact benefits depend on your holder tier.',
      },
      {
        question: 'Is my wallet information secure?',
        answer: 'Yes, we prioritize security in all wallet interactions. We never store private keys or sensitive wallet information. We only verify public addresses and token balances using read-only connections that keep your assets safe.',
      },
    ],
  },
  {
    title: 'Content & Community',
    faqs: [
      {
        question: 'What kind of content can I create?',
        answer: 'You can create various content types including text posts, images, memes, short audio clips, and mixed-media content. Our Creator Studio provides tools for multiple formats to express your creativity.',
      },
      {
        question: 'How is content moderated?',
        answer: 'Content is moderated through a combination of automated systems and human review to ensure a positive, respectful community environment. All content must adhere to our community guidelines.',
      },
      {
        question: 'Can I report inappropriate content?',
        answer: 'Yes, you can report any content that violates our community guidelines using the report button available on all content. Our moderation team reviews reports promptly.',
      },
      {
        question: 'How do I grow my following?',
        answer: 'You can grow your following by regularly participating in battles, creating quality content, engaging with the community, and being active in discussions. Authentic engagement tends to attract the most followers.',
      },
      {
        question: 'Are there verification options for creators?',
        answer: 'Yes, established creators can apply for verification to distinguish their official accounts. This helps build trust and authenticity within the community.',
      },
    ],
  },
  {
    title: 'Technical Support',
    faqs: [
      {
        question: 'How do I report a technical issue?',
        answer: 'You can report technical issues through the Help Center accessible from your profile menu. Please provide as much detail as possible, including steps to reproduce the issue, to help our team resolve it quickly.',
      },
      {
        question: 'What if I forgot my password?',
        answer: 'If you forget your password, click the "Forgot Password" link on the login page. We'll send a password reset link to your registered email address.',
      },
      {
        question: 'How do I change my username or profile information?',
        answer: 'You can update your profile information in the Profile Settings section. Note that your username can only be changed once every 30 days to maintain community stability.',
      },
      {
        question: 'Why is my content not appearing in feeds?',
        answer: 'New content might take a short time to appear in feeds. If your content doesn't appear after 15 minutes, it might be pending moderation review or could have been flagged for policy violations.',
      },
      {
        question: 'Is there a mobile app available?',
        answer: 'Currently, we offer a fully optimized mobile web experience. Native mobile apps for iOS and Android are planned for future development phases.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="py-12 px-4">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display text-hype-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-zinc-300 text-lg mb-8">
            The battles you love, the energy you crave, the community you belong to. Find answers to common questions about the Wild 'n Out Meme Coin platform.
          </p>
          
          <FAQAccordion categories={faqCategories} />
          
          <div className="mt-16 p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <h2 className="text-xl font-display text-hype-white mb-4">Still Have Questions?</h2>
            <p className="text-zinc-300 mb-4">
              If you couldn't find the answer you were looking for, get in touch with our support team or join our community channels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#" 
                className="inline-flex items-center justify-center bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-4 py-2 rounded-md transition-colors"
              >
                Contact Support
              </a>
              <a 
                href="#" 
                className="inline-flex items-center justify-center bg-transparent hover:bg-hype-white/10 text-hype-white border border-hype-white font-medium px-4 py-2 rounded-md transition-colors"
              >
                Join Discord
              </a>
            </div>
          </div>
          
          <div className="mt-16">
            <RegistrationCTA 
              title="Ready to Experience Wild 'n Out Meme Coin?" 
              subtitle="Join our community today and discover the ultimate entertainment platform."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
