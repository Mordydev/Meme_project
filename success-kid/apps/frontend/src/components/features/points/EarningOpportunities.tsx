'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Opportunity {
  id: string;
  title: string;
  points: number;
  description: string;
  action: string;
  link: string;
}

export default function EarningOpportunities() {
  // This would typically come from an API
  const opportunities: Opportunity[] = [
    {
      id: 'create_post',
      title: 'Create a Post',
      points: 50,
      description: 'Share your thoughts with the community',
      action: 'Create Post',
      link: '/community/new'
    },
    {
      id: 'connect_wallet',
      title: 'Connect Your Wallet',
      points: 50,
      description: 'Link your wallet to enable token redemption',
      action: 'Connect',
      link: '/profile/wallet'
    },
    {
      id: 'complete_profile',
      title: 'Complete Your Profile',
      points: 100,
      description: 'Add a bio, avatar, and other profile information',
      action: 'Edit Profile',
      link: '/profile/edit'
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Earning Opportunities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id}
              className="p-4 border rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{opportunity.title}</h3>
                <span className="font-mono text-sm font-bold text-primary">
                  +{opportunity.points} SP
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {opportunity.description}
              </p>
              <Button size="sm" className="w-full">
                {opportunity.action}
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
