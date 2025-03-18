'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import tokens from '@/theme/tokens';

const footerLinks = {
  platform: [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Tokenomics', href: '/tokenomics' },
    { name: 'FAQ', href: '/faq' },
  ],
  community: [
    { name: 'Discord', href: 'https://discord.gg/successkid' },
    { name: 'Twitter', href: 'https://twitter.com/successkid' },
    { name: 'Telegram', href: 'https://t.me/successkid' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Whitepaper', href: '/whitepaper' },
    { name: 'Roadmap', href: '/roadmap' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
};

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white opacity-50 dark:opacity-10 dark:from-gray-900 dark:to-gray-950"></div>
      <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] bg-repeat opacity-10"></div>
      <div className="container relative z-10 mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand and Newsletter */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="mb-4">
              <Link href="/" className="flex items-center space-x-2 group">
                <span className="text-2xl font-bold text-primary group-hover:text-primary-600 transition-colors">Success Kid</span>
              </Link>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-md">
                Join a vibrant ecosystem where crypto enthusiasts and meme lovers connect, engage, and create value together.
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                Join our newsletter
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Get the latest news and updates about Success Kid.
              </p>
              <div className="mt-3 sm:flex sm:max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-l-md border border-r-0 border-gray-300 dark:border-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-200"
                  aria-label="Email address"
                />
                <Button className="rounded-l-none group relative overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></span>
                  <span className="relative">Subscribe</span>
                  <span className="ml-2">→</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Platform Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                Platform
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                Community
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.community.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors hover:translate-x-0.5 inline-block"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                Resources
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            &copy; {currentYear} Success Kid Community Platform. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            {/* Social Media Icons */}
            <a href="https://twitter.com/successkid" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors hover:scale-110 inline-block">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="https://discord.gg/successkid" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors hover:scale-110 inline-block">
              <span className="sr-only">Discord</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0771.0771 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
            </a>
            <a href="https://t.me/successkid" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors hover:scale-110 inline-block">
              <span className="sr-only">Telegram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.292c-.108 1.127-.493 3.86-.697 5.127-.183 1.179-.597 1.577-.98 1.616-.834.079-1.463-.542-2.27-1.057-.987-.639-1.583-1.028-2.539-1.651-.989-.698-.348-1.082.215-1.706.172-.19 2.989-2.742 3.139-2.978.019-.029.028-.085-.019-.12-.047-.034-.11-.022-.158-.013a1.25 1.25 0 00-.187.089c-.119.07-2.384 1.516-3.776 2.368-.358.214-.865.465-1.288.451-.423-.016-1.239-.24-1.843-.437-.743-.244-1.33-.375-1.28-.789.027-.212.323-.432.828-.647a33.704 33.704 0 018.155-3.093c.56-.16 2.23-.612 2.54-.617.265-.004.549.081.734.247.127.154.142.403.125.535z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
