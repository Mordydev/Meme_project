'use client';

import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About Success Kid</h1>
          <div className="prose prose-lg">
            <p className="text-gray-700 mb-4">
              The Success Kid Community Platform transforms a viral meme coin into a sustainable digital community with real utility and engagement. While most meme coins rely solely on short-term hype, our vision is to harness the positive energy and recognition of the Success Kid meme to build a vibrant ecosystem where crypto enthusiasts and meme lovers alike can connect, engage, and create value together.
            </p>
            <p className="text-gray-700 mb-4">
              Our tagline—"Clench Your Fist, Claim Your Success!"—embodies our mission to empower users through a combination of nostalgic connection, fair tokenomics, and rewarding engagement.
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Vision</h2>
            <p className="text-gray-700 mb-4">
              The platform's core purpose extends beyond supporting token price to creating an engaging digital space that captures the essence of the Success Kid meme – determination, achievement, and positivity – while providing genuine utility for community members.
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Dual-Token Economy</h2>
            <p className="text-gray-700 mb-4">
              The platform introduces a dual-token economy:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="text-gray-700">SKC Token: The core cryptocurrency for the ecosystem</li>
              <li className="text-gray-700">Success Points (SP): On-platform utility tokens earned through engagement and redeemable for SKC</li>
            </ul>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Guiding Principles</h2>
            <p className="text-gray-700 mb-4">
              All platform decisions are guided by these principles:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="text-gray-700">Speed without compromise: Fast deployment without sacrificing critical functionality</li>
              <li className="text-gray-700">Community first: Features that directly benefit and engage users take priority</li>
              <li className="text-gray-700">Technical accessibility: Intuitive design for users of all technical backgrounds</li>
              <li className="text-gray-700">Scalability: Architecture that can grow with increasing users and features</li>
              <li className="text-gray-700">Transparency: Clear communication about development, tokenomics, and governance</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
