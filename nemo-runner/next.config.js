/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config) => {
    config.externals.push({
      'sharp': 'commonjs sharp',
    });
    return config;
  },
};

module.exports = nextConfig;