# Success Kid Community Platform

A vibrant ecosystem where crypto enthusiasts and meme lovers alike can connect, engage, and create value together.

## Repository Structure

This is a monorepo managed with Turborepo and PNPM workspaces, containing both applications and shared packages:

```
success-kid-platform/
├── apps/                      # Application packages
│   ├── frontend/              # Next.js web application
│   └── backend/               # Fastify API service
├── packages/                  # Shared libraries
│   ├── ui/                    # Shared UI components
│   ├── types/                 # Shared TypeScript types
│   ├── config/                # Shared configuration
│   └── utils/                 # Common utilities
├── docs/                      # Project documentation
├── turbo.json                 # Turborepo configuration
└── package.json               # Root package configuration
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- PNPM 8.15.0 or later

### Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up your environment:

```bash
pnpm setup-env
```

This will create a `.env.local` file from the example if it doesn't exist already. Make sure to update the values in `.env.local` with your actual configuration.

3. Start the development services (PostgreSQL and Redis):

```bash
pnpm docker:up
```

4. Run development servers:

```bash
pnpm dev
```

This will start both the frontend and backend in development mode.

### Development Environment

The project uses Docker for consistent development environments:

- **PostgreSQL 17.2**: Primary database (available at localhost:5432)
- **Redis 8.2**: Caching and real-time features (available at localhost:6379)

To manage Docker services:

```bash
# Start services
pnpm docker:up

# Stop services
pnpm docker:down

# Restart services
pnpm docker:restart
```

### Building

To build all applications and packages:

```bash
pnpm build
```

### Testing

To run tests across all workspaces:

```bash
pnpm test
```

### Linting

To lint all code:

```bash
pnpm lint
```

## Dependency Management Strategy

This repository uses PNPM workspaces for efficient dependency management:

- **Workspace Dependencies**: Use `"workspace:*"` to reference other packages within the monorepo
- **Shared Dependencies**: Common dependencies (React, TypeScript, etc.) are defined at the root level
- **Specific Dependencies**: Application-specific dependencies are defined in their respective package.json files

## Monorepo Structure Guidelines

### Adding a New Package

1. Create a new directory in the appropriate location (apps/ or packages/)
2. Add a package.json with appropriate configurations
3. Update package references where needed
4. Run `pnpm install` to update workspace dependencies

### Shared Packages Best Practices

- Keep packages focused on a single responsibility
- Expose a clear public API through index.ts/index.js files
- Document dependencies and potential breaking changes
- Maintain backward compatibility when possible

## Configuration

### Common Configuration Files

- **ESLint**: Extends from @success-kid/config/eslint
- **TypeScript**: Extends from @success-kid/config/typescript
- **Prettier**: Uses @success-kid/config/prettier
- **Jest**: Extends from @success-kid/config/jest

These configurations are shared across all packages to ensure consistency.

## Environment Configuration

The project uses a structured approach to environment variables:

- `.env.example`: Template with all required variables (committed to repository)
- `.env.local`: Local development variables (not committed, created from example)
- `.env.test`: Testing environment variables (committed to repository)
- `.env.staging`: Staging environment variables (committed to repository)

### Required Environment Variables

#### Frontend Variables
- `NEXT_PUBLIC_API_URL`: URL for the backend API
- `NEXT_PUBLIC_WS_URL`: WebSocket URL for real-time features
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication publishable key

#### Backend Variables
- `PORT`: Port for the backend server (default: 3001)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CLERK_SECRET_KEY`: Clerk authentication secret key
- `JWT_SECRET`: Secret for JWT token generation
- `CORS_ORIGIN`: Allowed CORS origin

### Environment Validation

All environment variables are validated at runtime using Zod schemas to ensure type safety and prevent runtime errors due to missing or invalid configuration.

## Contributing

1. Create a new branch from the latest `main`
2. Make your changes following the project's coding standards
3. Write tests for your changes
4. Ensure all tests and linting pass
5. Submit a pull request

## License

This project is private and not available for redistribution.
