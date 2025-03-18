import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tokenomics - Success Kid Community Platform',
  description: 'Understand the Success Kid token economy, distribution, and how our dual-token system creates sustainable value.',
};

export default function TokenomicsPage() {
  return (
    <div className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-6 text-center">Success Kid Tokenomics</h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Coming soon! Our full Tokenomics page is under development.
          </p>
        </div>
      </div>
    </div>
  );
}
