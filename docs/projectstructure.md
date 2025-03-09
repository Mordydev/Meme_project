# Wild 'n Out Meme Coin Platform - Actual Project Structure

## Overview

The project is structured as a monorepo using Turborepo, containing both frontend and backend applications along with shared packages. The implementation follows modern architectural patterns with Next.js 15.2+ (App Router) for the frontend and Fastify 5.2+ for the backend.

```
wildnout-platform/
├── apps/                      # Application packages
│   ├── frontend/              # Next.js frontend application  
│   └── backend/               # Fastify backend API service
├── packages/                  # Shared libraries
│   ├── ui/                    # Shared UI components
│   ├── types/                 # Shared TypeScript types
│   └── utils/                 # Common utilities
├── docs/                      # Project documentation
├── turbo.json                 # Turborepo configuration
└── package.json               # Root package configuration
```

## Frontend Implementation (Next.js 15.2+)

The frontend follows Next.js 15.2+ App Router architecture with a strong focus on Server Components, Clerk authentication, and Tailwind CSS for styling.

### Directory Structure

```
apps/frontend/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Authentication route group
│   │   ├── (marketing)/       # Public marketing route group
│   │   ├── (platform)/        # Authenticated platform route group
│   │   │   ├── battle/        # Battle-related pages
│   │   │   ├── community/     # Community pages
│   │   │   ├── create/        # Content creation pages
│   │   │   ├── profile/       # Profile pages
│   │   │   └── token/         # Token hub pages
│   │   ├── api/               # API routes for frontend-only functionality
│   │   ├── design-system/     # Design system documentation & showcase
│   │   ├── onboarding/        # User onboarding flows
│   │   └── responsive-demo/   # Responsive design demonstration
│   │
│   ├── components/            # React components
│   │   ├── animation/         # Animation-related components
│   │   ├── auth/              # Authentication components
│   │   ├── features/          # Feature-specific components
│   │   │   ├── battle/        # Battle-related components
│   │   │   ├── community/     # Community components
│   │   │   ├── creation/      # Content creation components
│   │   │   ├── navigation/    # Navigation components
│   │   │   ├── onboarding/    # Onboarding components
│   │   │   └── profile/       # Profile components
│   │   ├── layout/            # Layout components
│   │   ├── marketing/         # Marketing page components
│   │   ├── providers/         # React context providers
│   │   ├── token/             # Token-related components
│   │   ├── ui/                # Generic UI components
│   │   └── wallet/            # Wallet connection components
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions and shared code
│   ├── styles/                # Global styles and themes
│   └── types/                 # TypeScript types
│
├── public/                    # Static assets
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── package.json               # Package dependencies
```

### Key Frontend Technologies

- **Next.js 15.2+**: App Router with Server Components
- **React 19.1+**: Latest React with advanced features
- **TypeScript 5.4+**: Type safety throughout the application
- **Tailwind CSS 4.0+**: Utility-first styling
- **Clerk**: Authentication and user management
- **Framer Motion**: Animation library for interactive effects
- **Zod**: Schema validation for forms and data
- **Sonner**: Toast notifications

## Backend Implementation (Fastify 5.2+)

The backend is built with Fastify 5.2+ and structured with a clear separation of concerns between API routes, services, repositories, and utilities.

### Directory Structure

```
apps/backend/
├── src/
│   ├── api/                  # API route handlers
│   │   ├── auth/             # Authentication endpoints
│   │   ├── battles/          # Battle-related endpoints
│   │   ├── content/          # Content management endpoints
│   │   ├── token/            # Token and wallet endpoints
│   │   └── users/            # User management endpoints
│   │       ├── achievements/ # Achievement endpoints
│   │       └── profile/      # Profile endpoints
│   │
│   ├── config/               # Application configuration
│   ├── lib/                  # Shared utilities and helpers
│   │   └── errors/           # Error handling utilities
│   │
│   ├── middleware/           # HTTP middleware
│   ├── models/               # Data models and schemas
│   ├── plugins/              # Fastify plugins
│   ├── repositories/         # Data access layer
│   ├── services/             # Business logic services
│   │   └── core/             # Core service providers
│   │
│   ├── websockets/           # WebSocket handlers
│   ├── app.ts                # Fastify app setup
│   └── index.ts              # Server entry point
│
├── test/                     # Test files
└── package.json              # Package dependencies
```

### Key Backend Technologies

- **Node.js 18+**: JavaScript runtime
- **Fastify 5.2+**: Fast and low overhead web framework
- **TypeScript 5.4+**: Type safety throughout the application
- **@clerk/fastify**: Authentication middleware for Fastify
- **@supabase/supabase-js**: Database client for Supabase
- **IoRedis**: Redis client for caching and pub/sub
- **Zod**: Schema validation for API requests and responses

## Shared Packages

The project includes several shared packages to promote code reuse:

### UI Package

```
packages/ui/
├── src/                      # Source code
├── index.ts                  # Package exports
└── package.json              # Package dependencies
```

### Types Package

```
packages/types/
├── src/                      # Source code
├── index.ts                  # Package exports
└── package.json              # Package dependencies
```

### Utils Package

```
packages/utils/
├── src/                      # Source code
├── index.ts                  # Package exports
└── package.json              # Package dependencies
```