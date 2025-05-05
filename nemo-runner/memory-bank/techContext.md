# NEMO Runner Technical Context

## Core Technologies

### Frontend Framework
- **Next.js 14+**: App Router framework for both client and server-rendered components
  - Server components for data-fetching operations
  - Client components for interactive game elements
  - API routes for leaderboard and game state management
  - Middleware for authentication protection
  - File-based routing for seamless navigation

### Game Rendering
- **Three.js**: 3D rendering library for WebGL-based game visualization
  - Core rendering engine for 2.5D underwater environment
  - Camera management and perspective control
  - Lighting and underwater effects
  - Physics-based animation system
  - Particle systems for environmental effects
  - Collision detection and object interaction

### State Management
- **React Context API**: For UI-related state management
- **Custom game state management**: For high-performance game loop
- **Zustand**: Lightweight state management for global app state

### Authentication
- **Clerk**: Complete authentication and user management solution
  - User sign-up and login
  - Social authentication providers
  - JWT token management
  - Session persistence
  - User profile management
  - Protected routes and resource access

### Data Storage
- **Supabase/Neon PostgreSQL**: Database for persistent storage
  - Player profiles and statistics
  - Leaderboard data with historical tracking
  - Game configuration parameters
  - Usage limits and tracking
  - Analytics and performance data

### Asset Management
- **Vercel Blob Storage**: For game assets and media
  - 3D models and textures
  - Audio files
  - Environmental maps
  - User-generated content

### Hosting & Deployment
- **Vercel**: For seamless deployment and hosting
  - Continuous deployment from GitHub
  - Preview environments for testing
  - Edge functions for global performance
  - Analytics and monitoring

## Dependencies & Libraries

### Production Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "@clerk/nextjs": "^4.29.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.4.0",
    "framer-motion": "^10.16.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "date-fns": "^2.30.0",
    "zod": "^3.22.0"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.10.0",
    "@types/three": "^0.160.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.1.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "cypress": "^13.6.0"
  }
}
```

## Technical Constraints

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Browsers**: iOS Safari, Android Chrome (latest 2 versions)
- **WebGL Support**: Required for Three.js rendering
- **JavaScript**: ES6+ features with appropriate polyfills via Next.js

### Performance Requirements
- **Frame Rate**: 30+ FPS minimum, targeting 60 FPS on mid to high-end devices
- **Load Time**: Initial load under 5 seconds on standard connections
- **Memory Usage**: Under 300MB RAM usage
- **Battery Impact**: Optimized for mobile device battery life

### Responsive Design
- **Desktop**: 1920x1080 down to 1280x720 resolution
- **Tablet**: iPad and similar devices in both orientations
- **Mobile**: Down to 320px width, optimized for portrait orientation
- **High-DPI**: Support for Retina and similar high-density displays

### Network Requirements
- **Initial Load**: Under 5MB total download size
- **Data Usage**: Minimal API calls for leaderboard updates
- **Offline Support**: Basic gameplay without leaderboard features

## Development Environment

### Setup Requirements
- Node.js v18+
- npm/yarn/pnpm for package management
- Git for version control
- Local development server (provided by Next.js)
- WebGL-capable browser

### Configuration
- **Environment Variables**:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_SUPABASE_URL=https://...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  BLOB_READ_WRITE_TOKEN=...
  ```

- **Next.js Configuration** (next.config.js):
  ```javascript
  module.exports = {
    images: {
      domains: ['assets.nemo-runner.vercel.app'],
    },
    webpack: (config) => {
      config.module.rules.push({
        test: /\.(glb|gltf)$/,
        use: {
          loader: 'file-loader',
        },
      });
      return config;
    },
  };
  ```

### Development Workflow
1. Local development with `npm run dev`
2. Automated testing with Jest and Testing Library
3. End-to-end testing with Cypress
4. Preview deploys for feature branches
5. Production deployment via Vercel

### Testing Strategy
- **Unit Tests**: Core game logic and utility functions
- **Component Tests**: UI components and interactions
- **Integration Tests**: Game mechanics and systems interaction
- **End-to-End Tests**: Player journeys and leaderboard functionality
- **Performance Testing**: FPS monitoring and memory usage

## Tool Usage Patterns

### Three.js Implementation
- Canvas configuration with WebGL renderer
- Scene setup with underwater lighting
- Camera positioning for 2.5D perspective
- Object loading and management
- Animation system for character movement
- Particle systems for water effects

### Clerk Authentication Flow
```javascript
// Protect routes with middleware
export default authMiddleware({
  publicRoutes: ["/", "/game", "/leaderboard", "/api/leaderboard/:path*"],
  ignoredRoutes: ["/api/public/:path*"],
});

// In protected API routes
export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Handle authenticated request
}
```

### Supabase Database Operations
```typescript
// Initialize client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Query leaderboard data
async function getDailyLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, user_id, username, score, created_at')
    .eq('timeframe', 'daily')
    .order('score', { ascending: false })
    .limit(20);
    
  if (error) throw error;
  return data;
}
```

### Game Loop Implementation
```typescript
class GameLoop {
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private updateFn: (deltaTime: number) => void;
  
  constructor(updateFn: (deltaTime: number) => void) {
    this.updateFn = updateFn;
  }
  
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }
  
  public stop(): void {
    this.isRunning = false;
  }
  
  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;
    
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.updateFn(deltaTime);
    
    requestAnimationFrame(this.gameLoop);
  }
}
```

## Environment Configurations

### Development
- Hot module replacement enabled
- Detailed error reporting
- Mock data for leaderboards
- Relaxed game limits for testing
- Debug utilities and performance monitoring
- Local database or development instance

### Staging
- Production-like environment
- Data persistence between deployments
- Access restricted to development team
- Realistic game limits and behavior
- Performance metrics collection
- Integrated with staging database

### Production
- Optimized builds for performance
- Error logging and monitoring
- Real user metrics collection
- Full security measures
- CDN caching for static assets
- Connection to production database
- SOL reward distribution enabled