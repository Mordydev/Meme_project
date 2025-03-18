'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const MarketingFooter = () => {
  const currentYear = new Date().getFullYear();
  
  // Navigation categories
  const footerNav = [
    {
      title: 'Platform',
      links: [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Tokenomics', href: '/tokenomics' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Community', href: '/community' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: '#' },
        { name: 'Whitepaper', href: '#' },
        { name: 'Token Contract', href: '#' },
        { name: 'Market Data', href: '#' },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Discord', href: '#' },
        { name: 'Twitter', href: '#' },
        { name: 'Telegram', href: '#' },
        { name: 'Medium', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Cookie Policy', href: '#' },
      ],
    },
  ];

  // Social media links
  const socialLinks = [
    { name: 'Twitter', href: '#', icon: 'twitter' },
    { name: 'Discord', href: '#', icon: 'discord' },
    { name: 'Telegram', href: '#', icon: 'telegram' },
    { name: 'Medium', href: '#', icon: 'medium' },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and description */}
          <motion.div 
            className="lg:col-span-2"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/logo.svg"
                alt="Success Kid Logo"
                width={40}
                height={40}
                className="mr-2"
              />
              <span className="font-display font-bold text-xl text-white">
                Success Kid
              </span>
            </Link>
            <p className="text-gray-400 mb-4">
              Join the Success Kid community platform where crypto enthusiasts and meme lovers 
              connect, engage, and create value together.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  <SocialIcon name={social.icon} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Navigation links */}
          <motion.div 
            className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {footerNav.map((category) => (
              <div key={category.title}>
                <motion.h3 
                  className="font-display font-bold text-lg mb-4"
                  variants={itemVariants}
                >
                  {category.title}
                </motion.h3>
                <motion.ul 
                  className="space-y-2"
                  variants={containerVariants}
                >
                  {category.links.map((link) => (
                    <motion.li key={link.name} variants={itemVariants}>
                      <Link 
                        href={link.href}
                        className="text-gray-400 hover:text-primary transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Newsletter subscription (for future implementation) */}
        <motion.div 
          className="border-t border-gray-800 mt-12 pt-8"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-400">
                &copy; {currentYear} Success Kid Platform. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/privacy"
                className="text-xs text-gray-400 hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms"
                className="text-xs text-gray-400 hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="/cookies"
                className="text-xs text-gray-400 hover:text-primary transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

// Simple social icon component
const SocialIcon = ({ name }: { name: string }) => {
  switch (name) {
    case 'twitter':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 4.01C21 4.5 20.02 4.69 19 4.82C20.07 4.19 20.82 3.14 21.17 1.92C20.17 2.52 19.03 2.98 17.8 3.22C16.83 2.13 15.42 1.5 13.85 1.5C10.82 1.5 8.35 3.97 8.35 7.02C8.35 7.47 8.4 7.92 8.5 8.34C4.57 8.12 1.1 5.9 0.45 2.68C0.33 3.15 0.27 3.67 0.27 4.22C0.27 5.87 1.11 7.33 2.32 8.17C1.74 8.14 1.19 7.97 0.7 7.72V7.77C0.7 10.42 2.61 12.67 5.08 13.2C4.69 13.31 4.27 13.37 3.84 13.37C3.55 13.37 3.26 13.33 2.98 13.27C3.57 15.47 5.53 17.1 7.88 17.14C6.07 18.65 3.78 19.56 1.26 19.56C0.83 19.56 0.41 19.53 0 19.48C2.38 21.09 5.16 22 8.16 22C17.9 22 23.27 13.46 23.27 6.13C23.27 5.89 23.26 5.64 23.25 5.4C24.27 4.67 25.17 3.76 25.89 2.72" fill="currentColor"/>
        </svg>
      );
    case 'discord':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 4.3698C18.7873 3.7003 17.147 3.21897 15.4319 2.9998C15.4007 2.99532 15.3695 3.00769 15.3479 3.03375C15.1417 3.43127 14.9135 3.94323 14.7481 4.34283C12.9142 4.13749 11.0906 4.13749 9.29893 4.34283C9.13352 3.93376 8.89525 3.43127 8.68712 3.03375C8.6655 3.00867 8.63435 2.99629 8.60315 2.9998C6.88805 3.21795 5.24774 3.6993 3.71801 4.3698C3.70016 4.37758 3.68427 4.39144 3.67348 4.40912C0.53848 9.19549 -0.324263 13.8545 0.101717 18.4411C0.103659 18.4739 0.120166 18.5047 0.144829 18.5248C2.16436 19.9976 4.11313 20.8967 6.0212 21.5014C6.05238 21.5095 6.08552 21.4992 6.10624 21.4734C6.55726 20.8498 6.9587 20.1977 7.30862 19.518C7.33348 19.47 7.31173 19.4138 7.26573 19.3969C6.63477 19.165 6.03312 18.8892 5.45764 18.5795C5.40567 18.5496 5.40172 18.4772 5.44978 18.442C5.56186 18.3564 5.67394 18.2667 5.78207 18.177C5.80477 18.1574 5.83789 18.1532 5.86513 18.1658C9.70608 19.9056 13.8595 19.9056 17.6564 18.1658C17.6837 18.1522 17.7168 18.1564 17.7405 18.176C17.8486 18.2667 17.9607 18.3564 18.0737 18.442C18.1218 18.4772 18.1188 18.5496 18.0659 18.5795C17.4904 18.8952 16.8888 19.165 16.2578 19.3959C16.2118 19.4128 16.1911 19.47 16.216 19.518C16.5739 20.1977 16.9753 20.8498 17.4173 21.4724C17.437 21.4992 17.4712 21.5095 17.5023 21.5014C19.4183 20.8967 21.367 19.9976 23.3866 18.5248C23.4123 18.5047 23.4277 18.4749 23.4297 18.442C23.9303 13.1307 22.6341 8.51259 20.3569 4.40912C20.3472 4.39144 20.3313 4.37758 20.3134 4.3698ZM7.82035 15.651C6.6635 15.651 5.71768 14.6123 5.71768 13.3383C5.71768 12.0644 6.64158 11.0257 7.82035 11.0257C9.0081 11.0257 9.94195 12.0733 9.92002 13.3383C9.92002 14.6123 8.99613 15.651 7.82035 15.651ZM16.1947 15.651C15.0378 15.651 14.092 14.6123 14.092 13.3383C14.092 12.0644 15.0159 11.0257 16.1947 11.0257C17.3824 11.0257 18.3163 12.0733 18.2943 13.3383C18.2943 14.6123 17.3824 15.651 16.1947 15.651Z" fill="currentColor"/>
        </svg>
      );
    case 'telegram':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.944 0C5.34 0 0 5.34 0 11.944C0 18.548 5.34 23.888 11.944 23.888C18.548 23.888 23.888 18.548 23.888 11.944C23.888 5.34 18.548 0 11.944 0ZM17.806 8.166C17.65 10.068 16.884 14.838 16.496 16.938C16.328 17.876 15.99 18.19 15.666 18.228C14.952 18.302 14.402 17.756 13.7 17.288C12.598 16.546 12.01 16.084 10.94 15.358C9.702 14.532 10.512 14.08 11.236 13.326C11.424 13.13 14.57 10.28 14.632 10.03C14.64 9.992 14.648 9.878 14.58 9.818C14.512 9.758 14.414 9.78 14.342 9.796C14.241 9.82 12.554 10.95 9.276 13.184C8.776 13.526 8.324 13.692 7.918 13.684C7.468 13.674 6.608 13.454 5.966 13.264C5.172 13.032 4.54 12.91 4.592 12.476C4.62 12.25 4.936 12.018 5.538 11.786C9.068 10.23 11.454 9.17 12.698 8.604C16.27 6.968 17.04 6.692 17.54 6.684C17.648 6.682 17.882 6.71 18.032 6.832C18.152 6.93 18.186 7.066 18.2 7.164C18.188 7.242 18.212 7.4 17.806 8.166Z" fill="currentColor"/>
        </svg>
      );
    case 'medium':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.536 12C13.536 15.084 11.084 17.536 8 17.536C4.916 17.536 2.464 15.084 2.464 12C2.464 8.916 4.916 6.464 8 6.464C11.084 6.464 13.536 8.916 13.536 12ZM19.536 12C19.536 14.946 18.31 17.328 16.792 17.328C15.274 17.328 14.048 14.946 14.048 12C14.048 9.054 15.274 6.672 16.792 6.672C18.31 6.672 19.536 9.054 19.536 12ZM22 12C22 14.65 21.536 16.8 20.96 16.8C20.384 16.8 19.92 14.65 19.92 12C19.92 9.35 20.384 7.2 20.96 7.2C21.536 7.2 22 9.35 22 12Z" fill="currentColor"/>
        </svg>
      );
    default:
      return null;
  }
};

export default MarketingFooter;
