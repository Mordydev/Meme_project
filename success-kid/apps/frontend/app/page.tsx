import env from '@/env';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-purple-500">
      <div className="max-w-4xl w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center mb-6">Success Kid Community Platform</h1>
        
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Environment Information</h2>
          <p className="text-gray-700">
            <strong>Environment:</strong> {env.NODE_ENV}
          </p>
          <p className="text-gray-700">
            <strong>API URL:</strong> {env.NEXT_PUBLIC_API_URL}
          </p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
          <p className="mb-4">
            This platform is currently in development. Follow these steps to get started:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Configure your environment variables in <code className="bg-gray-100 p-1 rounded">.env.local</code></li>
            <li>Start the development environment with <code className="bg-gray-100 p-1 rounded">docker compose -f docker/development/docker-compose.yml up -d</code></li>
            <li>Run the application with <code className="bg-gray-100 p-1 rounded">pnpm dev</code></li>
          </ol>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Development Status</h2>
          <p>
            The development environment has been configured and is ready for feature implementation.
          </p>
        </div>
      </div>
    </main>
  );
}
