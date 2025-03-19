/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Define the app directory to use
  experimental: {
    appDir: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // This property configures which packages should be processed as external dependencies
  // and not bundled with the server components
  serverComponentsExternalPackages: ['@prisma/client'],
  images: {
    domains: ['images.unsplash.com', 'localhost'],
  },
};

module.exports = nextConfig;
