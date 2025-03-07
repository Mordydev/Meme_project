# Wild 'n Out Meme Coin Platform

This is the official monorepo for the Wild 'n Out Meme Coin Platform, combining Nick Cannon's Wild 'n Out entertainment legacy with innovative technology to create a vibrant community where creativity, competition, and authentic engagement thrive.

## Project Structure

This repository is organized as a monorepo using Turborepo:

```
wildnout-platform/
├── apps/                  # Standalone applications
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # Fastify backend application
├── packages/              # Shared code and utilities
│   ├── ui/                # Shared UI components
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utility functions
└── docs/                  # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker and Docker Compose (optional, for local services)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Using npm
npm install

# Using yarn
yarn install
```

3. Set up environment variables:

```bash
# For frontend
cp apps/frontend/.env.example apps/frontend/.env.local

# For backend
cp apps/backend/.env.example apps/backend/.env
```

4. (Optional) Start local services:

```bash
docker-compose up -d
```

### Development

To start all applications in development mode:

```bash
npm run dev
```

To start only the frontend or backend:

```bash
# Frontend only
npm run dev --filter=@wildnout/frontend

# Backend only
npm run dev --filter=@wildnout/backend
```

To build all applications:

```bash
npm run build
```

To run linting on all packages:

```bash
npm run lint
```

To run tests on all packages:

```bash
npm test
```

## Documentation

Detailed documentation can be found in the `docs` directory:

- [Development Guide](docs/development.md): Setup and workflows
- [Testing Guide](docs/testing.md): Testing approach and guidelines

## Git Workflow

We follow GitFlow with the following branches:
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `release/*`: Release preparation branches
- `hotfix/*`: Production hotfix branches

## License

Copyright © 2025 Wild 'n Out. All rights reserved.
