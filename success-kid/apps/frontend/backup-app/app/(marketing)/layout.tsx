'use client';

import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingHeader />
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen flex flex-col"
        >
          <div className="flex-grow pt-16">
            {children}
          </div>
          <MarketingFooter />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
