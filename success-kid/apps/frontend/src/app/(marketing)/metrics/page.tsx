'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MarketMetrics, CommunityMetrics } from '@/components/marketing';

export default function MetricsPage() {
  return (
    <div className="bg-gray-50">
      {/* Page Header */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Community & Market Metrics</h1>
            <p className="text-xl text-gray-600 mb-8">
              Track the growth of our community and market performance with real-time metrics
              and milestone progress.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#market">Market Metrics</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#community">Community Stats</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Market Metrics Section */}
      <section id="market" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Market Performance</h2>
              <p className="text-gray-600">
                Track our market growth, milestone progress, and token distribution. The Success Kid
                platform is built on transparency and community ownership.
              </p>
            </motion.div>
          </div>
          
          <MarketMetrics />
          
          <div className="mt-12 text-center">
            <Link href="/tokenomics">
              <Button size="lg" variant="outline">
                View Detailed Tokenomics
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Metrics Section */}
      <section id="community" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Community Activity</h2>
              <p className="text-gray-600">
                Our community is the heart of the Success Kid platform. See real-time activity,
                global presence, and category engagement across our ecosystem.
              </p>
            </motion.div>
          </div>
          
          <CommunityMetrics />
          
          <div className="mt-12 text-center">
            <Link href="/community">
              <Button size="lg" variant="outline">
                Explore Community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Be Part of Our Growing Community
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of members already contributing to Success Kid's journey and earning rewards.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">Join Now</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/features">Explore Features</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
