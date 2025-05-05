# $NEMO Runner Technical Context

## Technology Stack

The NEMO Runner game is built using the following key technologies:

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.3.1+ | Application framework with App Router and server components |
| React | 19+ | UI component library |
| Three.js | 0.176.0+ | 3D rendering engine |
| TypeScript | 5.4.0+ | Type-safe JavaScript |
| Clerk | API v2025-04-10 | Authentication and user management |
| Neon PostgreSQL | 16 | Serverless database |
| Drizzle ORM | 0.43.1+ | Type-safe database access |
| Vercel | Latest | Hosting and deployment platform |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code quality and style enforcement |
| Prettier | Code formatting |
| Jest | Unit testing |
| Cypress | End-to-end testing |
| GitHub Actions | CI/CD workflows |
| Vercel Analytics | Performance and usage monitoring |

## Dependency Details

### Frontend Dependencies

- **Three.js Ecosystem**:
  - `three`: Core 3D rendering library
  - Additional Three.js modules for:
    - Controls (OrbitControls during development)
    - Loaders (GLTFLoader, TextureLoader)
    - Post-processing effects
    - Math utilities (SimplexNoise for procedural generation)

- **React/Next.js Ecosystem**:
  - React hooks for state management
  - Next.js App Router for routing
  - Next.js API routes for backend functionality
  - React Server Components for data fetching
  - Client Components for interactive elements

- **UI Framework**:
  - Custom UI components built from scratch
  - Tailwind CSS for styling (optional)

### Backend Dependencies

- **Database**:
  - `@neondatabase/serverless`: Neon PostgreSQL client
  - `drizzle-orm`: Type-safe ORM
  - `drizzle-kit`: Migration and schema tools

- **Authentication**:
  - Clerk SDK for authentication
  - JWT token handling

- **Utilities**:
  - `zod`: Schema validation
  - `date-fns`: Date manipulation
  - `nanoid`: ID generation

## Technical Architecture

### Rendering Architecture

The game uses Three.js as its rendering engine with the following architecture:

```
┌───────────────────────────────────────────────────────────────┐
│                       Rendering Engine                        │
├───────────────┬───────────────┬───────────────┬───────────────┤
│    Shaders    │     Scene     │    Camera     │   Renderer    │
│   Management  │   Management  │   Control     │  Configuration │
├───────────────┴───────┬───────┴───────────────┴───────────────┤
│                  Performance Optimization                     │
│   (Object pooling, LOD, Instancing, Occlusion culling)       │
├───────────────────────┴───────────────────────────────────────┤
│                        Asset Pipeline                         │
└───────────────────────────────────────────────────────────────┘
```

- **Shader Management**: Custom GLSL shaders for water effects, character animations, and special effects
- **Scene Management**: Efficient scene graph organization and object pooling
- **Camera Control**: Dynamic camera positioning and smooth transitions
- **Renderer Configuration**: WebGL2 settings optimization for various devices
- **Performance Optimization**: Techniques for maintaining 60fps across device ranges
- **Asset Pipeline**: Efficient loading and management of 3D models, textures, and audio

### Database Schema

```typescript
// Users table (extends Clerk user data)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  username: text('username').notNull().unique(),
  walletAddress: text('wallet_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Game scores table
export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  score: integer('score').notNull(),
  distance: integer('distance').notNull(),
  playedAt: timestamp('played_at').defaultNow().notNull(),
  environment: text('environment'), // which environment was played
  verified: boolean('verified').default(true),
});

// Leaderboard materialized views (refreshed on schedule)
export const dailyLeaderboard = pgTable('daily_leaderboard_view', {
  userId: text('user_id').notNull(),
  username: text('username').notNull(),
  highScore: integer('high_score').notNull(),
  rank: integer('rank').notNull(),
});
```

### API Routes

```
/api/auth/*                  # Clerk authentication endpoints
/api/scores                  # Score submission and retrieval
/api/scores/verify           # Score verification
/api/leaderboard/daily       # Daily leaderboard data
/api/leaderboard/weekly      # Weekly leaderboard data
/api/leaderboard/monthly     # Monthly leaderboard data
/api/user/profile            # User profile data
/api/user/stats              # User game statistics
/api/rewards                 # Reward distribution status
```

## Development Setup

### Local Development Environment

1. **Prerequisites**:
   - Node.js 18.17.0 or later
   - Yarn or npm
   - Git

2. **Environment Variables**:
   ```
   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   
   # Database (Neon PostgreSQL)
   DATABASE_URL=
   
   # General
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Installation Steps**:
   ```bash
   # Clone repository
   git clone <repository-url>
   cd nemo-runner
   
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env.local
   # Edit .env.local with your values
   
   # Run database migrations
   npm run db:migrate
   
   # Start development server
   npm run dev
   ```

4. **Key Commands**:
   - `npm run dev`: Start development server
   - `npm run build`: Build production version
   - `npm run start`: Start production server
   - `npm run lint`: Run linting
   - `npm run test`: Run tests
   - `npm run db:migrate`: Run database migrations
   - `npm run db:studio`: Open Drizzle Studio for database management

### Production Environment

The application is deployed on Vercel with the following configuration:

1. **Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node.js Version: 18.x

2. **Environment Variables**:
   - Same as development environment
   - Additional production-specific variables

3. **Integration Points**:
   - Neon PostgreSQL: Production database
   - Clerk: Authentication provider
   - Vercel Analytics: Performance monitoring
   - Vercel Blob Storage: Asset storage (if needed)

## Performance Optimization

### Rendering Optimizations

- **Level of Detail (LOD)**: Multiple detail levels for objects based on distance
- **Object Pooling**: Reuse obstacle and collectible objects instead of creating/destroying
- **Instanced Meshes**: Using instancing for repeated elements (bubbles, coral, pebbles)
- **Occlusion Culling**: Only render objects visible to the camera
- **Texture Atlasing**: Combine multiple textures to reduce draw calls

### Network Optimizations

- **Data Minimization**: Only essential data transferred between client and server
- **Efficient Leaderboard Queries**: Pagination and cached materialized views
- **Incremental Static Regeneration**: For static content portions

### Database Optimizations

- **Materialized Views**: Pre-calculated leaderboards refreshed on schedule
- **Connection Pooling**: Optimized for serverless environments
- **Efficient Indexing**: Strategic indexes for high-performance queries

## Technical Constraints

### Browser Compatibility

- **Supported Browsers**:
  - Chrome 90+
  - Firefox 90+
  - Safari 14+
  - Edge 90+
  - Mobile Safari and Chrome for Android

- **WebGL Support**:
  - WebGL 2.0 support required for optimal experience
  - WebGL 1.0 fallback for older browsers with reduced visual quality

### Device Requirements

- **Minimum Requirements**:
  - CPU: Dual-core processor, 1.5 GHz
  - RAM: 2GB
  - GPU: Integrated graphics with WebGL support
  - Screen: 320px minimum width
  - Input: Touch or keyboard

- **Recommended Requirements**:
  - CPU: Quad-core processor, 2.0 GHz+
  - RAM: 4GB+
  - GPU: Dedicated graphics with WebGL 2.0 support
  - Screen: 768px+ width
  - Input: Touch or keyboard

### Performance Targets

| Device Category | Target FPS | Visual Quality | Special Considerations |
|-----------------|-----------|----------------|--------------------------|
| High-end Desktop | 60+ | Maximum | Enhanced particle effects, high-res textures |
| Mid-range Desktop | 60 | High | Standard effects, optimized textures |
| Low-end Desktop | 30-60 | Medium | Reduced effects, simplified lighting |
| High-end Mobile | 60 | High | Touch optimization, battery considerations |
| Mid-range Mobile | 30-60 | Medium | Reduced draw distance, simplified effects |
| Low-end Mobile | 30 | Low | Minimal effects, critical features only |

## Deployment Process

### Continuous Integration

- GitHub Actions workflow for:
  - Code linting
  - Type checking
  - Unit testing
  - Build verification

### Continuous Deployment

- Vercel integration with GitHub for:
  - Preview deployments for pull requests
  - Production deployments on merge to main branch
  - Automatic rollbacks on failed deployments

### Database Migration

- Migrations generated with `drizzle-kit generate`
- Migrations applied using `drizzle-kit push`
- Safe schema changes to prevent production downtime

## Monitoring & Analytics

- **Error Tracking**: Vercel Error Tracking
- **Performance Monitoring**: Vercel Analytics and custom metrics
- **Usage Analytics**: Custom event tracking for:
  - Game sessions
  - Feature usage
  - Conversion metrics
  - Retention indicators