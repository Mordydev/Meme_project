nemo-runner/
├── src/
│   ├── app/                     # Next.js App Router: Pages and API routes
│   │   ├── (game)/              # Route group for game-related pages
│   │   │   └── play/
│   │   │       └── page.tsx     # Main game page hosting GameCanvas
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page (if any)
│   │
│   ├── components/              # General React UI components
│   │   ├── ui/                  # Buttons, Modals, Loaders, etc. (e.g., ShadCN/UI)
│   │   ├── game/                # React components specific to the game UI
│   │   │   ├── GameCanvas.tsx   # Hosts the Three.js game
│   │   │   └── GameOverlay.tsx  # Score, lives, game over UI
│   │   └── layout/              # Layout specific components (Header, Footer)
│   │
│   ├── lib/                     # Core application logic (non-UI)
│   │   ├── game/                # All Three.js game-specific logic
│   │   │   ├── GameEngine.ts    # Main orchestrator
│   │   │   │
│   │   │   ├── core/            # Fundamental engine systems
│   │   │   │   ├── RenderManager.ts
│   │   │   │   ├── CameraManager.ts
│   │   │   │   ├── InputHandler.ts
│   │   │   │   ├── ConfigurationSystem.ts
│   │   │   │   └── CollisionDetectionSystem.ts
│   │   │   │
│   │   │   ├── managers/        # Gameplay feature managers
│   │   │   │   ├── PlayerController.ts
│   │   │   │   ├── EnvironmentManager.ts
│   │   │   │   ├── ObstacleManager.ts
│   │   │   │   ├── CollectibleManager.ts
│   │   │   │   ├── PowerUpManager.ts
│   │   │   │   ├── DifficultyManager.ts
│   │   │   │   └── ScoringSystem.ts
│   │   │   │
│   │   │   ├── assets/          # Procedural Asset Factory and asset generation logic
│   │   │   │   ├── ProceduralAssetFactory.ts
│   │   │   │   ├── character/
│   │   │   │   │   └── ClownfishAsset.ts
│   │   │   │   ├── obstacles/
│   │   │   │   │   ├── CoralAsset.ts
│   │   │   │   │   └── ... (Rock, Clam, Pufferfish, Jellyfish, Shark)
│   │   │   │   ├── collectibles/
│   │   │   │   │   ├── BubbleAsset.ts
│   │   │   │   │   └── CoinAsset.ts
│   │   │   │   ├── powerups/
│   │   │   │   │   └── ... (Shield, Magnet, DoubleScore Assets)
│   │   │   │   └── environment/
│   │   │   │       ├── SeafloorAsset.ts
│   │   │   │       ├── KelpAsset.ts
│   │   │   │       └── WaterSurfaceAsset.ts
│   │   │   │
│   │   │   ├── services/        # Specialized services
│   │   │   │   ├── ShaderManager.ts
│   │   │   │   ├── LightingManager.ts
│   │   │   │   └── VisualEffectsService.ts
│   │   │   │
│   │   │   ├── shaders/         # GLSL shader code (organized by purpose)
│   │   │   │   ├── common/      # Reusable chunks (noise.glsl, lightingUtils.glsl)
│   │   │   │   ├── character/   # Shaders for the player character
│   │   │   │   ├── environment/ # Shaders for water, caustics, fog
│   │   │   │   ├── obstacles/   # Specific obstacle shaders
│   │   │   │   └── postprocessing/ # Shaders for bloom, DoF, etc.
│   │   │   │
│   │   │   ├── config/          # Game configuration files (difficulty, spawning)
│   │   │   │   └── gameConfig.ts
│   │   │   │
│   │   │   └── utils/           # Game-specific utility functions (math, helpers)
│   │   │       └── MathUtils.ts
│   │   │
│   │   ├── auth/                # Authentication logic (Clerk integration)
│   │   ├── db/                  # Drizzle ORM: schema, migrations, queries
│   │   │   ├── schema.ts
│   │   │   ├── index.ts         # DB client export
│   │   │   └── drizzle.config.ts # This might stay at root, or if possible, configured to look here
│   │   ├── hooks/               # Custom React hooks (e.g., useGameControls)
│   │   ├── store/               # UI State management (e.g., Zustand)
│   │   ├── types/               # Shared TypeScript types and interfaces
│   │   │   ├── game.ts
│   │   │   └── index.ts
│   │   └── utils/               # General application utilities (not game-specific)
│   │
│   ├── styles/                  # Global styles, TailwindCSS base
│   │   └── globals.css          # Or inside app/ for Next.js 13+ App Router convention
│   │
│   └── middleware.ts            # Next.js middleware (for Clerk, etc.) - lives in src/
│
├── public/                      # Static assets (favicons, images for UI not game, fonts)
│
├── .env.local                   # Environment variables
├── next.config.mjs
├── tsconfig.json
└── package.json