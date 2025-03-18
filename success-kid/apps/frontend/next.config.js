/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SWC minification is now enabled by default
  // swcMinify: true, // Removing deprecated option
  // Enable experimental features
  experimental: {
    // Updated to packageJsonResolution from serverExternalPackages/serverComponentsExternalPackages
    // serverExternalPackages: ['@prisma/client'], // This option is deprecated in Next.js 15+
    // Enable server actions with larger body size limit for content uploads
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable optimistic updates for server actions
    optimisticClientCache: true,
    // Experimental View Transitions support
    viewTransition: true,
  },
  // Configure image optimization
  images: {
    // Define allowed external domains for image optimization
    domains: ['images.unsplash.com', 'localhost'],
    // Set image optimization configuration
    formats: ['image/webp', 'image/avif'],
    // Set reasonable device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Set image sizes for srcset generation
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Set reasonable defaults for image optimization quality
    minimumCacheTTL: 60,
    // Use sharp for image optimization
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Configure header optimization
  headers: async () => {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
        // Enable HTTP/2 Server Push - removing this to resolve font loading issues
        // {
        //  key: 'Link',
        //  value: '</fonts/inter.woff2>; rel=preload; as=font; crossorigin=anonymous',
        // },
          // Improve security
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        // Cache static assets longer
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images longer
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
  // Configure static asset compression
  compress: true,
  // Configure build artifacts
  output: 'standalone',
  // Configure rewrites for cleaner URLs
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/health',
        destination: '/api/health',
      },
      {
        source: '/users/:username',
        destination: '/profile/:username',
      },
    ];
  },
  // Configure redirects for improved SEO
  redirects: async () => {
    return [
      {
        source: '/signup',
        destination: '/sign-up',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  // Enable webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size with module replacements in production
    if (!dev && !isServer) {
      // Replace lodash with individual modules
      config.resolve.alias = {
        ...config.resolve.alias,
        'lodash': 'lodash-es',
      };
      
      // Add bundle analyzer in analyze mode
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      }
    }
    
    // Optimize SVG loading
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  // runtime option is now deprecated
  // runtime: 'nodejs', // Removing deprecated option
  // Configure production monitoring
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production' && process.env.SOURCE_MAPS === 'true',
  // Configure environment variables
  env: {
    APP_ENV: process.env.APP_ENV || 'development',
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
  // Configure TypeScript for better performance
  typescript: {
    // Don't run TypeScript during build for better performance
    // (TypeScript errors should be caught in CI before deployment)
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  // Configure ESLint for better performance
  eslint: {
    // Don't run ESLint during build for better performance
    // (ESLint errors should be caught in CI before deployment)
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  // Configure powered by header
  poweredByHeader: false,
};

module.exports = nextConfig;
