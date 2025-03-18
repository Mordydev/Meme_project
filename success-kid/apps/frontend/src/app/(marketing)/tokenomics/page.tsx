'use client';

import { motion } from 'framer-motion';

export default function TokenomicsPage() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Tokenomics</h1>
          <div className="prose prose-lg">
            <p className="text-gray-700 mb-4">
              The Success Kid Token (SKC) forms the backbone of our platform's economy, with a thoughtfully designed tokenomics model that prioritizes community rewards, sustainable development, and fair distribution.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Total Supply</h2>
            <p className="text-gray-700 mb-6">
              <strong>7 billion SKC tokens</strong> (Lucky number 7, tying into the "success" theme)
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Token Allocation</h2>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation</th>
                    <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Community Rewards</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3.5 billion SKC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Incentivize platform engagement</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Development Team</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1.4 billion SKC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Fund development, marketing</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Public Sale</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">30%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2.1 billion SKC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Distribution and liquidity</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Success Points (SP) System</h2>
            <p className="text-gray-700 mb-4">
              Platform activity is rewarded with Success Points (SP), which can be redeemed for SKC tokens:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="text-gray-700">Earning SP: Users earn points for creating content, engaging with posts, referring new users, and completing challenges</li>
              <li className="text-gray-700">Point Tiers: Activities are weighted based on value contribution (e.g., original content earns more than likes)</li>
              <li className="text-gray-700">Redemption Rate: 100 SP = 1 SKC, with a daily cap (10,000 SP/user) to manage supply flow</li>
              <li className="text-gray-700">Dashboard: Clear UI showing SP balance, redemption history, and leaderboard rank</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
