import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Success Kid Community Platform',
  description: 'Learn more about the Success Kid Community Platform, our mission, and the team behind it.',
};

export default function AboutPage() {
  return (
    <div className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-6 text-center">About Success Kid Platform</h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Coming soon! Our full About page is under development.
          </p>
        </div>
      </div>
    </div>
  );
}
