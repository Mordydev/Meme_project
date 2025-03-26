/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
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
