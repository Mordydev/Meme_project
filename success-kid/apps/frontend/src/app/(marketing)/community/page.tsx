import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community - Success Kid Community Platform',
  description: 'Join the thriving Success Kid community, connect with members, and participate in our growing ecosystem.',
};

export default function CommunityPage() {
  return (
    <div className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-6 text-center">Our Community</h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Coming soon! Our full Community page is under development.
          </p>
        </div>
      </div>
    </div>
  );
}
