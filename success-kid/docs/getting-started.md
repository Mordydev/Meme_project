# Getting Started with Success Kid Community Platform

This guide will help you set up your development environment and understand the basic workflow for the Success Kid Community Platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js (v22.3+)** - [Download and install Node.js](https://nodejs.org/)
- **PNPM (v8.15.0+)** - Install with `npm install -g pnpm@8.15.0`
- **Docker Desktop** - [Download and install Docker](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download and install Git](https://git-scm.com/downloads)

## Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/success-kid-platform.git
   cd success-kid-platform
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   pnpm setup-env
   ```

   This script creates local environment files from the example templates. You'll need to update the values in `.env.local` with your actual configuration.

4. **Start required services**

   The platform requires PostgreSQL and Redis, which are configured to run in Docker:

   ```bash
   pnpm docker:up
   ```

   This command starts the services defined in `docker/development/docker-compose.yml`.

5. **Run migrations (if needed)**

   If this is your first time setting up the platform or there are new migrations:

   ```bash
   pnpm --filter @success-kid/backend migrate
   ```

## Running the Development Environment

1. **Start all services**

   ```bash
   pnpm dev
   ```

   This starts both the frontend and backend in development mode.

2. **Access the applications**

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:3001](http://localhost:3001)
   - API Documentation: [http://localhost:3001/documentation](http://localhost:3001/documentation)

## Development Workflow

### Common Commands

```bash
# Start development servers
pnpm dev

# Start only the frontend
pnpm --filter frontend dev

# Start only the backend
pnpm --filter @success-kid/backend dev

# Run all tests
pnpm test

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Build all packages and applications
pnpm build

# Create a new migration
pnpm --filter @success-kid/backend migrate:create migration_name
```

### Branch Workflow

1. Create a new branch from `develop`
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Implement your changes, commit using [conventional commits](https://www.conventionalcommits.org/)
   ```bash
   git commit -m "feat: add new feature"
   ```

3. Push your branch and create a PR against `develop`
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. After review and approval, your changes will be merged

## Project Structure Overview

- `apps/frontend` - Next.js web application
- `apps/backend` - Fastify API service
- `packages/ui` - Shared UI components
- `packages/types` - Shared TypeScript types
- `packages/utils` - Common utilities
- `docs` - Project documentation
- `e2e` - End-to-end tests

## Troubleshooting

### Common Issues

#### Docker Services Not Running

```bash
# Check docker status
docker ps

# Stop all containers and restart
pnpm docker:down
pnpm docker:up
```

#### PNPM Installation Issues

```bash
# Clear pnpm store
pnpm store prune

# Try reinstalling
rm -rf node_modules
pnpm install
```

#### Port Conflicts

If you have port conflicts (3000 or 3001 already in use):

- Check for running processes using those ports
- Update the port in the respective configuration files
- For frontend: `apps/frontend/.env.local` (NEXT_PUBLIC_PORT)
- For backend: `apps/backend/.env.local` (PORT)

## Next Steps

- Explore the [Architecture Overview](./architecture/overview.md)
- Learn about our [Monorepo Structure](./monorepo-guide.md)
- Review our [Testing Strategy](./testing-strategy.md)
- See the [Component Library](http://localhost:6006) (when Storybook is running)
