'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Sample community members
const featuredMembers = [
  {
    name: 'Alex Thompson',
    role: 'Content Champion',
    avatar: '👨‍💼',
    contribution: 'Created over 200 posts with community guides',
    points: '45,800 SP',
  },
  {
    name: 'Sarah Chen',
    role: 'Technical Advisor',
    avatar: '👩‍💻',
    contribution: 'Helps newcomers with wallet setup',
    points: '38,250 SP',
  },
  {
    name: 'Miguel Rodriguez',
    role: 'Community Moderator',
    avatar: '👨‍🚀',
    contribution: 'Organizes weekly community events',
    points: '62,400 SP',
  },
  {
    name: 'Priya Sharma',
    role: 'Success Guide',
    avatar: '👩‍🎓',
    contribution: 'Created beginner-friendly tutorials',
    points: '29,700 SP',
  },
];

// Community stats
const communityStats = [
  { label: 'Active Members', value: '50,000+' },
  { label: 'Daily Posts', value: '350+' },
  { label: 'SP Awarded', value: '2.8M+' },
  { label: 'Countries', value: '120+' },
];

// Community channels
const communityChannels = [
  { 
    name: 'Discord',
    icon: '💬',
    description: 'Join real-time discussions, get help, and connect with the team',
    url: 'https://discord.gg/successkid',
    members: '32,500+',
  },
  { 
    name: 'Twitter',
    icon: '🐦',
    description: 'Follow for announcements, updates, and community highlights',
    url: 'https://twitter.com/successkid',
    members: '45,200+',
  },
  { 
    name: 'Telegram',
    icon: '📱',
    description: 'Get instant updates and join global conversations',
    url: 'https://t.me/successkid',
    members: '28,900+',
  },
];

export default function CommunityPage() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Join Our Community</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Connect with thousands of Success Kid enthusiasts, share your ideas, earn rewards, and be part of a growing movement that celebrates achievement together.
          </p>
        </motion.div>
        
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {communityStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
              <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>
        
        {/* Community Channels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Connect With Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {communityChannels.map((channel, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="text-4xl mb-4">{channel.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{channel.name}</h3>
                <p className="text-gray-600 mb-4">{channel.description}</p>
                <p className="text-sm text-gray-500 mb-4">{channel.members} members</p>
                <a 
                  href={channel.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button>Join {channel.name}</Button>
                </a>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Featured Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Community Champions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-4xl mb-3">{member.avatar}</div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 mb-3">{member.contribution}</p>
                <p className="text-sm font-medium text-secondary">{member.points} earned</p>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 bg-primary/5 rounded-xl p-10 text-center border border-primary/10"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Join the Success Kid Family?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Create your account today and start your journey toward rewards, recognition, and a growing community of like-minded enthusiasts.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="mr-4">Create Account</Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
