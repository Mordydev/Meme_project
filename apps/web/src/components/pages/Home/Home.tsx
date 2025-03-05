import React from 'react';
import { Typography } from '../../atoms/Typography';
import { Button } from '../../atoms/Button';

const Home: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
        <div className="container mx-auto px-4 text-center">
          <Typography variant="h1" className="mb-6">
            Welcome to Success Kid Community
          </Typography>
          <Typography variant="body" color="muted" className="max-w-2xl mx-auto mb-8">
            Join the community that's transforming a viral meme token into a sustainable digital ecosystem with real utility and engagement.
          </Typography>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg">Join Community</Button>
            <Button size="lg" variant="secondary">Learn More</Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Typography variant="h2" className="text-center mb-12">
            Platform Features
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <Typography variant="h3" className="mb-2">Community Forums</Typography>
              <Typography variant="body" color="muted">
                Engage with other members in our vibrant discussion forums.
              </Typography>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <Typography variant="h3" className="mb-2">Live Price Tracking</Typography>
              <Typography variant="body" color="muted">
                Stay updated with real-time token price and market data.
              </Typography>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <Typography variant="h3" className="mb-2">Wallet Integration</Typography>
              <Typography variant="body" color="muted">
                Connect your crypto wallet for seamless token interactions.
              </Typography>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-primary rounded-xl text-white">
        <div className="container mx-auto px-4 text-center">
          <Typography variant="h2" className="mb-6">
            Ready to Join the Success Kid Community?
          </Typography>
          <Typography variant="body" className="max-w-2xl mx-auto mb-8">
            Connect your wallet and become part of our growing ecosystem today.
          </Typography>
          <Button variant="secondary" size="lg">Connect Wallet</Button>
        </div>
      </section>
    </div>
  );
};

export default Home; 