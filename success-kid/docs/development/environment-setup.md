# Development Environment Setup

This guide details how to set up a development environment for the Success Kid Community Platform.

## Prerequisites

The following tools are required for development:

| Tool | Version | Purpose | Installation Guide |
|------|---------|---------|-------------------|
| **Node.js** | 22.3+ | JavaScript runtime | [nodejs.org](https://nodejs.org/) |
| **PNPM** | 8.15.0+ | Package manager | `npm install -g pnpm@8.15.0` |
| **Docker** | Latest | Container runtime | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com/downloads) |
| **VS Code** (recommended) | Latest | Code editor | [code.visualstudio.com](https://code.visualstudio.com/) |

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/success-kid-platform.git
cd success-kid-platform
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

```bash
pnpm setup-env
```

This creates a `.env.local` file from the example template. You'll need to update these values with your own configuration.

#### Required Environment Variables

**Frontend (.env.local)**

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | URL for backend API | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:3001` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk authentication key | `pk_test_...` |

**Backend (.env.local)**

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/success_kid` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `CLERK_SECRET_KEY` | Clerk auth secret | `sk_test_...` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |

### 4. Start Development Services

Start the required services using Docker:

```bash
pnpm docker:up
```

This starts:
- PostgreSQL database on port 5432
- Redis server on port 6379

### 5. Initialize the Database (First Time)

```bash
pnpm --filter @success-kid/backend migrate
```

## Running the Development Environment

### Start All Services

```bash
pnpm dev
```

This starts both the frontend and backend in development mode:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)
- API Documentation: [http://localhost:3001/documentation](http://localhost:3001/documentation)
- Storybook: [http://localhost:6006](http://localhost:6006) (if storybook is running)

### Start Individual Services

```bash
# Start only the frontend
pnpm --filter frontend dev

# Start only the backend
pnpm --filter @success-kid/backend dev

# Start Storybook
pnpm --filter frontend storybook
```

## Recommended VS Code Setup

### Recommended Extensions

- **ESLint** - Integrates ESLint into VS Code
- **Prettier** - Code formatter
- **Tailwind CSS IntelliSense** - Intelligent Tailwind CSS completion
- **TypeScript Error Translator** - Human-friendly TypeScript errors
- **Jest Runner** - Run and debug Jest tests
- **Thunder Client** - REST API client
- **Playwright Test** - Run and debug E2E tests

### Workspace Settings

Create a `.vscode/settings.json` file in your project:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnPaste": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "javascript.updateImportsOnFileMove.enabled": "always",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Common Development Tasks

### Creating a New Backend Endpoint

1. Create a new file in the appropriate `apps/backend/src/api` directory
2. Implement the endpoint with proper validation and documentation
3. Register the route in the appropriate router file
4. Add tests in the `__tests__` directory

### Creating a New Frontend Component

1. Create a new component file in `apps/frontend/src/components`
2. Implement the component with TypeScript props and styling
3. Create a story file for Storybook documentation
4. Add tests in the `__tests__` directory

### Running Tests

```bash
# Run all tests
pnpm test

# Run frontend tests
pnpm --filter frontend test

# Run backend tests
pnpm --filter @success-kid/backend test

# Run E2E tests
pnpm test:e2e
```

### Linting and Formatting

```bash
# Run linting checks
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Type Checking

```bash
# Check types across all workspaces
pnpm type-check

# Check types for frontend only
pnpm type-check:frontend

# Check types for backend only
pnpm type-check:backend
```

## Docker Commands

```bash
# Start development services
pnpm docker:up

# Stop development services
pnpm docker:down

# Restart development services
pnpm docker:restart

# View Docker container logs
docker logs -f success-kid-postgres
docker logs -f success-kid-redis
```

## Database Management

### Creating a Migration

```bash
pnpm --filter @success-kid/backend migrate:create migration_name
```

This will create a new migration file in the `apps/backend/migrations` directory.

### Running Migrations

```bash
pnpm --filter @success-kid/backend migrate
```

### Database Reset (Development Only)

```bash
# Stop services
pnpm docker:down

# Remove volumes
docker volume rm success-kid_postgres-data

# Start services
pnpm docker:up

# Run migrations
pnpm --filter @success-kid/backend migrate
```

## Troubleshooting

### Common Issues

#### Module Not Found Errors

```bash
pnpm install
```

#### Port Conflicts

Check if the ports are already in use and kill those processes:

```bash
# For macOS/Linux
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs -f success-kid-postgres
```

#### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Check logs
docker logs -f success-kid-redis
```

#### Storybook Issues

```bash
# Reset Storybook cache
pnpm --filter frontend rimraf ./node_modules/.cache/storybook
```

## Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Fastify Documentation](https://fastify.dev/docs/latest/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PNPM Documentation](https://pnpm.io/motivation)
- [Docker Documentation](https://docs.docker.com/)
