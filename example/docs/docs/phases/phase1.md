# Task 1: Project Repository Structure

## Task Overview
- **Purpose:** Establish the foundational repository architecture that will house both frontend and backend code
- **Value:** Creates a consistent, organized codebase structure that supports efficient development across all phases
- **Dependencies:** This task establishes patterns that all other tasks will build upon

## Required Knowledge
- **Key Documents:** frontend.md, backend.md, appflow.md
- **Technical Prerequisites:** Git, monorepo concepts, npm/yarn workspaces

## Implementation Sub-Tasks

### Sub-Task 1: Monorepo Setup ⭐️ *PRIORITY*

**Goal:** Create a monorepo structure that organizes frontend, backend, and shared code

**Directory/File Structure:**
```
wildnout-platform/
├── apps/                  # Contains standalone applications
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # Fastify backend application
├── packages/              # Shared code and utilities
│   ├── ui/                # Shared UI components
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utility functions
├── .gitignore             # Git ignore patterns
├── package.json           # Root package configuration
├── tsconfig.json          # Base TypeScript configuration
└── README.md              # Project documentation
```

**Key Pattern:**
```json
// package.json
{
  "name": "wildnout-platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

**Essential Requirements:**
- Workspace configuration with Turborepo for build optimization
- Shared dependencies management across all packages
- Clear separation between applications and shared code
- Consistent npm script naming across packages

**Integration Points:**
- Frontend and backend apps can import from shared packages
- TypeScript path configuration enables seamless imports
- Build process respects dependencies between packages

### Sub-Task 2: Git Configuration

**Goal:** Establish Git practices for collaborative development

**Key Pattern:**
```
# .gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Cache
.turbo
.vercel

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories
.idea/
.vscode/
*.swp
*.swo
```

**Essential Requirements:**
- Comprehensive .gitignore covering all build artifacts and dependencies
- Branch strategy documentation (main, development, feature branches)
- Conventional commit message format requirements
- Pre-commit hook configuration for linting and formatting

### Sub-Task 3: Core Configuration Files

**Goal:** Create essential configuration files for the entire project

**Key Pattern:**
```js
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    }
  }
}
```

**Essential Requirements:**
- Turborepo configuration for efficient builds
- Base TypeScript configuration that workspace configs extend
- Shared eslint and prettier configuration for code consistency
- Environment variable templates with documentation

## Testing & Validation
- Repository structure follows best practices for Next.js and Fastify
- Project builds successfully with `yarn build` command
- Code editor provides correct TypeScript validation across workspaces
- Dependencies can be imported between packages correctly

## Definition of Done
- [ ] Complete monorepo structure created with all necessary configuration files
- [ ] Git configuration established with .gitignore and branch strategy documentation
- [ ] Basic README with project overview and development instructions
- [ ] Package scripts implemented and working for core commands (dev, build, test, lint)
- [ ] Sample workspace references functional across packages

# Phase 1: Tasks 2-10 - Essential Project Foundation

This document contains the remaining essential tasks for establishing the Wild 'n Out Meme Coin Platform foundation.

## Task 2: Next.js Frontend Foundation

### Task Overview
- **Purpose:** Establish the core Next.js frontend application structure with App Router
- **Value:** Provides the foundation for all user-facing features and interactions
- **Dependencies:** Builds on repository structure from Task 1

### Required Knowledge
- **Key Documents:** frontend.md, design.md, appflow.md
- **Technical Prerequisites:** Next.js 15.2+, React 19, TypeScript 5.4

### Implementation Sub-Tasks

#### Sub-Task 1: Next.js App Router Setup ⭐️ *PRIORITY*

**Goal:** Initialize a Next.js 15.2+ project with App Router architecture

**Directory/File Structure:**
```
apps/frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Authentication routes
│   │   ├── sign-in/          # Sign-in page
│   │   └── sign-up/          # Sign-up page
│   ├── (platform)/           # Authenticated platform experience
│   │   ├── battle/           # Battle-related pages
│   │   ├── community/        # Community pages
│   │   ├── profile/          # User profile pages
│   │   └── token/            # Token hub pages
│   ├── api/                  # API route handlers
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Root page
├── components/               # UI components
│   ├── ui/                   # Generic UI components
│   └── features/             # Feature-specific components
├── lib/                      # Utility functions
├── public/                   # Static assets
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
└── postcss.config.js         # PostCSS configuration for Tailwind
```

**Key Pattern:**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@clerk/clerk-sdk-node'],
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
```

**Essential Requirements:**
- App Router architecture with proper route organization
- TypeScript configured with strict mode
- Root layout that supports authentication state
- Clear folder structure for components, utils, and routes

**Integration Points:**
- Authentication with Clerk will integrate here
- Token/blockchain functionality will be accessible through the app
- Design system will apply throughout components

#### Sub-Task 2: Core Layout Structure

**Goal:** Create the foundational layout components for consistent UI

**Key Pattern:**
```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from '@/components/providers'
import '@/styles/globals.css'

export const metadata = {
  title: 'Wild 'n Out Meme Coin',
  description: 'The official platform for the Wild 'n Out meme coin community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-wild-black text-hype-white">
        <ClerkProvider>
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

**Essential Requirements:**
- Providers wrapper for context providers
- Clerk authentication integration
- Metadata for SEO
- Global styles and theme configuration

#### Sub-Task 3: Base Component Implementation

**Goal:** Create the foundational UI components needed for basic functionality

**Key Pattern:**
```tsx
// components/ui/button.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-battle-yellow text-wild-black hover:bg-battle-yellow/90",
        secondary: "bg-flow-blue text-hype-white hover:bg-flow-blue/90",
        outline: "border border-battle-yellow text-battle-yellow hover:bg-battle-yellow/10",
        ghost: "hover:bg-hype-white/10 text-hype-white"
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-8 px-3",
        lg: "h-12 px-6 text-lg"
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Essential Requirements:**
- Core UI components (Button, Card, Input)
- Consistent styling and variants
- Accessibility considerations built-in
- TypeScript types for component props

### Testing & Validation
- Next.js application successfully builds with `yarn dev` and `yarn build`
- App Router navigation works between routes
- Component variants render correctly
- TypeScript provides proper type checking

### Definition of Done
- [ ] Next.js application initialized with proper App Router structure
- [ ] Core layouts and pages scaffolded
- [ ] Base UI components implemented
- [ ] TypeScript strict mode enabled and working
- [ ] Development server runs successfully

## Task 3: Fastify Backend Foundation

### Task Overview
- **Purpose:** Create the core Fastify server setup for the backend API
- **Value:** Establishes the foundation for all data processing, business logic, and API endpoints
- **Dependencies:** Builds on repository structure from Task 1

### Required Knowledge
- **Key Documents:** backend.md, mastersummary.md
- **Technical Prerequisites:** Fastify 5.2+, TypeScript 5.4, Node.js 22.3+

### Implementation Sub-Tasks

#### Sub-Task 1: Fastify Server Setup ⭐️ *PRIORITY*

**Goal:** Create a Fastify server with TypeScript for the backend API

**Directory/File Structure:**
```
apps/backend/
├── src/
│   ├── api/               # API route handlers
│   │   ├── battles/       # Battle-related endpoints
│   │   ├── content/       # Content management endpoints
│   │   ├── users/         # User management endpoints
│   │   └── token/         # Token and wallet endpoints
│   ├── services/          # Business logic services
│   ├── repositories/      # Data access layer
│   ├── models/            # Data models and schemas
│   ├── lib/               # Shared utilities
│   ├── websockets/        # WebSocket handlers
│   ├── middleware/        # HTTP middleware
│   ├── config/            # Application configuration
│   └── index.ts           # Application entry point
├── test/                  # Tests
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

**Key Pattern:**
```typescript
// src/index.ts
import Fastify from 'fastify'
import { logger } from './lib/logger'
import { loadConfig } from './config'
import { setupPlugins } from './plugins'
import { registerRoutes } from './api'

async function startServer() {
  try {
    const config = loadConfig()
    
    const fastify = Fastify({
      logger: true,
      trustProxy: true
    })
    
    // Register plugins (cors, helmet, etc.)
    await setupPlugins(fastify)
    
    // Register API routes
    await registerRoutes(fastify)
    
    await fastify.listen({ port: config.port, host: config.host })
    
    logger.info(`Server listening on ${config.host}:${config.port}`)
  } catch (err) {
    logger.error(err, 'Error starting server')
    process.exit(1)
  }
}

startServer()
```

**Essential Requirements:**
- Type-safe Fastify setup with proper configuration
- Environment-based configuration management
- Structured logging with pino
- Clear API route registration pattern

**Integration Points:**
- Authentication middleware will connect here
- Database connections will be managed by the server
- WebSocket support for real-time features

#### Sub-Task 2: API Route Pattern Implementation

**Goal:** Establish patterns for API route implementation

**Key Pattern:**
```typescript
// src/api/battles/index.ts
import { FastifyInstance } from 'fastify'
import { getBattles, getBattleById, createBattle } from './handlers'
import { getBattlesSchema, getBattleByIdSchema, createBattleSchema } from './schemas'
import { authenticate } from '../../middleware/auth'

export async function battleRoutes(fastify: FastifyInstance) {
  // Get all battles (public)
  fastify.get('/', {
    schema: getBattlesSchema,
    handler: getBattles
  })
  
  // Get battle by ID (public)
  fastify.get('/:id', {
    schema: getBattleByIdSchema,
    handler: getBattleById
  })
  
  // Create a battle (authenticated)
  fastify.post('/', {
    schema: createBattleSchema,
    preHandler: [authenticate],
    handler: createBattle
  })
}
```

**Essential Requirements:**
- Consistent route registration pattern
- Schema validation for requests and responses
- Separation of route definition from handlers
- Authentication middleware integration

#### Sub-Task 3: Error Handling Implementation

**Goal:** Implement a robust error handling system

**Key Pattern:**
```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('validation_error', message, 400, details)
  }
}

export class AuthError extends AppError {
  constructor(message: string, details?: any) {
    super('auth_error', message, 401, details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'not_found', 
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      404,
      { resource, id }
    )
  }
}
```

**Essential Requirements:**
- Hierarchical error classes for different error types
- Consistent error response format
- HTTP status code mapping
- Detailed error information for debugging

### Testing & Validation
- Server starts successfully and listens on configured port
- API endpoints respond with proper data structures
- Error handling returns appropriate status codes and messages
- Authentication middleware correctly protects routes

### Definition of Done
- [ ] Fastify server configured with TypeScript
- [ ] API route registration pattern established
- [ ] Error handling system implemented
- [ ] Basic middleware structure in place
- [ ] Server can be started in development mode

## Task 4: Database Integration

### Task Overview
- **Purpose:** Set up database connections and schema for data persistence
- **Value:** Enables data storage and retrieval for all platform features
- **Dependencies:** Requires backend foundation from Task 3

### Required Knowledge
- **Key Documents:** backend.md, mastersummary.md, appflow.md
- **Technical Prerequisites:** Supabase/PostgreSQL, Redis, TypeScript

### Implementation Sub-Tasks

#### Sub-Task 1: Supabase Connection Setup ⭐️ *PRIORITY*

**Goal:** Establish connection to Supabase/PostgreSQL for primary data storage

**Key Pattern:**
```typescript
// src/lib/db.ts
import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'
import { config } from '../config'

// Define types for tables
export type Database = {
  public: {
    Tables: {
      battles: {
        Row: {
          id: string
          title: string
          description: string
          battle_type: string
          status: 'draft' | 'scheduled' | 'open' | 'voting' | 'completed'
          creator_id: string
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          battle_type: string
          status: 'draft' | 'scheduled' | 'open' | 'voting' | 'completed'
          creator_id: string
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['battles']['Insert']>
      }
      // Additional tables defined here
    }
  }
}

// Create typed Supabase client
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.key
)

// Initialize and verify connection
export async function initDatabase() {
  try {
    const { data, error } = await supabase.from('battles').select('id').limit(1)
    
    if (error) throw error
    
    logger.info('Successfully connected to Supabase')
    return true
  } catch (err) {
    logger.error(err, 'Failed to connect to Supabase')
    throw err
  }
}
```

**Essential Requirements:**
- Type-safe Supabase client with table definitions
- Connection verification on startup
- Error handling for connection issues
- Configuration via environment variables

**Integration Points:**
- Repository pattern will use this Supabase client
- Authentication system will interact with user data
- API routes will access data through repositories

#### Sub-Task 2: Redis Configuration

**Goal:** Set up Redis for caching and real-time features

**Key Pattern:**
```typescript
// src/lib/redis.ts
import { Redis } from 'ioredis'
import { logger } from './logger'
import { config } from '../config'

export class RedisService {
  private client: Redis
  
  constructor() {
    this.client = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    })
    
    this.client.on('error', (err) => {
      logger.error(err, 'Redis client error')
    })
    
    this.client.on('connect', () => {
      logger.info('Redis client connected')
    })
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key)
      return data ? JSON.parse(data) : null
    } catch (err) {
      logger.error(err, `Error getting key ${key} from Redis`)
      return null
    }
  }
  
  async set<T>(key: string, value: T, expiry?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value)
      if (expiry) {
        await this.client.set(key, stringValue, 'EX', expiry)
      } else {
        await this.client.set(key, stringValue)
      }
    } catch (err) {
      logger.error(err, `Error setting key ${key} in Redis`)
    }
  }
}

export const redisService = new RedisService()
```

**Essential Requirements:**
- Redis client with connection error handling
- Helper methods for common operations
- Type-safe get and set operations
- Proper connection management and retries

#### Sub-Task 3: Repository Pattern Implementation

**Goal:** Create data access layer using repository pattern

**Key Pattern:**
```typescript
// src/repositories/base-repository.ts
import { supabase } from '../lib/db'
import { redisService } from '../lib/redis'
import { logger } from '../lib/logger'

export abstract class BaseRepository<T> {
  protected tableName: string
  protected cachePrefix: string
  protected cacheTtl: number = 3600 // 1 hour default
  
  constructor(tableName: string, cachePrefix: string) {
    this.tableName = tableName
    this.cachePrefix = cachePrefix
  }
  
  protected async getById(id: string): Promise<T | null> {
    // Try cache first
    const cacheKey = `${this.cachePrefix}:${id}`
    const cached = await redisService.get<T>(cacheKey)
    
    if (cached) {
      return cached
    }
    
    // If not in cache, get from database
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      logger.error(error, `Error fetching ${this.tableName} with id ${id}`)
      return null
    }
    
    // Cache the result
    if (data) {
      await redisService.set(cacheKey, data, this.cacheTtl)
    }
    
    return data as T
  }
  
  // Additional methods like create, update, delete, list, etc.
}
```

**Essential Requirements:**
- Abstract base repository with common operations
- Cache integration for performance
- Typed operations for type safety
- Error handling and logging

### Testing & Validation
- Database connection established successfully
- Redis connection and operations working
- Repository pattern correctly fetches and caches data
- Type definitions match database schema

### Definition of Done
- [ ] Supabase/PostgreSQL connection configured
- [ ] Redis service implemented
- [ ] Repository pattern established
- [ ] Basic schema definitions created
- [ ] Data access methods working and tested

## Task 5: Authentication Framework

### Task Overview
- **Purpose:** Implement user authentication and authorization
- **Value:** Enables user accounts, secure access, and personalized experiences
- **Dependencies:** Requires frontend and backend foundations from Tasks 2 and 3

### Required Knowledge
- **Key Documents:** setup-clerk-next.md, frontend.md, backend.md
- **Technical Prerequisites:** Clerk authentication, Next.js middleware, JWT tokens

### Implementation Sub-Tasks

#### Sub-Task 1: Clerk Authentication Setup ⭐️ *PRIORITY*

**Goal:** Integrate Clerk for user authentication

**Directory/File Structure:**
```
apps/frontend/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx
│   │   └── sign-up/
│   │       └── [[...sign-up]]/
│   │           └── page.tsx
│   └── ...
├── middleware.ts      # Next.js middleware for route protection
└── ...
```

**Key Pattern:**
```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/api/webhook/clerk',
    '/api/public(.*)',
    '/battle(.*)' // Public battle viewing
  ],
  ignoredRoutes: [
    '/api/webhook(.*)',
    '/_next/static/(.*)',
    '/favicon.ico',
  ]
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

**Essential Requirements:**
- Clerk authentication with Next.js integration
- Public and protected route configuration
- Sign-in and sign-up pages
- Webhook handling for auth events

**Integration Points:**
- Frontend components access auth state
- Backend API validates auth tokens
- User profiles linked to auth identities

#### Sub-Task 2: Frontend Auth Component Implementation

**Goal:** Create authentication UI components

**Key Pattern:**
```tsx
// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-wild-black">
      <div className="w-full max-w-md p-8 bg-zinc-900 rounded-lg shadow-lg">
        <h1 className="text-3xl font-display text-battle-yellow mb-6 text-center">
          Sign In
        </h1>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 
                'bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black',
              footerActionLink: 'text-battle-yellow hover:text-battle-yellow/90'
            }
          }}
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}
```

**Essential Requirements:**
- Customized Clerk components matching design system
- Clear sign-in and sign-up flows
- Error handling for auth operations
- Responsive design for all auth screens

#### Sub-Task 3: Backend Auth Middleware

**Goal:** Implement authentication middleware for backend API

**Key Pattern:**
```typescript
// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { clerkClient, getAuth } from '@clerk/fastify'
import { AuthError } from '../lib/errors'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      throw new AuthError('Authentication required')
    }
    
    // Add user to request for downstream handlers
    request.userId = userId
    
    // Optional: Fetch additional user data
    const user = await clerkClient.users.getUser(userId)
    request.user = user
    
  } catch (error) {
    request.log.error(error, 'Authentication error')
    throw new AuthError('Invalid authentication')
  }
}
```

**Essential Requirements:**
- Fastify middleware for auth verification
- Error handling for auth failures
- User information accessible in request handlers
- Role-based access control support

### Testing & Validation
- Users can sign up and sign in successfully
- Protected routes require authentication
- Auth tokens are properly validated
- User information is accessible in components and API handlers

### Definition of Done
- [ ] Clerk authentication integrated with Next.js
- [ ] Auth UI components implemented
- [ ] Middleware for route protection configured
- [ ] Backend auth validation implemented
- [ ] User session management working correctly

## Task 6: UI Component Foundation

### Task Overview
- **Purpose:** Establish the design system and core UI components
- **Value:** Creates a consistent, branded user experience across the platform
- **Dependencies:** Builds on frontend foundation from Task 2

### Required Knowledge
- **Key Documents:** design.md, frontend.md, mastersummary.md
- **Technical Prerequisites:** Tailwind CSS, shadcn/ui, CSS variables

### Implementation Sub-Tasks

#### Sub-Task 1: Tailwind CSS Configuration ⭐️ *PRIORITY*

**Goal:** Configure Tailwind CSS with custom design tokens

**Key Pattern:**
```javascript
// tailwind.config.js
import { fontFamily } from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
export const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        // Brand colors from design system
        "wild-black": "#121212",
        "battle-yellow": "#E9E336",
        "hype-white": "#FFFFFF",
        "victory-green": "#36E95C",
        "roast-red": "#E93636",
        "flow-blue": "#3654E9",
      },
      fontFamily: {
        display: ["var(--font-display)", ...fontFamily.sans],
        body: ["var(--font-body)", ...fontFamily.sans],
        accent: ["var(--font-accent)", ...fontFamily.sans],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-in",
        "fade-out": "fade-out 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

export default config
```

**Essential Requirements:**
- Custom color palette matching design system
- Font family configuration
- Animation definitions
- Container queries support
- Plugin integration for additional features

**Integration Points:**
- All UI components will use these design tokens
- Design tokens exposed as CSS variables for non-Tailwind use
- Animation definitions used for interactions

#### Sub-Task 2: Design Tokens Implementation

**Goal:** Implement CSS variables for design tokens

**Key Pattern:**
```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Colors */
    --color-wild-black: 18 18 18;
    --color-battle-yellow: 233 227 54;
    --color-hype-white: 255 255 255;
    --color-victory-green: 54 233 92;
    --color-roast-red: 233 54 54;
    --color-flow-blue: 54 84 233;
    
    /* Typography */
    --font-display: "Knockout", "Arial Black", sans-serif;
    --font-body: "Inter", Arial, sans-serif;
    --font-accent: "Druk", Impact, sans-serif;
    
    /* Spacing */
    --spacing: 0.25rem;
    
    /* Animation */
    --duration-instant: 100ms;
    --duration-quick: 200ms;
    --duration-standard: 300ms;
    --duration-emphasis: 450ms;
    --duration-celebration: 800ms;
    
    --easing-standard: cubic-bezier(0.2, 0, 0, 1);
    --easing-energetic: cubic-bezier(0.2, 0, 0, 1.3);
    --easing-bounce: cubic-bezier(0.15, 1.15, 0.5, 1);
  }
}
```

**Essential Requirements:**
- CSS variables defined for all design tokens
- Proper color definition for Tailwind
- Typography variables for consistent text styling
- Animation tokens for consistent motion design

#### Sub-Task 3: Core Component Library

**Goal:** Implement essential UI components using design tokens

**Key Pattern:**
```tsx
// components/ui/card.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "subtle"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-zinc-900 border-zinc-800",
      outline: "bg-transparent border-zinc-800",
      subtle: "bg-zinc-950/50 border-transparent"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border shadow-sm",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-hype-white/60", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

**Essential Requirements:**
- Core components (Button, Card, Input, etc.)
- Consistent styling using design tokens
- Proper TypeScript typing
- Accessibility attributes and styling

### Testing & Validation
- Design tokens render correctly across components
- Components adapt to different screen sizes
- Components meet accessibility requirements
- Components match design system specifications

### Definition of Done
- [ ] Tailwind CSS configured with design tokens
- [ ] CSS variables implemented for all design elements
- [ ] Core UI component library created
- [ ] Components render correctly and are accessible
- [ ] Design system documentation created

## Task 7: State Management Architecture

### Task Overview
- **Purpose:** Establish patterns for state management across the application
- **Value:** Creates consistent, predictable data flow throughout the application
- **Dependencies:** Builds on frontend foundation from Task 2

### Required Knowledge
- **Key Documents:** frontend.md, appflow.md
- **Technical Prerequisites:** React Server Components, Zustand, React Query

### Implementation Sub-Tasks

#### Sub-Task 1: Server Component Data Patterns ⭐️ *PRIORITY*

**Goal:** Establish patterns for data fetching in Server Components

**Key Pattern:**
```tsx
// lib/data/battles.ts
import { cache } from 'react'
import { notFound } from 'next/navigation'

// Cacheable data fetching function
export const getBattle = cache(async (battleId: string) => {
  try {
    const response = await fetch(`${process.env.API_URL}/api/battles/${battleId}`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch battle: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching battle:', error)
    throw error
  }
})

// Server Component using cached data function
export async function BattleDetails({ battleId }: { battleId: string }) {
  const battle = await getBattle(battleId)
  
  if (!battle) {
    notFound()
  }
  
  return (
    <div className="battle-details">
      <h1 className="text-2xl font-display text-hype-white">{battle.title}</h1>
      <p className="text-hype-white/70">{battle.description}</p>
      {/* Client components for interactivity */}
      <BattleActions battleId={battle.id} status={battle.status} />
    </div>
  )
}
```

**Essential Requirements:**
- `cache` function for deduplicating requests
- Revalidation strategy for cache freshness
- Error handling and fallbacks
- Not found handling for missing data

**Integration Points:**
- Server Components use these data fetching patterns
- Client Components receive data via props
- API endpoints provide the data being fetched

#### Sub-Task 2: Client-Side State Management

**Goal:** Implement client-side state management with Zustand

**Key Pattern:**
```typescript
// lib/state/battle-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BattleState = {
  viewedBattles: string[]
  activeBattleId: string | null
  votedEntries: Record<string, string>
  
  setActiveBattle: (battleId: string | null) => void
  addViewedBattle: (battleId: string) => void
  recordVote: (battleId: string, entryId: string) => void
}

export const useBattleStore = create<BattleState>()(
  persist(
    (set) => ({
      viewedBattles: [],
      activeBattleId: null,
      votedEntries: {},
      
      setActiveBattle: (battleId) => set({ activeBattleId: battleId }),
      
      addViewedBattle: (battleId) => 
        set((state) => ({
          viewedBattles: state.viewedBattles.includes(battleId)
            ? state.viewedBattles
            : [...state.viewedBattles, battleId]
        })),
      
      recordVote: (battleId, entryId) =>
        set((state) => ({
          votedEntries: {
            ...state.votedEntries,
            [battleId]: entryId
          }
        }))
    }),
    {
      name: 'battle-store',
      partialize: (state) => ({
        viewedBattles: state.viewedBattles,
        votedEntries: state.votedEntries
      })
    }
  )
)
```

**Essential Requirements:**
- Zustand store with TypeScript typing
- Persistence for relevant state
- Action creators for state updates
- Clear separation of concerns

#### Sub-Task 3: Form Handling Implementation

**Goal:** Create pattern for form handling with React hooks

**Key Pattern:**
```tsx
// lib/actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Form schema
const createBattleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  battleType: z.enum(["wildStyle", "pickUpKillIt", "rAndBeef"]),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End time must be a valid date"
  })
})

// Server action
export async function createBattle(prevState: any, formData: FormData) {
  try {
    // Validate form data
    const battleData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      battleType: formData.get('battleType') as string,
      endTime: formData.get('endTime') as string
    }
    
    const validatedData = createBattleSchema.safeParse(battleData)
    
    if (!validatedData.success) {
      return {
        success: false,
        errors: validatedData.error.flatten().fieldErrors
      }
    }
    
    // Submit to API
    const response = await fetch(`${process.env.API_URL}/api/battles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedData.data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        errors: { 
          form: error.message || 'Failed to create battle'
        }
      }
    }
    
    const battle = await response.json()
    
    // Revalidate the battles list page
    revalidatePath('/battle')
    
    // Redirect to the new battle
    redirect(`/battle/${battle.id}`)
  } catch (error) {
    return {
      success: false,
      errors: { 
        form: 'An unexpected error occurred'
      }
    }
  }
}
```

**Essential Requirements:**
- Server Actions for form submission
- Zod schema validation for form data
- Type-safe error handling and responses
- Revalidation and redirect patterns

### Testing & Validation
- Server Components fetch and display data correctly
- Client-side state persists as expected
- Forms submit data and display errors correctly
- State updates trigger appropriate UI updates

### Definition of Done
- [ ] Server Component data patterns established
- [ ] Client-side state management implemented
- [ ] Form handling patterns created
- [ ] State architecture documented
- [ ] Example components demonstrate correct state usage

## Task 8: Blockchain Connection Layer

### Task Overview
- **Purpose:** Implement blockchain integration for token functionality
- **Value:** Enables token display, wallet connection, and transactions
- **Dependencies:** Requires frontend and backend foundations from Tasks 2 and 3

### Required Knowledge
- **Key Documents:** mastersummary.md, frontend.md, backend.md
- **Technical Prerequisites:** Web3.js, Solana blockchain, wallet integration

### Implementation Sub-Tasks

#### Sub-Task 1: Web3.js Integration ⭐️ *PRIORITY*

**Goal:** Set up the blockchain connection library

**Key Pattern:**
```typescript
// lib/blockchain/web3.ts
import * as web3 from '@solana/web3.js'
import { TokenAmount, TOKEN_PROGRAM_ID } from '@solana/spl-token'

// Connection to Solana network
const connection = new web3.Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
)

// WILDNOUT token mint address
const WILDNOUT_TOKEN_MINT = new web3.PublicKey(
  process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS!
)

// Get token balance for a wallet
export async function getTokenBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new web3.PublicKey(walletAddress)
    
    // Find token account
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    )
    
    // Find the account for our token
    const tokenAccount = tokenAccounts.value.find(
      account => account.account.data.parsed.info.mint === WILDNOUT_TOKEN_MINT.toString()
    )
    
    if (!tokenAccount) {
      return 0
    }
    
    // Return the balance
    const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount
    return balance
  } catch (error) {
    console.error('Error getting token balance:', error)
    return 0
  }
}

// Get token price from external API
export async function getTokenPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/token/price`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token price: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.price
  } catch (error) {
    console.error('Error fetching token price:', error)
    return 0
  }
}
```

**Essential Requirements:**
- Web3.js setup for Solana blockchain
- Connection configuration with fallbacks
- Token-specific functionality
- Error handling for blockchain operations

**Integration Points:**
- Wallet connection will use this foundation
- Token display components will fetch data
- Backend API may use for additional verification

#### Sub-Task 2: Wallet Connection Implementation

**Goal:** Create the wallet connection system

**Key Pattern:**
```tsx
// components/wallet/wallet-provider.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'

// Default to devnet
const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet')

// Set up wallet adapters
const wallets = [
  new PhantomWalletAdapter()
]

// Create a context for simplifying access to wallet
type WalletContextType = {
  connected: boolean
  connecting: boolean
  publicKey: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  connecting: false,
  publicKey: null,
  connect: async () => {},
  disconnect: async () => {}
})

export function useWallet() {
  return useContext(WalletContext)
}

// Wallet provider component
export function WalletConnectionProvider({ children }: { children: React.ReactNode }) {
  // Implementation for wallet connection logic
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContext.Provider value={/* wallet state and methods */}>
            {children}
          </WalletContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

**Essential Requirements:**
- Wallet adapter setup for Phantom wallet
- Connection provider for Solana network
- Context for simplified wallet state access
- Connection and disconnection management

#### Sub-Task 3: Token Data Retrieval

**Goal:** Implement token data fetching for UI

**Key Pattern:**
```tsx
// components/token/token-price-display.tsx
'use client'

import { useEffect, useState } from 'react'
import { getTokenPrice } from '@/lib/blockchain/web3'
import { formatCurrency } from '@/lib/utils'

export function TokenPriceDisplay() {
  const [price, setPrice] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let isMounted = true
    
    async function fetchPrice() {
      try {
        const data = await getTokenPrice()
        
        if (isMounted) {
          setPrice(data.price)
          setChange(data.change24h)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching token price:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchPrice()
    
    // Refresh price every 60 seconds
    const interval = setInterval(fetchPrice, 60000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])
  
  if (loading) {
    return <div className="animate-pulse bg-zinc-800 h-6 w-24 rounded"></div>
  }
  
  return (
    <div className="flex items-center">
      <div className="font-medium">{formatCurrency(price || 0)}</div>
      {change !== null && (
        <div className={`ml-2 text-sm ${change >= 0 ? 'text-victory-green' : 'text-roast-red'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  )
}
```

**Essential Requirements:**
- Real-time token price display
- Price trend indicators
- Loading states and error handling
- Periodic data refresh

### Testing & Validation
- Web3.js connection established successfully
- Wallet connection flow works correctly
- Token data is fetched and displayed properly
- Error states handled gracefully

### Definition of Done
- [ ] Web3.js integration configured
- [ ] Wallet connection system implemented
- [ ] Token data retrieval working
- [ ] Transaction handling foundations established
- [ ] Components for blockchain interaction created

## Task 9: Testing Framework

### Task Overview
- **Purpose:** Establish testing patterns and tools for quality assurance
- **Value:** Ensures code quality, reliability, and reduces regressions
- **Dependencies:** All other foundation tasks provide code to test

### Required Knowledge
- **Key Documents:** frontend.md, backend.md
- **Technical Prerequisites:** Jest, React Testing Library, Supertest

### Implementation Sub-Tasks

#### Sub-Task 1: Jest Configuration ⭐️ *PRIORITY*

**Goal:** Set up Jest for frontend and backend testing

**Key Pattern:**
```javascript
// apps/frontend/jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

**Essential Requirements:**
- Jest configuration for Next.js frontend
- Similar configuration for Fastify backend
- Module path aliases for import simplification
- Coverage configuration for tracking test coverage

**Integration Points:**
- CI/CD pipeline will run these tests
- Developers will run tests during development
- Pre-commit hooks may run tests before commits

#### Sub-Task 2: Frontend Test Patterns

**Goal:** Establish test patterns for React components

**Key Pattern:**
```tsx
// components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })
  
  it('applies variant styles correctly', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button', { name: /secondary/i })
    expect(button).toHaveClass('bg-flow-blue')
  })
  
  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.getByRole('button')).toContainElement(
      screen.getByTestId('loading-spinner')
    )
  })
  
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button', { name: /click me/i }))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

**Essential Requirements:**
- Component rendering tests
- Interaction tests
- State changes and props testing
- Accessibility testing

#### Sub-Task 3: Backend Test Patterns

**Goal:** Establish test patterns for API endpoints

**Key Pattern:**
```typescript
// api/battles/routes.test.ts
import { build } from '../../test/helpers'
import { prisma } from '../../lib/db'

describe('Battles API', () => {
  let app
  
  beforeAll(async () => {
    // Build the Fastify app with test configuration
    app = await build()
  })
  
  beforeEach(async () => {
    // Clean up test database
    await prisma.battle.deleteMany()
  })
  
  afterAll(async () => {
    await app.close()
  })
  
  describe('GET /api/battles', () => {
    it('returns a list of battles', async () => {
      // Create test data
      await prisma.battle.createMany({
        data: [
          {
            id: 'test-battle-1',
            title: 'Test Battle 1',
            description: 'Description 1',
            battleType: 'wildStyle',
            status: 'open',
            creatorId: 'user-1',
            startTime: new Date(),
            endTime: new Date(Date.now() + 86400000)
          },
          {
            id: 'test-battle-2',
            title: 'Test Battle 2',
            description: 'Description 2',
            battleType: 'pickUpKillIt',
            status: 'open',
            creatorId: 'user-2',
            startTime: new Date(),
            endTime: new Date(Date.now() + 86400000)
          }
        ]
      })
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/battles'
      })
      
      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.payload)
      expect(body.data).toHaveLength(2)
      expect(body.data[0].title).toBe('Test Battle 1')
      expect(body.data[1].title).toBe('Test Battle 2')
    })
  })
})
```

**Essential Requirements:**
- API endpoint testing
- Database integration testing
- Authentication testing
- Error handling testing

### Testing & Validation
- Jest runs successfully for frontend and backend
- Test coverage reports generated
- Test patterns established for components and APIs
- CI/CD integration works for automated testing

### Definition of Done
- [ ] Jest configured for frontend and backend
- [ ] Frontend test patterns established
- [ ] Backend test patterns established
- [ ] Test utilities and helpers created
- [ ] Initial tests implemented for core components

## Task 10: Development Environment

### Task Overview
- **Purpose:** Set up consistent development environments and workflows
- **Value:** Enables efficient development with standardized tools and processes
- **Dependencies:** All other foundation tasks establish code that needs development tooling

### Required Knowledge
- **Key Documents:** frontend.md, backend.md
- **Technical Prerequisites:** npm/yarn, environment variables, ESLint

### Implementation Sub-Tasks

#### Sub-Task 1: Development Server Configuration ⭐️ *PRIORITY*

**Goal:** Configure development servers for frontend and backend

**Key Pattern:**
```json
// apps/frontend/package.json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@clerk/nextjs": "latest",
    "next": "15.2.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tailwindcss": "4.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.2",
    "@testing-library/react": "^14.0.0",
    "@types/jest": "^29.5.4",
    "@types/node": "^20.5.7",
    "@types/react": "^18.2.21",
    "eslint": "^8.48.0",
    "eslint-config-next": "^14.0.0",
    "jest": "^29.6.4",
    "jest-environment-jsdom": "^29.6.4",
    "typescript": "^5.4.2"
  }
}
```

**Essential Requirements:**
- Development script configuration
- Build and test scripts
- Hot module replacement enabled
- Proper dependency management

**Integration Points:**
- CI/CD pipeline will use these scripts
- Developers will use for local development
- Test framework will use these configurations

#### Sub-Task 2: Environment Variable Management

**Goal:** Set up environment variable management and templates

**Key Pattern:**
```
# .env.example (frontend)
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_*****
CLERK_SECRET_KEY=sk_test_*****

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Blockchain
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_TOKEN_MINT_ADDRESS=SomeTokenAddressHere
```

**Essential Requirements:**
- Environment variable templates for frontend and backend
- Documentation for required variables
- Development and production environment separation
- Secure handling of sensitive values

#### Sub-Task 3: Code Quality Tools

**Goal:** Set up linting and formatting tools

**Key Pattern:**
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks', 'jsx-a11y'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
```

**Essential Requirements:**
- ESLint configuration for code quality
- Prettier configuration for formatting
- TypeScript linting rules
- Accessibility linting rules

### Testing & Validation
- Development servers start successfully
- Environment variables are properly loaded
- Linting and formatting work correctly
- Development workflows documented

### Definition of Done
- [ ] Development server configuration complete
- [ ] Environment variable management established
- [ ] Code quality tools configured
- [ ] Development workflows documented
- [ ] Local development tested end-to-end

# Phase 1 Summary

This phase has established the essential foundation for the Wild 'n Out Meme Coin Platform, including:

1. **Project Repository Structure**: Monorepo setup with shared packages
2. **Next.js Frontend Foundation**: App Router architecture with server components
3. **Fastify Backend Foundation**: High-performance API server with TypeScript
4. **Database Integration**: Supabase/PostgreSQL and Redis for data persistence
5. **Authentication Framework**: Clerk integration for secure user management
6. **UI Component Foundation**: Tailwind CSS with design tokens for brand consistency
7. **State Management Architecture**: Server/client data patterns for optimal performance
8. **Blockchain Connection Layer**: Web3.js integration for Solana blockchain
9. **Testing Framework**: Jest configuration for frontend and backend testing
10. **Development Environment**: Consistent tooling and workflows for development

These components work together to create a solid foundation for building the feature-rich platform described in the project requirements. The next phase will focus on implementing the core features on top of this foundation.

## Implementation Map

```
┌──────────────────────┐   ┌────────────────────┐   ┌───────────────────┐
│ Project Structure    │   │    Frontend        │   │     Backend       │
│ └── Monorepo         │◄──┼───┬────────────┐   │   │   ┌─────────────┐ │
│ └── TypeScript       │   │   │ Next.js    │   │   │   │ Fastify     │ │
│ └── Turborepo        │   │   │ App Router │   │   │   │ API Routes  │ │
└─────┬────────────────┘   │   └────────────┘   │   │   └─────────────┘ │
      │                    │   ┌────────────┐   │   │   ┌─────────────┐ │
      │      ┌─────────────┼───┤ Components │   │   │   │ Services    │ │
      │      │             │   └────────────┘   │   │   └─────────────┘ │
      │      │             └─────────┬──────────┘   └────────┬──────────┘
      │      │                       │                       │
┌─────▼──────▼───────┐    ┌──────────▼───────────┐   ┌──────▼───────────┐
│ Database           │    │ Authentication       │   │ Blockchain       │
│ ┌───────────────┐ │    │ ┌──────────────────┐ │   │ ┌───────────────┐ │
│ │ Supabase      │ │    │ │ Clerk            │ │   │ │ Web3.js       │ │
│ └───────────────┘ │    │ └──────────────────┘ │   │ └───────────────┘ │
│ ┌───────────────┐ │    │ ┌──────────────────┐ │   │ ┌───────────────┐ │
│ │ Redis         │ │    │ │ Route Protection │ │   │ │ Wallet Connect│ │
│ └───────────────┘ │    │ └──────────────────┘ │   │ └───────────────┘ │
└────────────────────┘    └──────────────────────┘   └───────────────────┘
```

## Technical Decision Log

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| Repository Structure | Monorepo vs. Multiple repos | Monorepo with Turborepo | Better code sharing, simplified dependencies, coordinated versioning |
| Frontend Framework | Next.js vs. Remix vs. Vite | Next.js 15.2+ | App Router, Server Components, streaming, built-in optimizations |
| Backend Framework | Express vs. NestJS vs. Fastify | Fastify 5.2+ | Superior performance, schema validation, plugin system |
| Database | PostgreSQL vs. MongoDB vs. Firebase | Supabase (PostgreSQL) | Relational data model, real-time capabilities, managed service |
| Authentication | Custom vs. Auth0 vs. Clerk | Clerk | Comprehensive auth features, easy integration, security best practices |
| UI Framework | MUI vs. Shadcn vs. Custom | Tailwind + Shadcn/ui | Maximum flexibility, performance, matches design system needs |
| State Management | Redux vs. Zustand vs. Context | Server Components + Zustand | Optimal performance, simplified state management, ideal for React 19 |
| Testing Framework | Jest vs. Vitest | Jest | Industry standard, comprehensive ecosystem, good Next.js integration |
| Blockchain Library | Web3.js vs. ethers.js | Web3.js | Better Solana support, more comprehensive documentation |

## Phase 2 Handover Guide

### Frontend Development Ready for:
- Implementing Battle feature components
- Creating Community section components
- Building Token Hub interface
- Implementing Profile features
- Developing Creation Studio components

### Backend Development Ready for:
- Building Battle API endpoints
- Implementing Community features
- Creating Token-related services
- Developing User profile endpoints
- Building Content moderation services

### Key Integration Points:
- Authentication with Clerk is ready for frontend/backend integration
- Database models are prepared for feature implementation
- UI components are available for building feature interfaces
- Blockchain connection is ready for token functionality
- Testing framework is set up for ongoing quality assurance

Use this foundation to implement the core features described in the project documents, following the established patterns and architecture.