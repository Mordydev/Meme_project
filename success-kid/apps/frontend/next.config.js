/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/explore',
        destination: '/discover',
        permanent: true,
      },
      {
        source: '/explore/:path*',
        destination: '/discover/:path*',
        permanent: true,
      },
      {
        source: '/forum',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/forum/:path*',
        destination: '/community/:path*',
        permanent: true,
      },
    ];
  },
  reactStrictMode: true,
  webpack: (config) => {
    // More aggressive resolver for Lodash dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash/isFunction': path.resolve(__dirname, 'src/lib/recharts-resolver.js'),
      'lodash/max': path.resolve(__dirname, 'src/lib/recharts-resolver.js'),
      'lodash/isNil': path.resolve(__dirname, 'src/lib/recharts-resolver.js'),
      'lodash/isNaN': path.resolve(__dirname, 'src/lib/recharts-resolver.js')
    };
    
    return config;
  },
  images: {
    domains: ['images.clerk.dev'],
  },
  // Ensure CSS modules are processed
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
};

module.exports = nextConfig;
