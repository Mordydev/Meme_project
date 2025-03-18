import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - Success Kid Community Platform',
  description: 'Find answers to commonly asked questions about the Success Kid Community Platform, tokens, and features.',
};

export default function FaqPage() {
  return (
    <div className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-6 text-center">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Coming soon! Our full FAQ page is under development.
          </p>
        </div>
      </div>
    </div>
  );
}
